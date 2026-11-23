import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";

import { MemberDashboard } from "../member-dashboard";

import { server } from "@/testing/mocks/server";
import { rtlRender, screen, userEvent, waitFor } from "@/testing/test-utils";

// A platform User: no administrative permissions
vi.mock("@/lib/auth", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");

  return {
    ...actual,
    useUser: () => ({
      data: {
        id: "u1",
        email: "ana@iris.local",
        platformRoles: [],
        platformPermissions: [],
      },
      isLoading: false,
    }),
  };
});

const event = (id: number, name: string, role?: "Juror" | "Participant") => ({
  id,
  name,
  startDate: "2026-11-20T08:00:00.000Z",
  endDate: "2026-11-21T18:00:00.000Z",
  active: true,
  eventType: 1,
  ...(role && {
    role: { id: role === "Juror" ? 4 : 5, name: role, scope: "EVENT" },
  }),
});

const studentDashboard = (withProject: boolean) => ({
  profile: {
    id: 2,
    firstName: "Ana",
    lastName: "Ríos",
    email: "ana@iris.local",
  },
  kpis: {
    totalFairs: withProject ? 1 : 0,
    totalProjects: withProject ? 1 : 0,
    totalAwards: 0,
  },
  currentProject: withProject
    ? {
        id: 9,
        eventId: 4,
        eventName: "Feria 2026-30",
        name: "Trazabilidad de residuos",
        enrollmentStatus: "APPROVED",
        participantsCount: 3,
        documentsCount: 2,
      }
    : null,
  evaluation: { resultsPublished: false, finalScore: null },
  trajectory: [],
});

const mockApi = ({
  pages,
  withProject,
}: {
  pages: ReturnType<typeof event>[][];
  withProject: boolean;
}) => {
  const requests: URLSearchParams[] = [];

  server.use(
    http.get("*/events/my-events", ({ request }) => {
      const params = new URL(request.url).searchParams;

      requests.push(params);
      const page = Number(params.get("page") ?? 1);
      const data = pages[page - 1] ?? [];

      return HttpResponse.json({
        data,
        meta: {
          page,
          total: pages.reduce((sum, items) => sum + items.length, 0),
          totalPages: Math.max(pages.length, 1),
        },
      });
    }),
    http.get("*/students/me/dashboard", () =>
      HttpResponse.json(studentDashboard(withProject)),
    ),
  );

  return requests;
};

const renderDashboard = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return rtlRender(
    <QueryClientProvider client={queryClient}>
      <MemberDashboard />
    </QueryClientProvider>,
  );
};

describe("MemberDashboard", () => {
  it("a juror without a project sees their event linked to its dashboard and no empty student panel", async () => {
    mockApi({
      pages: [[event(5, "Feria de Ingeniería", "Juror")]],
      withProject: false,
    });

    renderDashboard();

    const card = await screen.findByRole("link", {
      name: /Feria de Ingeniería como jurado/i,
    });

    expect(card).toHaveAttribute("href", "/app/events/5/dashboard");
    // The student query has resolved too: its panel stays hidden
    await waitFor(() =>
      expect(
        screen.queryByText(/Feria y Proyecto Activo/i),
      ).not.toBeInTheDocument(),
    );
    expect(
      screen.queryByText(/No tienes un proyecto inscrito/i),
    ).not.toBeInTheDocument();
  });

  it("someone who is a juror in one event and has a project in another sees both", async () => {
    mockApi({
      pages: [
        [
          event(5, "Feria de Ingeniería", "Juror"),
          event(4, "Feria 2026-30", "Participant"),
        ],
      ],
      withProject: true,
    });

    renderDashboard();

    expect(
      await screen.findByRole("link", { name: /como jurado/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /como participante/i }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Trazabilidad de residuos"),
    ).toBeInTheDocument();
  });

  it("without events it keeps the student panel that explains how to join one", async () => {
    mockApi({ pages: [], withProject: false });

    renderDashboard();

    expect(
      await screen.findByText(/Aún no tienes eventos/i),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/No tienes un proyecto inscrito/i),
    ).toBeInTheDocument();
  });

  it("pages the events with the backend pagination", async () => {
    const requests = mockApi({
      pages: [
        [event(1, "Evento uno", "Juror")],
        [event(2, "Evento dos", "Juror")],
      ],
      withProject: false,
    });

    renderDashboard();

    expect(
      await screen.findByRole("link", { name: /Evento uno/i }),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: /pagination item 2/i }),
    );

    expect(
      await screen.findByRole("link", { name: /Evento dos/i }),
    ).toBeInTheDocument();
    expect(requests.at(-1)?.get("page")).toBe("2");
    expect(requests.at(-1)?.get("limit")).toBe("6");
  });
});
