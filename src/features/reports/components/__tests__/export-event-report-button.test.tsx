import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { vi } from "vitest";

import { server } from "@/testing/mocks/server";
import { rtlRender, screen, userEvent, waitFor } from "@/testing/test-utils";

import { ExportEventReportButton } from "../export-event-report-button";

const XLSX =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

type Category = { id: number; code: string };

const mockApi = ({
  categories,
  reportStatus = 200,
}: {
  categories: Category[];
  reportStatus?: number;
}) => {
  const requestedCategories: string[] = [];
  server.use(
    http.get("*/api/events/courses/dropdown/:eventId", () =>
      HttpResponse.json({ courses: categories }),
    ),
    http.get(
      "*/api/events/:eventId/reports/evaluation",
      ({ request, params }) => {
        const categoryId =
          new URL(request.url).searchParams.get("categoryId") ?? "";
        requestedCategories.push(`${params.eventId}:${categoryId}`);
        if (reportStatus !== 200) {
          return HttpResponse.json(
            { message: "error" },
            { status: reportStatus },
          );
        }
        return HttpResponse.arrayBuffer(new Uint8Array([80, 75, 3, 4]).buffer, {
          headers: {
            "Content-Type": XLSX,
            "Content-Disposition": `attachment; filename="reporte_${categoryId}.xlsx"`,
          },
        });
      },
    ),
  );
  return requestedCategories;
};

const downloadedNames: string[] = [];

beforeEach(() => {
  downloadedNames.length = 0;
  // The dropdown popover does `new ResizeObserver()`: the global mock in
  // setup-tests is an arrow function, which cannot be used as a constructor
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  vi.stubGlobal(
    "URL",
    Object.assign(URL, {
      createObjectURL: vi.fn(() => "blob:report"),
      revokeObjectURL: vi.fn(),
    }),
  );
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    downloadedNames.push(this.download);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

const renderButton = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return rtlRender(
    <QueryClientProvider client={queryClient}>
      <ExportEventReportButton eventId={7} />
    </QueryClientProvider>,
  );
};

const exportButton = () =>
  screen.findByRole("button", { name: /exportar reporte/i });

test("with one category, downloads its report directly", async () => {
  const requests = mockApi({ categories: [{ id: 3, code: "Civil" }] });
  renderButton();

  await waitFor(async () => expect(await exportButton()).toBeEnabled());
  await userEvent.click(await exportButton());

  await waitFor(() => expect(downloadedNames).toEqual(["reporte_3.xlsx"]));
  expect(requests).toEqual(["7:3"]);
  expect(await screen.findByText("¡Descargado!")).toBeInTheDocument();
});

test("with several categories, lets the user pick one or download all", async () => {
  const requests = mockApi({
    categories: [
      { id: 3, code: "Civil" },
      { id: 4, code: "Sistemas" },
    ],
  });
  renderButton();

  await waitFor(async () => expect(await exportButton()).toBeEnabled());
  await userEvent.click(await exportButton());
  // Categories are listed by their code
  expect(await screen.findByText("Civil")).toBeInTheDocument();
  expect(screen.getByText("Sistemas")).toBeInTheDocument();
  await userEvent.click(await screen.findByText("Todas las categorías"));

  await waitFor(() =>
    expect(downloadedNames).toEqual(["reporte_3.xlsx", "reporte_4.xlsx"]),
  );
  // One request per category
  expect(requests).toEqual(["7:3", "7:4"]);
});

test("shows a clear message when the user lacks permission", async () => {
  mockApi({ categories: [{ id: 3, code: "Civil" }], reportStatus: 403 });
  renderButton();

  await waitFor(async () => expect(await exportButton()).toBeEnabled());
  await userEvent.click(await exportButton());

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "No tienes permiso para descargar este reporte.",
  );
  expect(downloadedNames).toEqual([]);
});

test("is disabled when the event has no categories", async () => {
  mockApi({ categories: [] });
  renderButton();

  expect(
    await screen.findByText(/no tiene categorías para generar el reporte/i),
  ).toBeInTheDocument();
  expect(await exportButton()).toBeDisabled();
});
