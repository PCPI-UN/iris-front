import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";

import { EventDashboard } from "../event-dashboard";

import { server } from "@/testing/mocks/server";
import { rtlRender, screen } from "@/testing/test-utils";

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

// The views of each role load their own data; here only which one opens matters
vi.mock("@/features/jury/components/project-list-view", () => ({
  ProjectListView: () => <p>Proyectos asignados</p>,
}));
vi.mock("@/app/app/_components/student-dashboard", () => ({
  StudentDashboard: () => <p>Panel del estudiante</p>,
}));

const otherEvents = Array.from({ length: 50 }, (_, index) => ({
  id: 100 + index,
  name: `Evento ${index}`,
  role: { id: 5, name: "Participant", scope: "EVENT" },
}));

describe("EventDashboard", () => {
  it("opens the juror view of an event that is not on the first page of my-events", async () => {
    const requests: URLSearchParams[] = [];

    server.use(
      http.get("*/events/my-events", ({ request }) => {
        const params = new URL(request.url).searchParams;

        requests.push(params);
        const page = Number(params.get("page"));

        return HttpResponse.json({
          data:
            page === 1
              ? otherEvents
              : [
                  {
                    id: 14,
                    name: "Feria",
                    role: { id: 4, name: "Juror", scope: "EVENT" },
                  },
                ],
          meta: { page, total: 51, totalPages: 2 },
        });
      }),
    );

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    rtlRender(
      <QueryClientProvider client={queryClient}>
        <EventDashboard eventId="14" />
      </QueryClientProvider>,
    );

    expect(await screen.findByText("Jurado del Evento")).toBeInTheDocument();
    expect(screen.queryByText("Panel del estudiante")).not.toBeInTheDocument();
    expect(requests.map((params) => params.get("page"))).toEqual(["1", "2"]);
    expect(requests[0].get("limit")).toBe("50");
  });
});
