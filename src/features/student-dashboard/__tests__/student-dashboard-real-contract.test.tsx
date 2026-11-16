import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Cookies from 'js-cookie';
import { HttpResponse, http } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { AUTH_COOKIE, encode, sanitizeUser } from '@/testing/mocks/utils';
import { db } from '@/testing/mocks/db';
import { server } from '@/testing/mocks/server';
import {
  StudentGeneralDashboardView,
  StudentProjectDashboardView,
  adaptStudentProject,
  formatScore,
  formatScoreWithMax,
  scorePercentOf,
} from '@/features/student-dashboard';

/**
 * Pruebas contra la forma REAL de las respuestas del gateway (no la de los escenarios mock):
 * campos nulos, `{ project, event }` en my-project y escala de notas definida por el evento.
 */

const realDashboard = {
  profile: {
    id: 2,
    firstName: 'Aki',
    lastName: 'Hayakawa',
    email: 'aki@iris.local',
    studentCode: '200145892',
    career: 'Ingeniería de Sistemas y Computación',
    semester: 8,
  },
  kpis: { totalFairs: 3, totalProjects: 3, totalAwards: 1 },
  currentProject: {
    id: 9,
    eventId: 4,
    eventName: 'Feria de Proyectos 2026-30',
    semester: '2026-30',
    projectCode: 'PROY-2026-101',
    name: 'Plataforma de trazabilidad de residuos',
    description: 'Seguimiento de residuos reciclables.',
    categoryName: 'Ingeniería de Sistemas',
    enrollmentStatus: 'APPROVED',
    canEdit: false,
    participantsCount: 3,
    documentsCount: 2,
  },
  evaluation: { resultsPublished: false, finalScore: null },
  trajectory: [
    {
      id: 9,
      eventId: 4,
      semester: '2026-30',
      eventName: 'Feria de Proyectos 2026-30',
      courseName: 'Ingeniería de Sistemas',
      projectName: 'Plataforma de trazabilidad de residuos',
      finalScore: null,
      award: null,
      isCurrent: true,
      certificates: [],
    },
    {
      id: 4,
      eventId: 2,
      semester: '2025-30',
      eventName: 'Feria de Proyectos 2025-30',
      courseName: null,
      projectName: 'Asistente de tutorías con IA',
      finalScore: null,
      award: null,
      isCurrent: false,
      certificates: [],
    },
    {
      id: 1,
      eventId: 1,
      semester: '2025-10',
      eventName: 'Feria de Proyectos 2025-10',
      courseName: 'Ingeniería de Sistemas',
      projectName: 'Sistema de riego inteligente',
      finalScore: 81,
      award: 'Segundo puesto',
      isCurrent: false,
      certificates: [],
    },
  ],
  bySemester: [],
};

const realMyProject = (overrides: Record<string, unknown> = {}) => ({
  project: {
    id: 1,
    eventId: 1,
    name: 'Sistema de riego inteligente',
    description: 'Riego automatizado con sensores de humedad.',
    courseId: 1,
    state: 'APPROVED',
    projectCode: 'PROY-2025-001',
    participants: [
      {
        userId: 0,
        projectId: 1,
        firstName: 'Aki',
        lastName: 'Hayakawa',
        email: 'aki@iris.local',
        ParticipantCode: '200145892',
        semester: '5',
        career: 'Ingeniería de Sistemas y Computación',
        status: '3',
      },
      {
        userId: 0,
        projectId: 1,
        firstName: 'Denji',
        lastName: 'Hayakawa',
        email: 'denji@iris.local',
        ParticipantCode: '200151234',
        semester: '5',
        career: 'Ingeniería de Sistemas y Computación',
        status: '2',
      },
    ],
    documents: [
      {
        id: 4,
        projectId: 1,
        url: 'https://example.test/poster.png',
        type: 'POSTER',
        state: 'ACTIVE',
        createdAt: '2025-04-20T10:00:00.000Z',
      },
      {
        id: 5,
        projectId: 1,
        url: 'https://example.test/borrador.png',
        type: 'SUPPORTING_DOCUMENT',
        state: 'INACTIVE',
        createdAt: '2025-04-20T10:00:00.000Z',
      },
    ],
    ...overrides,
  },
  event: {
    id: 1,
    name: 'Feria de Proyectos 2025-10',
    startDate: '2025-05-12T13:00:00.000Z',
    endDate: '2025-05-16T23:00:00.000Z',
    evaluationType: 3,
    resultsPublished: true,
  },
});

const realResults = {
  resultsPublished: true,
  evaluated: true,
  finalScore: 81,
  maxScore: 90,
  ranking: {
    position: 2,
    isWinner: false,
    isCoWinner: false,
    categoryName: 'Ingeniería de Sistemas',
    awardTitle: 'Segundo puesto',
  },
  criteriaScores: [
    {
      id: 3,
      criterion: 'Solución técnica',
      component: 'Desarrollo',
      weight: 30,
      score: 82.5,
      maxScore: 90,
    },
  ],
  consolidatedFeedback: 'Problema bien delimitado y buena defensa.',
};

const useRealBackendResponses = ({
  dashboard = realDashboard,
  myProject = realMyProject(),
  results = realResults,
}: {
  dashboard?: unknown;
  myProject?: unknown;
  results?: unknown;
} = {}) => {
  server.use(
    http.get('*/api/students/me/dashboard', () =>
      HttpResponse.json(dashboard as any),
    ),
    http.get('*/api/events/:eventId/my-project/results', () =>
      HttpResponse.json(results as any),
    ),
    http.get('*/api/events/:eventId/my-project', () =>
      HttpResponse.json(myProject as any),
    ),
  );
};

const authenticateTestUser = (email: string) => {
  let user = db.user.findFirst({ where: { email: { equals: email } } });
  if (!user) {
    user = db.user.create({
      id: `test-${email}`,
      firstName: 'Aki',
      lastName: 'Hayakawa',
      email,
      role: 'USER',
      active: true,
      status: 'ACTIVE',
      platformRoles: [{ id: 3, name: 'User', scope: 'platform' }],
      platformPermissions: [],
    } as any);
  }
  Cookies.set(AUTH_COOKIE, encode(sanitizeUser(user)));
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

describe('adaptStudentProject', () => {
  it('adapta la respuesta { project, event } del gateway', () => {
    const project = adaptStudentProject(realMyProject());

    expect(project).toMatchObject({
      id: 1,
      eventId: 1,
      eventName: 'Feria de Proyectos 2025-10',
      projectCode: 'PROY-2025-001',
      name: 'Sistema de riego inteligente',
      enrollmentStatus: 'APPROVED',
      canEdit: false,
      isCurrent: false,
      categoryName: null,
    });
    expect(project?.participants).toHaveLength(2);
    expect(project?.participants[0]).toMatchObject({
      id: 'aki@iris.local',
      studentCode: '200145892',
      semester: 5,
      status: 'joined',
    });
    expect(project?.participants[1].status).toBe('Invitado');
    // El documento inactivo no cuenta como entregado
    expect(project?.documents).toHaveLength(1);
    expect(project?.documents[0]).toMatchObject({
      id: '4',
      type: 'POSTER',
      title: 'Póster del proyecto',
    });
  });

  it('solo permite editar con cambios solicitados y el evento sin terminar', () => {
    const ended = adaptStudentProject(
      realMyProject({ state: 'REQUEST_CHANGES' }),
    );
    expect(ended?.canEdit).toBe(false);

    const payload = realMyProject({ state: 4 });
    payload.event.endDate = new Date(Date.now() + 86_400_000).toISOString();
    const ongoing = adaptStudentProject(payload);
    expect(ongoing?.enrollmentStatus).toBe('REQUEST_CHANGES');
    expect(ongoing?.canEdit).toBe(true);
    expect(ongoing?.isCurrent).toBe(true);
  });

  it('devuelve null si la respuesta no trae proyecto', () => {
    expect(adaptStudentProject(null)).toBeNull();
    expect(adaptStudentProject({})).toBeNull();
    expect(adaptStudentProject({ project: {} })).toBeNull();
  });
});

describe('formato de notas según la escala del evento', () => {
  it('no asume ninguna escala', () => {
    expect(formatScore(81)).toBe('81');
    expect(formatScore(86.25)).toBe('86.25');
    expect(formatScore(4.5)).toBe('4.5');
    expect(formatScoreWithMax(81, 90)).toBe('81 / 90');
    expect(formatScoreWithMax(4.38, 5)).toBe('4.38 / 5');
    expect(formatScoreWithMax(81, null)).toBe('81');
    expect(scorePercentOf(81, 90)).toBe(90);
    expect(scorePercentOf(81, undefined)).toBeNull();
  });
});

describe('Dashboard del estudiante con respuestas reales del gateway', () => {
  beforeEach(() => {
    Cookies.remove(AUTH_COOKIE);
    authenticateTestUser('aki@iris.local');
  });

  it('la vista general tolera notas, premios y categorías nulas sin inventar la escala', async () => {
    useRealBackendResponses();
    render(<StudentGeneralDashboardView />, { wrapper: createWrapper() });

    expect(
      await screen.findByText('Sistema de riego inteligente'),
    ).toBeInTheDocument();
    // El dashboard general no envía maxScore: la nota va sin denominador
    expect(screen.getByText(/Calificación:\s*81$/)).toBeInTheDocument();
    expect(screen.queryByText(/\/ 5\.00/)).not.toBeInTheDocument();
    expect(screen.getByText('Participación en curso')).toBeInTheDocument();
    expect(screen.getByText('Sin categoría')).toBeInTheDocument();
    // En la tarjeta del proyecto actual y en su entrada del historial
    expect(screen.getAllByText('Semestre 2026-30').length).toBeGreaterThan(0);
    expect(screen.queryByText(/2026-1$/)).not.toBeInTheDocument();
  });

  it('no muestra "null° Semestre" cuando el estudiante no tiene datos académicos', async () => {
    useRealBackendResponses({
      dashboard: {
        ...realDashboard,
        profile: {
          ...realDashboard.profile,
          studentCode: null,
          career: null,
          semester: null,
        },
        currentProject: null,
        evaluation: null,
        trajectory: [],
      },
    });
    render(<StudentGeneralDashboardView />, { wrapper: createWrapper() });

    expect(await screen.findByText('No registrado')).toBeInTheDocument();
    expect(screen.queryByText(/null/)).not.toBeInTheDocument();
    expect(screen.queryByText(/° Semestre/)).not.toBeInTheDocument();
  });

  it('la ficha de un evento muestra el proyecto, el equipo y la nota con la escala del evento', async () => {
    useRealBackendResponses();
    render(<StudentProjectDashboardView eventId={1} />, {
      wrapper: createWrapper(),
    });

    expect(
      (await screen.findAllByText('Sistema de riego inteligente')).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText('Feria de Proyectos 2025-10')).toBeInTheDocument();
    expect(screen.getByText('Historial de Proyecto')).toBeInTheDocument();
    expect(screen.getByText('Semestre 2025-10')).toBeInTheDocument();
    expect(screen.getAllByText('Inscripción Aprobada').length).toBeGreaterThan(
      0,
    );
    expect(screen.getByText('PROY-2025-001')).toBeInTheDocument();
    expect(screen.getByText('2 integrantes vinculados')).toBeInTheDocument();
    expect(screen.getByText('Denji Hayakawa')).toBeInTheDocument();
    expect(screen.getByText('Póster del proyecto')).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: /Resultados y Calificaciones/i }),
    );

    // Nota final y criterio, ambos sobre la escala que envía el backend
    expect(await screen.findAllByText('/ 90')).toHaveLength(2);
    expect(screen.getByText('90% de la puntuación máxima')).toBeInTheDocument();
    expect(screen.getByText('82.5')).toBeInTheDocument();
    expect(screen.getByText('Puesto 2')).toBeInTheDocument();
  });

  it('resultados publicados sin evaluación no se muestran como nota 0', async () => {
    useRealBackendResponses({
      results: {
        resultsPublished: true,
        evaluated: false,
        finalScore: null,
        maxScore: 90,
        ranking: null,
        criteriaScores: [],
        consolidatedFeedback: '',
      },
    });
    render(<StudentProjectDashboardView eventId={1} defaultTab="evaluation" />, {
      wrapper: createWrapper(),
    });

    expect(
      await screen.findByText('Sin evaluación registrada'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Puntaje Final Consolidado')).not.toBeInTheDocument();
    expect(screen.queryByText('4.85')).not.toBeInTheDocument();
  });

  it('sin proyecto en el evento no muestra el proyecto de otro evento', async () => {
    useRealBackendResponses();
    server.use(
      http.get('*/api/events/:eventId/my-project/results', () =>
        HttpResponse.json(
          { message: 'No project found for this user in the specified event' },
          { status: 404 },
        ),
      ),
      http.get('*/api/events/:eventId/my-project', () =>
        HttpResponse.json(
          { message: 'No project found for this user in the specified event' },
          { status: 404 },
        ),
      ),
    );
    render(<StudentProjectDashboardView eventId={7} />, {
      wrapper: createWrapper(),
    });

    expect(
      await screen.findByText('No tienes un proyecto en este evento'),
    ).toBeInTheDocument();
    // El proyecto actual del dashboard general es de otro evento (4) y no debe aparecer
    expect(
      screen.queryByText('Plataforma de trazabilidad de residuos'),
    ).not.toBeInTheDocument();
  });

  it('un fallo al consultar la ficha se muestra como error, no como estado vacío', async () => {
    useRealBackendResponses();
    server.use(
      http.get('*/api/events/:eventId/my-project', () =>
        HttpResponse.json({ message: 'Internal error' }, { status: 500 }),
      ),
    );
    render(<StudentProjectDashboardView eventId={1} />, {
      wrapper: createWrapper(),
    });

    expect(
      await screen.findByText('No pudimos cargar tu dashboard'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('No tienes un proyecto en este evento'),
    ).not.toBeInTheDocument();
  });

  it('consulta el dashboard general una sola vez al cargar', async () => {
    let dashboardRequests = 0;
    useRealBackendResponses();
    server.use(
      http.get('*/api/students/me/dashboard', () => {
        dashboardRequests += 1;
        return HttpResponse.json(realDashboard as any);
      }),
    );
    render(<StudentProjectDashboardView eventId={1} />, {
      wrapper: createWrapper(),
    });

    expect(
      (await screen.findAllByText('Sistema de riego inteligente')).length,
    ).toBeGreaterThan(0);
    expect(dashboardRequests).toBe(1);
  });

  it('muestra un error con reintento si el dashboard no se puede cargar', async () => {
    server.use(
      http.get('*/api/students/me/dashboard', () =>
        HttpResponse.json({ message: 'Internal error' }, { status: 500 }),
      ),
    );
    render(<StudentGeneralDashboardView />, { wrapper: createWrapper() });

    expect(
      await screen.findByText('No pudimos cargar tu dashboard'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Reintentar/i }),
    ).toBeInTheDocument();
  });
});
