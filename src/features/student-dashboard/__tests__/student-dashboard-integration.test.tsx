import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Cookies from 'js-cookie';
import { describe, expect, it, beforeEach } from 'vitest';

import { AUTH_COOKIE, encode, sanitizeUser } from '@/testing/mocks/utils';
import { db } from '@/testing/mocks/db';
import {
  getStudentGeneralDashboard,
  getStudentProjectByEvent,
  getStudentProjectResults,
  updateStudentProject,
  StudentGeneralDashboardView,
  StudentProjectDashboardView,
} from '@/features/student-dashboard';

const authenticateTestUser = async (email: string) => {
  let user = db.user.findFirst({
    where: { email: { equals: email } },
  });
  if (!user) {
    user = db.user.create({
      id: `test-${email}`,
      firstName: 'Estudiante',
      lastName: 'Prueba',
      email,
      role: 'USER',
      active: true,
      status: 'ACTIVE',
      platformRoles: [{ id: 2, name: 'User', scope: 'platform' }],
      platformPermissions: [],
    } as any);
  }
  const token = encode(sanitizeUser(user));
  Cookies.set(AUTH_COOKIE, token);
  return user;
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('Student Dashboard Backend Integration (MSW Mock Server)', () => {
  beforeEach(() => {
    Cookies.remove(AUTH_COOKIE);
  });

  it('Endpoint 1: GET /students/me/dashboard retorna KPIs, proyecto activo y trayectoria del estudiante autenticado', async () => {
    await authenticateTestUser('maria@iris.com');

    const data = await getStudentGeneralDashboard();

    expect(data.profile.email).toBe('maria@iris.com');
    expect(data.kpis).toEqual({
      totalFairs: 3,
      totalProjects: 2,
      totalAwards: 1,
    });
    expect(data.currentProject).toMatchObject({
      id: 'proj-reg-003',
      eventId: 3,
      enrollmentStatus: 'APPROVED',
      canEdit: false,
      participantsCount: 2,
      documentsCount: 2,
    });
    expect(data.evaluation).toEqual({
      resultsPublished: true,
      finalScore: 4.38,
    });
    expect(data.trajectory).toHaveLength(2);
    expect(data.trajectory[0].certificates?.[0].downloadUrl).toBe(
      '/api/certificates/cert-reg-1/download',
    );
  });

  it('Endpoint 2: GET /events/:eventId/my-project respeta las reglas de negocio de canEdit en eventos activos vs históricos', async () => {
    // Caso 1: Estudiante con REQUEST_CHANGES en feria activa -> canEdit: true
    await authenticateTestUser('student.review@iris.com');
    const activeReviewProject = await getStudentProjectByEvent(3);
    expect(activeReviewProject).not.toBeNull();
    expect(activeReviewProject?.enrollmentStatus).toBe('REQUEST_CHANGES');
    expect(activeReviewProject?.canEdit).toBe(true);

    // Caso 2: Evento histórico cerrado (eventId = 2) -> canEdit: false
    const historicalProject = await getStudentProjectByEvent(2);
    expect(historicalProject).not.toBeNull();
    expect(historicalProject?.eventId).toBe(2);
    expect(historicalProject?.canEdit).toBe(false);

    // Caso 3: Evento donde el estudiante no participó -> null (404)
    const missingProject = await getStudentProjectByEvent(999);
    expect(missingProject).toBeNull();
  });

  it('Endpoint 3: GET /events/:eventId/my-project/results aplica gating de publicación y anonimización estricta', async () => {
    // Caso A: Pre-publicación (resultsPublished = false) -> No expone notas parciales ni jurados
    await authenticateTestUser('student.prepub@iris.com');
    const prepubResults = await getStudentProjectResults(3);
    expect(prepubResults).toEqual({
      resultsPublished: false,
    });
    expect(prepubResults?.finalScore).toBeUndefined();
    expect(prepubResults?.criteriaScores).toBeUndefined();

    // Caso B: Resultados publicados (resultsPublished = true) -> Entrega promedios y feedback anónimo
    await authenticateTestUser('maria@iris.com');
    const publishedResults = await getStudentProjectResults(3);
    expect(publishedResults?.resultsPublished).toBe(true);
    expect(publishedResults?.finalScore).toBe(4.38);
    expect(publishedResults?.ranking?.position).toBe(3);
    expect(publishedResults?.criteriaScores).toHaveLength(4);
    expect(publishedResults?.consolidatedFeedback).toContain('Solución sólida');
    expect(JSON.stringify(publishedResults)).not.toContain('evaluatorId');
  });

  it('Endpoint 4: PATCH /projects/:projectId actualiza propuesta en REQUEST_CHANGES (pasa a UNDER_REVIEW) y bloquea con 403 si está APPROVED', async () => {
    // 1. Permitido cuando está en REQUEST_CHANGES
    await authenticateTestUser('student.review@iris.com');
    const updated = await updateStudentProject({
      projectId: 'proj-review-001',
      data: {
        name: 'Optimizador de Rutas Masivas v2 (Revisado)',
        description: 'Resumen técnico ajustado según comité.',
      },
    });

    expect(updated.name).toBe('Optimizador de Rutas Masivas v2 (Revisado)');
    expect(updated.enrollmentStatus).toBe('UNDER_REVIEW');
    expect(updated.canEdit).toBe(false);

    // Verificar que persiste en el servidor mock al volver a consultar Endpoint 2
    const refetched = await getStudentProjectByEvent(3);
    expect(refetched?.name).toBe('Optimizador de Rutas Masivas v2 (Revisado)');
    expect(refetched?.enrollmentStatus).toBe('UNDER_REVIEW');
    expect(refetched?.canEdit).toBe(false);

    // 2. Bloqueado con 403 Forbidden cuando el proyecto ya está APPROVED
    await authenticateTestUser('maria@iris.com');
    await expect(
      updateStudentProject({
        projectId: 'proj-reg-003',
        data: {
          name: 'Intento de edición no autorizado',
          description: 'No debería permitirse',
        },
      }),
    ).rejects.toThrow(
      'El proyecto ya se encuentra aprobado y no admite modificaciones directas',
    );
  });

  it('Endpoint 5: GET /certificates/:certificateId/download entrega PDF (200) si está emitido y 409 Conflict si está en trámite', async () => {
    await authenticateTestUser('carlos@iris.com');

    // Certificado emitido -> 200 OK application/pdf
    const issuedRes = await fetch('/api/certificates/cert-h-prev-1/download');
    expect(issuedRes.status).toBe(200);
    expect(issuedRes.headers.get('content-type')).toContain('application/pdf');
    expect(issuedRes.headers.get('content-disposition')).toContain(
      'Diploma_cert-h-prev-1.pdf',
    );

    // Certificado en trámite (isIssued: false) -> 409 Conflict
    const pendingRes = await fetch('/api/certificates/cert-h-curr/download');
    expect(pendingRes.status).toBe(409);
    const pendingBody = await pendingRes.json();
    expect(pendingBody.message).toBe(
      'El certificado aún se encuentra en trámite de emisión institucional',
    );
  });

  it('Renderiza StudentGeneralDashboardView y StudentProjectDashboardView consumiendo el Mock Server vía HTTP', async () => {
    await authenticateTestUser('student.review@iris.com');
    const Wrapper = createWrapper();

    const { unmount } = render(<StudentGeneralDashboardView />, {
      wrapper: Wrapper,
    });

    const projectHeadings = await screen.findAllByText(
      'Optimizador de Rutas para Transporte Masivo',
    );
    expect(projectHeadings.length).toBeGreaterThan(0);
    expect(screen.getByText('2 Integrantes')).toBeInTheDocument();
    expect(screen.getByText('1 Documentos entregados')).toBeInTheDocument();

    unmount();

    // Renderizar ficha del proyecto y probar flujo completo de edición vía PATCH /projects/:id
    render(<StudentProjectDashboardView eventId={3} />, {
      wrapper: createWrapper(),
    });

    const editButton = await screen.findByRole('button', {
      name: /Modificar Proyecto/i,
    });
    await userEvent.click(editButton);

    const titleInput = screen.getByLabelText(/Título del Proyecto/i);
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, 'Optimizador Inteligente Transmetro 2026');

    const saveButton = screen.getByRole('button', {
      name: /Guardar Cambios/i,
    });
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(
        screen.getAllByText('Optimizador Inteligente Transmetro 2026').length,
      ).toBeGreaterThan(0);
    });
    expect(
      screen.getByText('Inscripción en Proceso de Revisión'),
    ).toBeInTheDocument();
  });
});
