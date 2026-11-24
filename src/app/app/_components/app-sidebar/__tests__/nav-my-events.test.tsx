import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";

import { NavMyEvents } from "../nav-my-events";

import { SidebarProvider } from "@/components/ui/sidebar";
import { server } from "@/testing/mocks/server";
import { rtlRender, screen, waitFor } from "@/testing/test-utils";

const meEvent = (id: number, name: string, roles: string[]) => ({
  id,
  name,
  startDate: "2026-11-20T08:00:00.000Z",
  endDate: "2026-11-21T18:00:00.000Z",
  eventType: 1,
  statusName: "AVAILABLE",
  roles,
});

const mockMeEvents = (events: unknown[], totalPages = 1) => {
  const statuses: (string | null)[] = [];

  server.use(
    http.get("*/api/me/events", ({ request }) => {
      statuses.push(new URL(request.url).searchParams.get("status"));

      return HttpResponse.json({
        events,
        meta: { total: events.length, currentPage: 1, totalPages },
      });
    }),
  );

  return statuses;
};

const renderNav = () =>
  rtlRender(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <SidebarProvider>
        <NavMyEvents />
      </SidebarProvider>
    </QueryClientProvider>,
  );

describe("NavMyEvents", () => {
  it("lists the events in progress, each one to its event panel", async () => {
    const statuses = mockMeEvents([
      meEvent(5, "Feria de Ingeniería", ["JURY", "TUTOR"]),
      meEvent(4, "Hackathon IA", ["PARTICIPANT"]),
    ]);

    renderNav();

    expect(await screen.findByText("Mis eventos")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Feria de Ingeniería/ }),
    ).toHaveAttribute("href", "/app/events/5/dashboard");
    expect(screen.getByRole("link", { name: /Hackathon IA/ })).toHaveAttribute(
      "href",
      "/app/events/4/dashboard",
    );
    // The history stays in the panel
    expect(statuses).toEqual(["current"]);
    expect(screen.queryByText("Ver todos")).not.toBeInTheDocument();
  });

  it("links to the panel when there are more events than the first page", async () => {
    mockMeEvents([meEvent(5, "Feria de Ingeniería", ["JURY"])], 2);

    renderNav();

    expect(
      await screen.findByRole("link", { name: "Ver todos" }),
    ).toHaveAttribute("href", "/app");
  });

  it("no events, no group", async () => {
    let settled = false;

    server.use(
      http.get("*/api/me/events", () => {
        settled = true;

        return HttpResponse.json({
          events: [],
          meta: { total: 0, currentPage: 1, totalPages: 1 },
        });
      }),
    );

    const { container } = renderNav();

    await waitFor(() => expect(settled).toBe(true));
    await waitFor(() => expect(container.querySelector("li")).toBeNull());
    expect(screen.queryByText("Mis eventos")).not.toBeInTheDocument();
  });
});
