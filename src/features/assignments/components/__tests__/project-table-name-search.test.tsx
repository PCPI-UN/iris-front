import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { vi } from "vitest";

import { useAssignmentProjects } from "../../hooks/use-assignment-projects";
import { ProjectsTable } from "../project-table";

import { server } from "@/testing/mocks/server";
import { rtlRender, screen, userEvent, waitFor } from "@/testing/test-utils";

let mockSearch = "event=5";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(mockSearch),
  usePathname: () => "/app/assignments",
}));

const PROJECTS = [
  { id: 1, name: "Robot clasificador", categoryId: 10, jurors: [] },
  { id: 2, name: "Robot de riego", categoryId: 20, jurors: [] },
  { id: 3, name: "Huerta urbana", categoryId: 10, jurors: [] },
].map((p) => ({ ...p, projectCode: `P-${p.id}`, state: "APPROVED" }));

const requests: URLSearchParams[] = [];

beforeEach(() => {
  mockSearch = "event=5";
  requests.length = 0;
  server.use(
    http.get("*/api/projects/by-event/5/with-jurors", ({ request }) => {
      const params = new URL(request.url).searchParams;
      const q = params.get("q")?.toLowerCase() ?? "";
      const category = Number(params.get("courseId") ?? 0);

      requests.push(params);
      const items = PROJECTS.filter(
        (p) =>
          p.name.toLowerCase().includes(q) &&
          (!category || p.categoryId === category),
      );

      return HttpResponse.json({
        items,
        page: 1,
        limit: 10,
        total: items.length,
        totalPages: 1,
      });
    }),
  );
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

const TableWithList = () => (
  <ProjectsTable
    assignment={useAssignmentProjects()}
    onSelectProject={vi.fn()}
    onViewProject={vi.fn()}
  />
);

const renderTable = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const ui = (
    <QueryClientProvider client={queryClient}>
      <TableWithList />
    </QueryClientProvider>
  );
  const view = rtlRender(ui);

  return { ...view, rerenderTable: () => view.rerender(ui) };
};

describe("ProjectsTable - búsqueda por nombre", () => {
  test("busca en el backend con q y muestra solo los resultados", async () => {
    const user = userEvent.setup();

    renderTable();
    await screen.findByText("Huerta urbana");

    await user.type(screen.getByLabelText("Buscar proyecto"), "robot");

    await waitFor(() =>
      expect(screen.queryByText("Huerta urbana")).not.toBeInTheDocument(),
    );
    expect(await screen.findByText("Robot clasificador")).toBeInTheDocument();
    expect(screen.getByText("Robot de riego")).toBeInTheDocument();
    // Debounced: one request with the whole term, not one per letter
    const qs = requests.map((r) => r.get("q")).filter(Boolean);

    expect(qs).toEqual(["robot"]);
  });

  test("con texto escrito, cambiar de categoría vuelve a buscar en esa categoría", async () => {
    const user = userEvent.setup();
    const { rerenderTable } = renderTable();

    await screen.findByText("Huerta urbana");
    await user.type(screen.getByLabelText("Buscar proyecto"), "robot");
    await screen.findByText("Robot de riego");

    mockSearch = "event=5&categoryId=10";
    rerenderTable();

    await waitFor(() =>
      expect(screen.queryByText("Robot de riego")).not.toBeInTheDocument(),
    );
    expect(await screen.findByText("Robot clasificador")).toBeInTheDocument();
    const last = requests.at(-1);

    expect(last?.get("q")).toBe("robot");
    expect(last?.get("courseId")).toBe("10");
  });
});
