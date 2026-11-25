import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";

import { EventDashboard } from "../event-dashboard";

import { server } from "@/testing/mocks/server";
import { rtlRender, screen } from "@/testing/test-utils";

let search = "";
let permissions: string[] = [];
const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams(search),
}));

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
        platformPermissions: permissions,
      },
      isLoading: false,
    }),
  };
});

// The views of each role load their own data; here only which one opens matters
vi.mock("@/features/jury/components/project-list-view", () => ({
  ProjectListView: () => <p>Proyectos asignados</p>,
}));
vi.mock("@/app/app/_components/student-dashboard", () => ({
  StudentDashboard: () => <p>Panel del estudiante</p>,
}));

const meEvent = (id: number, roles: string[]) => ({
  id,
  name: `Evento ${id}`,
  eventType: 1,
  statusName: "AVAILABLE",
  roles,
});

/** The juror's projects in the event: the header counts the evaluated ones */
const useAssignedProjectsHandler = (items: { id: number; evaluated: boolean }[]) =>
  server.use(
    http.get("*/api/projects/assigned-projects", () =>
      HttpResponse.json({ items, page: 1, pageSize: 50, total: items.length }),
    ),
  );

const otherEvents = Array.from({ length: 50 }, (_, index) =>
  meEvent(100 + index, ["PARTICIPANT"]),
);

/** Answers GET /me/events from one list per status, paginated like the backend */
const useMeEventsHandler = (
  lists: { current?: unknown[]; past?: unknown[] },
  requests: URLSearchParams[] = [],
) =>
  server.use(
    http.get("*/api/me/events", ({ request }) => {
      const params = new URL(request.url).searchParams;
      const status = params.get("status") as "current" | "past";
      const page = Number(params.get("page"));
      const limit = Number(params.get("limit"));
      const list = lists[status] ?? [];

      requests.push(params);

      return HttpResponse.json({
        events: list.slice((page - 1) * limit, page * limit),
        meta: {
          total: list.length,
          currentPage: page,
          totalPages: Math.max(1, Math.ceil(list.length / limit)),
        },
      });
    }),
  );

const renderDashboard = (eventId: string) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return rtlRender(
    <QueryClientProvider client={queryClient}>
      <EventDashboard eventId={eventId} />
    </QueryClientProvider>,
  );
};

describe("EventDashboard", () => {
  beforeEach(() => {
    search = "";
    permissions = [];
    useAssignedProjectsHandler([]);
    replace.mockClear();
  });

  it("opens the juror view of an event that is not on the first page", async () => {
    const requests: URLSearchParams[] = [];

    useMeEventsHandler(
      { current: [...otherEvents, meEvent(14, ["JURY"])] },
      requests,
    );
    renderDashboard("14");

    expect(await screen.findByText("Jurado del Evento")).toBeInTheDocument();
    expect(screen.queryByText("Panel del estudiante")).not.toBeInTheDocument();
    expect(requests.map((params) => params.get("page"))).toEqual(["1", "2"]);
    expect(requests[0].get("limit")).toBe("50");
  });

  it("the juror header shows the event name and how many projects are evaluated", async () => {
    useMeEventsHandler({ current: [meEvent(14, ["JURY"])] });
    useAssignedProjectsHandler([
      { id: 1, evaluated: true },
      { id: 2, evaluated: true },
      { id: 3, evaluated: false },
      { id: 4, evaluated: false },
      { id: 5, evaluated: false },
    ]);
    renderDashboard("14");

    expect(await screen.findByText("Evento 14")).toBeInTheDocument();
    expect(await screen.findByText("2 de 5 evaluados")).toBeInTheDocument();
  });

  it("finds an event that already ended in the past list", async () => {
    useMeEventsHandler({ current: [], past: [meEvent(9, ["PARTICIPANT"])] });
    renderDashboard("9");

    expect(await screen.findByText("Panel del estudiante")).toBeInTheDocument();
  });

  it("opens the view the ?rol= asks for when the person holds it", async () => {
    search = "rol=participante";
    useMeEventsHandler({ current: [meEvent(14, ["JURY", "PARTICIPANT"])] });
    renderDashboard("14");

    expect(await screen.findByText("Panel del estudiante")).toBeInTheDocument();
    expect(screen.queryByText("Jurado del Evento")).not.toBeInTheDocument();
  });

  it.each(["participante", "loquesea", ""])(
    "ignores ?rol=%s when the person only holds the juror role",
    async (rol) => {
      search = rol ? `rol=${rol}` : "";
      useMeEventsHandler({ current: [meEvent(14, ["JURY"])] });
      renderDashboard("14");

      expect(await screen.findByText("Jurado del Evento")).toBeInTheDocument();
      expect(
        screen.queryByText("Panel del estudiante"),
      ).not.toBeInTheDocument();
    },
  );

  it("shows a placeholder for a tutor without read:academic_projects", async () => {
    search = "rol=tutor";
    useMeEventsHandler({ current: [meEvent(14, ["JURY", "TUTOR"])] });
    renderDashboard("14");

    expect(
      await screen.findByText("Vista de tutor próximamente"),
    ).toBeInTheDocument();
  });

  it("opens Docencia on the event for a professor with read:academic_projects", async () => {
    search = "rol=profesor";
    permissions = ["read:academic_projects"];
    useMeEventsHandler({ current: [meEvent(14, ["JURY", "PROFESSOR"])] });
    renderDashboard("14");

    await vi.waitFor(() =>
      expect(replace).toHaveBeenCalledWith("/app/docencia?evento=14"),
    );
  });
});
