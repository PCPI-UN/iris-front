import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { env } from '@/config/env';
import { server } from '@/testing/mocks/server';

import { PastEventDetail } from '../past-event-detail';

const createStorageMock = (): Storage => {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
  };
};

if (typeof window !== 'undefined') {
  if (!window.localStorage || typeof window.localStorage.getItem !== 'function') {
    Object.defineProperty(window, 'localStorage', {
      value: createStorageMock(),
      configurable: true,
      writable: true,
    });
  }
  if (!window.sessionStorage || typeof window.sessionStorage.getItem !== 'function') {
    Object.defineProperty(window, 'sessionStorage', {
      value: createStorageMock(),
      configurable: true,
      writable: true,
    });
  }
  if (typeof window.matchMedia !== 'function') {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  }
}

const renderWithQueryClient = (ui: ReactNode) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
};

describe('PastEventDetail - Ranking en eventos finalizados (IRIS-V3-EVT-01 §3.2.1 / S1-05)', () => {
  beforeEach(() => {
    window.sessionStorage?.clear?.();
  });

  test('muestra el ranking de ganadores en un evento finalizado con resultados publicados incluso para visitantes públicos sin sesión (cuando /with-jurors responde 401)', async () => {
    const eventId = 901;

    server.use(
      http.get(`*/events/public/past/${eventId}`, () => {
        return HttpResponse.json({
          data: {
            id: eventId,
            name: 'Feria de Innovación 2025',
            description: 'Evento finalizado con resultados publicados.',
            startDate: '2025-10-01T08:00:00Z',
            endDate: '2025-10-05T18:00:00Z',
            inscriptionDeadline: '2025-09-25',
            status: 4,
            statusName: 'CLOSED',
            active: false,
            eventType: 1,
            categories: [
              { id: 10, name: 'Ingeniería de Sistemas' },
              { id: 20, name: 'Ingeniería Civil' },
            ],
          },
        });
      }),
      http.get(`*/projects/by-event/${eventId}/with-jurors`, () => {
        return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }),
      http.get(`*/events/ranking-config/${eventId}`, () => {
        return HttpResponse.json({
          data: {
            id: 1,
            eventId,
            positions: 3,
            visiblePositions: 3,
            visibleInLanding: true,
            visibleScore: true,
          },
        });
      }),
      http.get(`*/events/${eventId}/rankings/public`, ({ request }) => {
        const url = new URL(request.url);
        const categoryId = Number(url.searchParams.get('categoryId') || 0);

        const allWinners = [
          {
            position: 1,
            projectId: 501,
            projectCode: 'PRJ-501',
            projectName: 'Sistema de Alerta Temprana',
            description: 'Predicción de deserción estudiantil con ML.',
            category: { id: 10, name: 'Ingeniería de Sistemas' },
            averageGrade: 4.85,
            participants: ['Esteban Ramírez', 'Jean Herrán'],
          },
          {
            position: 1,
            projectId: 502,
            projectCode: 'PRJ-502',
            projectName: 'Monitoreo Hidrológico Urbano',
            description: 'Modelado hidráulico de arroyos.',
            category: { id: 20, name: 'Ingeniería Civil' },
            averageGrade: 4.72,
            participants: ['Dayana Torres', 'Luis Márquez'],
          },
        ];

        const filtered =
          categoryId > 0
            ? allWinners.filter((w) => w.category.id === categoryId)
            : allWinners;

        return HttpResponse.json({ data: filtered });
      }),
    );

    renderWithQueryClient(<PastEventDetail eventId={eventId} />);

    expect(
      await screen.findByRole('heading', { name: /proyectos ganadores/i }),
    ).toBeInTheDocument();

    expect(
      await screen.findByRole('heading', { name: 'Sistema de Alerta Temprana' }),
    ).toBeInTheDocument();
    expect(screen.getByText('4.85')).toBeInTheDocument();
    expect(screen.getByText('Esteban Ramírez')).toBeInTheDocument();

    // Cambiar de categoría en las píldoras y verificar consistencia
    const civilTab = screen.getByRole('button', { name: /ingeniería civil/i });
    await userEvent.click(civilTab);

    expect(
      await screen.findByRole('heading', { name: 'Monitoreo Hidrológico Urbano' }),
    ).toBeInTheDocument();
    expect(screen.getByText('4.72')).toBeInTheDocument();
  });

  test('no muestra la sección de ranking cuando los resultados no están publicados (visibleInLanding: false)', async () => {
    const eventId = 902;

    server.use(
      http.get(`*/events/public/past/${eventId}`, () => {
        return HttpResponse.json({
          data: {
            id: eventId,
            name: 'Simposio Académico Cerrado',
            description: 'Evento finalizado sin publicación de ranking.',
            startDate: '2025-08-01T08:00:00Z',
            endDate: '2025-08-02T18:00:00Z',
            inscriptionDeadline: '2025-07-25',
            status: 4,
            statusName: 'CLOSED',
            active: false,
            eventType: 1,
            categories: [{ id: 10, name: 'General' }],
          },
        });
      }),
      http.get(`*/projects/by-event/${eventId}/with-jurors`, () => {
        return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }),
      http.get(`*/events/ranking-config/${eventId}`, () => {
        return HttpResponse.json({
          data: {
            id: 2,
            eventId,
            positions: 3,
            visiblePositions: 3,
            visibleInLanding: false,
            visibleScore: true,
          },
        });
      }),
    );

    renderWithQueryClient(<PastEventDetail eventId={eventId} />);

    expect(
      await screen.findByRole('heading', { name: /simposio académico cerrado/i }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: /proyectos ganadores/i }),
      ).not.toBeInTheDocument();
    });
  });

  test('evento sin resultados de ranking no muestra datos incorrectos provenientes de premios configurados (awards)', async () => {
    const eventId = 903;

    server.use(
      http.get(`*/events/public/past/${eventId}`, () => {
        return HttpResponse.json({
          data: {
            id: eventId,
            name: 'Competencia sin Ganadores Registrados',
            description: 'Evento con premios configurados pero sin ranking.',
            startDate: '2025-05-01T08:00:00Z',
            endDate: '2025-05-03T18:00:00Z',
            inscriptionDeadline: '2025-04-25',
            status: 4,
            statusName: 'CLOSED',
            active: false,
            eventType: 1,
            categories: [{ id: 10, name: 'Software' }],
            awards: [
              {
                title: 'Top 1 - Bono Millonario',
                description: 'Premio económico al primer puesto',
                value: 2000000,
                position: 1,
                categoryId: 10,
              },
            ],
          },
        });
      }),
      http.get(`*/projects/by-event/${eventId}/with-jurors`, () => {
        return HttpResponse.json({ items: [], total: 0, page: 1, limit: 10, totalPages: 1 });
      }),
      http.get(`*/events/ranking-config/${eventId}`, () => {
        return HttpResponse.json({
          data: {
            id: 3,
            eventId,
            positions: 3,
            visiblePositions: 3,
            visibleInLanding: true,
            visibleScore: true,
          },
        });
      }),
      http.get(`*/events/${eventId}/rankings/public`, () => {
        return HttpResponse.json({ data: [] });
      }),
    );

    renderWithQueryClient(<PastEventDetail eventId={eventId} />);

    expect(
      await screen.findByRole('heading', {
        name: /competencia sin ganadores registrados/i,
      }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: /proyectos ganadores/i }),
      ).not.toBeInTheDocument();
      expect(screen.queryByText('Top 1 - Bono Millonario')).not.toBeInTheDocument();
    });
  });

  test('muestra el ranking general cuando el backend retorna ganadores sin categoryId y usa fallback a event.rankingConfig', async () => {
    const eventId = 904;

    server.use(
      http.get(`*/events/public/past/${eventId}`, () => {
        return HttpResponse.json({
          data: {
            id: eventId,
            name: 'Hackathon Global 2025',
            description: 'Evento con ranking global y configuración embebida.',
            startDate: '2025-11-01T08:00:00Z',
            endDate: '2025-11-02T18:00:00Z',
            inscriptionDeadline: '2025-10-25',
            status: 4,
            statusName: 'CLOSED',
            active: false,
            eventType: 1,
            categories: [
              { id: 10, name: 'IA' },
              { id: 20, name: 'Cloud' },
            ],
            rankingConfig: {
              id: 4,
              eventId,
              positions: 2,
              visiblePositions: 2,
              visibleInLanding: true,
              visibleScore: true,
            },
          },
        });
      }),
      http.get(`*/projects/by-event/${eventId}/with-jurors`, () => {
        return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }),
      http.get(`*/events/ranking-config/${eventId}`, () => {
        return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }),
      http.get(`*/events/${eventId}/rankings/public`, ({ request }) => {
        const url = new URL(request.url);
        // Si el frontend enviara erróneamente categoryId=0, el backend respondería vacío
        if (url.searchParams.get('categoryId') === '0') {
          return HttpResponse.json({ data: [] });
        }

        return HttpResponse.json({
          data: [
            {
              position: 1,
              projectId: 701,
              projectName: 'Asistente Clínico Autónomo',
              score: 4.95,
              participants: ['Laura Gómez'],
            },
          ],
        });
      }),
    );

    renderWithQueryClient(<PastEventDetail eventId={eventId} />);

    expect(
      await screen.findByRole('heading', { name: /proyectos ganadores/i }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: 'Asistente Clínico Autónomo' }),
    ).toBeInTheDocument();
    expect(screen.getByText('4.95')).toBeInTheDocument();
  });
});
