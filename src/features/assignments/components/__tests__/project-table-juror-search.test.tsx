import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { vi } from "vitest";

import { ProjectsTable } from "../project-table";

import { server } from "@/testing/mocks/server";
import { rtlRender, screen, userEvent, waitFor } from "@/testing/test-utils";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams("event=5"),
}));

const juror = (id: string, firstName: string, lastName: string) => ({
  id,
  firstName,
  lastName,
  email: `${id}@test.edu`,
});

const ALL_PROJECTS = [
  { id: 1, name: "Robot clasificador", jurors: [juror("1", "José", "Pérez")] },
  { id: 2, name: "App de reciclaje", jurors: [juror("2", "Ana", "Gómez")] },
  { id: 3, name: "Huerta urbana", jurors: [] },
  // Only reachable beyond the first page of the default listing.
  {
    id: 4,
    name: "Paneles solares",
    jurors: [juror("2", "Ana", "Gómez"), juror("1", "José", "Pérez")],
  },
].map((p) => ({ ...p, projectCode: `P-${p.id}`, state: "APPROVED" }));

const requestedPageSizes: number[] = [];

beforeEach(() => {
  requestedPageSizes.length = 0;
  server.use(
    http.get("*/api/projects/by-event/5/with-jurors", ({ request }) => {
      const url = new URL(request.url);
      const page = Number(url.searchParams.get("currentPage") ?? 1);
      const requested = Number(url.searchParams.get("itemsPerPage"));

      requestedPageSizes.push(requested);
      // Small default pages so the fourth project falls on page 2.
      const limit = requested === 100 ? 100 : 3;
      const start = (page - 1) * limit;

      return HttpResponse.json({
        items: ALL_PROJECTS.slice(start, start + limit),
        page,
        limit,
        total: ALL_PROJECTS.length,
        totalPages: Math.ceil(ALL_PROJECTS.length / limit),
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

const renderTable = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return rtlRender(
    <QueryClientProvider client={queryClient}>
      <ProjectsTable onSelectProject={vi.fn()} onViewProject={vi.fn()} />
    </QueryClientProvider>,
  );
};

describe("ProjectsTable - búsqueda por jurado", () => {
  test("muestra solo los proyectos del jurado buscado, incluidos los de otras páginas", async () => {
    const user = userEvent.setup();

    renderTable();
    expect(await screen.findByText("Robot clasificador")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Buscar por jurado"), "jose PEREZ");

    expect(await screen.findByText("Paneles solares")).toBeInTheDocument();
    expect(screen.getByText("Robot clasificador")).toBeInTheDocument();
    expect(screen.queryByText("App de reciclaje")).not.toBeInTheDocument();
    expect(screen.queryByText("Huerta urbana")).not.toBeInTheDocument();
    // The juror search reads the whole event in large pages.
    expect(requestedPageSizes).toContain(100);
  });

  test("ignora tildes y mayúsculas en el nombre del jurado", async () => {
    const user = userEvent.setup();

    renderTable();
    await screen.findByText("Robot clasificador");

    await user.type(screen.getByLabelText("Buscar por jurado"), "GOMEZ");

    expect(await screen.findByText("App de reciclaje")).toBeInTheDocument();
    expect(screen.getByText("Paneles solares")).toBeInTheDocument();
    expect(screen.queryByText("Robot clasificador")).not.toBeInTheDocument();
  });

  test("muestra el estado vacío cuando el jurado no tiene proyectos", async () => {
    const user = userEvent.setup();

    renderTable();
    await screen.findByText("Robot clasificador");

    await user.type(screen.getByLabelText("Buscar por jurado"), "Carlos");

    expect(
      await screen.findByText("Ningún proyecto asignado a ese jurado."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Robot clasificador")).not.toBeInTheDocument();
  });

  test("al limpiar la búsqueda vuelve al listado paginado", async () => {
    const user = userEvent.setup();

    renderTable();
    await screen.findByText("Robot clasificador");

    const input = screen.getByLabelText("Buscar por jurado");

    await user.type(input, "Gomez");
    await waitFor(() =>
      expect(screen.queryByText("Robot clasificador")).not.toBeInTheDocument(),
    );

    await user.clear(input);

    expect(await screen.findByText("Robot clasificador")).toBeInTheDocument();
    expect(screen.queryByText("Paneles solares")).not.toBeInTheDocument();
  });
});
