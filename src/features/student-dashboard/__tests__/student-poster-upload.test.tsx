import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { server } from '@/testing/mocks/server';
import { StudentProjectSection } from '../components/student-project-section';
import { StudentProjectDashboardView } from '../components/student-project-dashboard-view';
import {
  resolveStudentDocumentHref,
  validatePosterFile,
  validateSupportingFiles,
} from '../utils/document-validation';
import type { StudentProjectInfo } from '../types';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/app/events/3/dashboard',
  useSearchParams: () => new URLSearchParams(),
}));

const VALID_PDF_BYTES = new Uint8Array([
  0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37,
]);
const VALID_PNG_BYTES = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

const makeValidPdf = (name = 'poster-final.pdf') =>
  new File([VALID_PDF_BYTES], name, { type: 'application/pdf' });

const makeApprovedProject = (
  overrides: Partial<StudentProjectInfo> = {},
): StudentProjectInfo => ({
  id: 42,
  eventId: 3,
  eventName: 'Feria de Ingeniería 2026-2',
  projectCode: '12',
  name: 'Sistema de Monitoreo Solar',
  description: 'Proyecto aprobado en evento vigente.',
  categoryName: 'Sistemas',
  enrollmentStatus: 'APPROVED',
  canEdit: false,
  isCurrent: true,
  evaluationsOpened: false,
  documents: [
    {
      id: '99',
      type: 'POSTER',
      title: 'Póster del proyecto',
      url: 'https://storage.example/poster-old.pdf',
    },
  ],
  participants: [],
  ...overrides,
});

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function TestQueryWrapper({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('document-validation (integridad de archivos de estudiante)', () => {
  it('acepta PDF/PNG reales y rechaza archivos vacíos, >4MB, extensión inválida o firma falsificada', async () => {
    expect(await validatePosterFile(makeValidPdf())).toBeNull();
    expect(
      await validatePosterFile(
        new File([VALID_PNG_BYTES], 'poster.png', { type: 'image/png' }),
      ),
    ).toBeNull();

    expect(
      await validatePosterFile(new File([], 'vacio.pdf', { type: 'application/pdf' })),
    ).toMatch(/vacío/i);

    const oversized = makeValidPdf('enorme.pdf');
    Object.defineProperty(oversized, 'size', { value: 5 * 1024 * 1024 });
    expect(await validatePosterFile(oversized)).toMatch(/4 MB/i);

    expect(
      await validatePosterFile(
        new File([VALID_PDF_BYTES], 'script.html', { type: 'text/html' }),
      ),
    ).toMatch(/no permitido/i);

    expect(
      await validatePosterFile(
        new File(['<html><script>alert(1)</script></html>'], 'fake.pdf', {
          type: 'application/pdf',
        }),
      ),
    ).toMatch(/no corresponde/i);

    expect(await validateSupportingFiles([])).toMatch(/al menos un documento/i);
  });

  it('usa enlace estable /api/projects/:id/documents/:docId/open cuando los IDs son reales y bloquea javascript:', () => {
    expect(
      resolveStudentDocumentHref(
        { id: '99', url: 'https://expired-sas.example/file.pdf' },
        42,
      ),
    ).toBe('/api/projects/42/documents/99/open');

    expect(
      resolveStudentDocumentHref(
        { id: 'document-0', url: 'javascript:alert(1)' },
        42,
      ),
    ).toBe('#');
  });
});

describe('Hotfix: edición y subida de póster en StudentProjectSection / StudentProjectDashboardView', () => {
  it('permite cambiar el póster en proyecto APPROVED vigente aunque metadatos digan Edición no disponible', async () => {
    const onUploadPoster = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(
      <StudentProjectSection
        project={makeApprovedProject()}
        onUploadPoster={onUploadPoster}
      />,
    );

    expect(screen.getByText('Edición no disponible')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Cambiar póster/i }),
    ).toBeEnabled();

    const input = screen.getByLabelText(/Seleccionar archivo de póster/i);
    const newPoster = makeValidPdf('nuevo-poster.pdf');
    await user.upload(input, newPoster);

    await waitFor(() => expect(onUploadPoster).toHaveBeenCalledTimes(1));
    expect(onUploadPoster.mock.calls[0][0]).toBe(newPoster);
    expect(onUploadPoster.mock.calls[0][1]?.id).toBe('99');
  });

  it('bloquea archivos falsificados antes de invocar la carga al backend', async () => {
    const onUploadPoster = vi.fn();
    const user = userEvent.setup({ applyAccept: false });

    render(
      <StudentProjectSection
        project={makeApprovedProject({ documents: [] })}
        onUploadPoster={onUploadPoster}
      />,
    );

    expect(
      screen.getByRole('button', { name: /Subir póster/i }),
    ).toBeEnabled();

    const input = screen.getByLabelText(/Seleccionar archivo de póster/i);
    await user.upload(
      input,
      new File(['<html>malicioso</html>'], 'fake.pdf', {
        type: 'application/pdf',
      }),
    );

    expect(
      await screen.findByRole('alert'),
    ).toHaveTextContent(/no corresponde a un PDF/i);
    expect(onUploadPoster).not.toHaveBeenCalled();
  });

  it('con las evaluaciones abiertas solo ofrece cambiar y reemplazar (PATCH), no subir documentos nuevos (POST)', () => {
    render(
      <StudentProjectSection
        project={makeApprovedProject({
          evaluationsOpened: true,
          documents: [
            {
              id: '99',
              type: 'POSTER',
              title: 'Póster del proyecto',
              url: 'https://storage.example/poster-old.pdf',
            },
            {
              id: '100',
              type: 'SUPPORTING_DOCUMENT',
              title: 'Documento de soporte',
              url: 'https://storage.example/soporte.pdf',
            },
          ],
        })}
        onReplaceSupportingDocument={vi.fn()}
        onUploadPoster={vi.fn()}
        onUploadSupportingDocuments={vi.fn()}
      />,
    );
    expect(
      screen.getByRole('button', { name: /Cambiar póster/i }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole('button', { name: /Reemplazar/i }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryByRole('button', { name: /Subir soporte/i }),
    ).not.toBeInTheDocument();
  });

  it.each([
    ['con las evaluaciones del evento abiertas', { evaluationsOpened: true }],
    ['sin saber si las evaluaciones están abiertas', { evaluationsOpened: undefined }],
  ])('sin póster, no ofrece subirlo %s', (_label, overrides) => {
    render(
      <StudentProjectSection
        project={makeApprovedProject({ ...overrides, documents: [] })}
        onUploadPoster={vi.fn()}
        onUploadSupportingDocuments={vi.fn()}
      />,
    );
    expect(
      screen.queryByRole('button', { name: /Subir póster|Subir soporte/i }),
    ).not.toBeInTheDocument();
  });

  it('oculta botones de carga en eventos pasados (isCurrent: false) o proyectos REJECTED', () => {
    const onUploadPoster = vi.fn();

    const { rerender } = render(
      <StudentProjectSection
        project={makeApprovedProject({ isCurrent: false })}
        onUploadPoster={onUploadPoster}
      />,
    );
    expect(
      screen.queryByRole('button', { name: /Cambiar póster|Subir póster/i }),
    ).not.toBeInTheDocument();

    rerender(
      <StudentProjectSection
        project={makeApprovedProject({ enrollmentStatus: 'REJECTED' })}
        onUploadPoster={onUploadPoster}
      />,
    );
    expect(
      screen.queryByRole('button', { name: /Cambiar póster|Subir póster/i }),
    ).not.toBeInTheDocument();
  });

  it('envía PATCH /projects/documents/:id al reemplazar póster y POST /projects/:id/documents al subir uno nuevo', async () => {
    let patchCalledWithId = '';
    let patchBodyText = '';
    let postCalledForProjectId = '';
    let postBodyText = '';
    let hasExistingPoster = true;

    server.use(
      http.get('*/api/auth/me', () =>
        HttpResponse.json({
          data: {
            id: 'user-10',
            firstName: 'Ana',
            lastName: 'Pérez',
            email: 'ana@uninorte.edu.co',
            platformPermissions: [],
            platformRoles: [],
          },
        }),
      ),
      http.get('*/api/students/me/dashboard', () =>
        HttpResponse.json({
          profile: {
            id: 'user-10',
            firstName: 'Ana',
            lastName: 'Pérez',
            email: 'ana@uninorte.edu.co',
            career: 'Ingeniería de Sistemas',
            semester: 8,
            studentCode: '200100100',
          },
          stats: { totalFairs: 1, totalProjects: 1, totalAwards: 0 },
          currentProject: {
            id: 42,
            eventId: 3,
            eventName: 'Feria 2026-2',
            projectCode: '12',
            name: 'Sistema de Monitoreo Solar',
            enrollmentStatus: 'APPROVED',
            documentsCount: hasExistingPoster ? 1 : 0,
            participantsCount: 1,
          },
          trajectory: [],
          certificates: [],
        }),
      ),
      http.get('*/api/events/3/my-project', () =>
        HttpResponse.json({
          project: {
            id: 42,
            eventId: 3,
            name: 'Sistema de Monitoreo Solar',
            description: 'Proyecto aprobado',
            state: 'APPROVED',
            projectCode: '12',
            documents: hasExistingPoster
              ? [
                  {
                    id: 99,
                    type: 'POSTER',
                    url: 'https://storage.example/poster-old.pdf',
                    state: 'ACTIVE',
                  },
                ]
              : [],
            participants: [],
          },
          event: {
            id: 3,
            name: 'Feria 2026-2',
            endDate: '2099-12-31T23:59:59Z',
            evaluationsOpened: false,
          },
        }),
      ),
      http.get('*/api/events/3/my-project/results', () =>
        HttpResponse.json({
          resultsPublished: false,
          evaluated: false,
          finalScore: null,
          maxScore: 5,
          ranking: null,
          criteriaScores: [],
          consolidatedFeedback: '',
        }),
      ),
      http.patch('*/api/projects/documents/:documentId', async ({ params, request }) => {
        patchCalledWithId = String(params.documentId);
        patchBodyText = await request.text();
        return HttpResponse.json({ document: { id: 99, type: 'POSTER' } });
      }),
      http.post('*/api/projects/:projectId/documents', async ({ params, request }) => {
        postCalledForProjectId = String(params.projectId);
        postBodyText = await request.text();
        hasExistingPoster = true;
        return HttpResponse.json({ documents: [{ id: 100, type: 'POSTER' }] }, { status: 201 });
      }),
    );

    const user = userEvent.setup();
    const { unmount } = render(<StudentProjectDashboardView eventId={3} />, {
      wrapper: createWrapper(),
    });

    // Caso 1: Proyecto APPROVED con póster existente -> PATCH /projects/documents/99
    expect(await screen.findByText('Edición no disponible')).toBeInTheDocument();
    const replaceInput = screen.getByLabelText(/Seleccionar archivo de póster/i);
    await user.upload(replaceInput, makeValidPdf('poster-v2.pdf'));

    await waitFor(() => expect(patchCalledWithId).toBe('99'));
    expect(patchBodyText).toContain('name="file"');
    expect(patchBodyText).toContain('POSTER');

    unmount();

    // Caso 2: Proyecto APPROVED sin póster previo -> POST /projects/42/documents
    hasExistingPoster = false;
    render(<StudentProjectDashboardView eventId={3} />, {
      wrapper: createWrapper(),
    });

    expect(
      await screen.findByRole('button', { name: /Subir póster/i }),
    ).toBeEnabled();
    const createInput = screen.getByLabelText(/Seleccionar archivo de póster/i);
    await user.upload(createInput, makeValidPdf('poster-nuevo.pdf'));

    await waitFor(() => expect(postCalledForProjectId).toBe('42'));
    expect(postBodyText).toContain('name="files"');
    expect(postBodyText).toContain('POSTER');
  });
});

