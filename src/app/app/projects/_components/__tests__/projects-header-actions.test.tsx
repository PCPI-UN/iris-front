import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { vi } from "vitest";

import { Projects } from "../projects";

import { server } from "@/testing/mocks/server";
import { rtlRender, screen, userEvent } from "@/testing/test-utils";

const mockPush = vi.fn();
let mockSearch = "event=5";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockPush }),
  useSearchParams: () => new URLSearchParams(mockSearch),
  usePathname: () => "/app/projects",
}));
vi.mock("@/features/projects/components/project-list", () => ({
  ProjectList: () => <div>lista de proyectos</div>,
}));
vi.mock("@/features/projects/components/events-dropdown", () => ({
  EventsDropdown: () => <div>eventos</div>,
}));

const mockSession = (permissions: string[]) => {
  server.use(
    http.get("*/api/auth/me", () =>
      HttpResponse.json({
        id: 1,
        firstName: "Ana",
        lastName: "Ruiz",
        email: "ana@uninorte.edu.co",
        active: true,
        status: "CONFIRMED",
        platformRoles: [],
        platformPermissions: permissions,
      }),
    ),
  );
};

const renderProjects = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  rtlRender(
    <QueryClientProvider client={queryClient}>
      <Projects />
    </QueryClientProvider>,
  );
};

beforeEach(() => {
  mockPush.mockReset();
  mockSearch = "event=5";
});

describe("Projects header: create and bulk upload", () => {
  test("with manage:projects, both buttons open their page for the selected event", async () => {
    mockSession(["read:events", "manage:projects"]);
    const user = userEvent.setup();

    renderProjects();

    await user.click(
      await screen.findByRole("button", { name: /crear proyecto/i }),
    );
    expect(mockPush).toHaveBeenCalledWith("/app/projects/new?event=5");

    await user.click(screen.getByRole("button", { name: /carga masiva/i }));
    expect(mockPush).toHaveBeenCalledWith("/app/projects/import?event=5");
  });

  test("they are disabled until an event is selected", async () => {
    mockSession(["read:events", "manage:projects"]);
    mockSearch = "";
    renderProjects();

    expect(
      await screen.findByRole("button", { name: /crear proyecto/i }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /carga masiva/i }),
    ).toBeDisabled();
  });

  test("a session without manage:projects does not see them", async () => {
    mockSession(["read:events"]);
    renderProjects();

    expect(await screen.findByText("lista de proyectos")).toBeInTheDocument();
    // Wait for the session to load before checking the absence
    await screen.findByText("eventos");
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(
      screen.queryByRole("button", { name: /crear proyecto/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /carga masiva/i }),
    ).not.toBeInTheDocument();
  });
});
