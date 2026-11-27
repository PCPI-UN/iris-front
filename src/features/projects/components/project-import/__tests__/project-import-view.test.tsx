import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { vi } from "vitest";

import { ProjectImportView } from "../project-import-view";

import { server } from "@/testing/mocks/server";
import {
  rtlRender,
  screen,
  userEvent,
  waitFor,
  within,
} from "@/testing/test-utils";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockPush }),
  useSearchParams: () => new URLSearchParams("event=5"),
  usePathname: () => "/app/projects/import",
}));

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const VALID_XLSX_BYTES = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00]);
const makeFile = (
  bytes: BlobPart = VALID_XLSX_BYTES,
  name = "proyectos.xlsx",
) => new File([bytes], name, { type: XLSX_MIME });

const row = (
  rowNumber: number,
  outcome: string,
  projectName: string,
  extra = {},
) => ({
  rowNumber,
  outcome,
  projectName,
  categoryName: "Ingeniería",
  state: "APPROVED",
  participants: [
    { email: "ana@unal.edu.co", status: "HAS_ACCOUNT" },
    { email: "luis@unal.edu.co", status: "NO_ACCOUNT" },
  ],
  message: "",
  ...extra,
});

const okPreview = {
  rows: [
    row(2, "CREATE", "Robot clasificador"),
    row(3, "SKIP", "Sistema de riego", {
      message: "Ya existe un proyecto con ese nombre en el evento.",
      projectId: 101,
    }),
  ],
  totals: {
    rows: 2,
    toCreate: 1,
    skipped: 1,
    errors: 0,
    participants: 2,
    withoutAccount: 1,
  },
  eventWarnings: ["La fecha límite de inscripción ya pasó."],
  canConfirm: true,
};

const downloadedNames: string[] = [];

beforeEach(() => {
  mockPush.mockReset();
  downloadedNames.length = 0;
  server.use(
    http.get("*/api/events/5", () =>
      HttpResponse.json({
        event: { id: 5, name: "Feria 2026", eventType: "Exposition" },
      }),
    ),
  );
  vi.stubGlobal(
    "URL",
    Object.assign(URL, {
      createObjectURL: vi.fn(() => "blob:file"),
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

const renderView = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return rtlRender(
    <QueryClientProvider client={queryClient}>
      <ProjectImportView />
    </QueryClientProvider>,
  );
};

const uploadAndValidate = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.upload(
    screen.getByLabelText(/Seleccionar archivo Excel de proyectos/i),
    makeFile(),
  );
  await user.click(
    await screen.findByRole("button", { name: "Validar archivo" }),
  );
};

describe("ProjectImportView", () => {
  test("downloads the template of the event", async () => {
    server.use(
      http.get("*/api/events/5/project-imports/template", () =>
        HttpResponse.arrayBuffer(VALID_XLSX_BYTES.buffer, {
          headers: {
            "Content-Type": XLSX_MIME,
            "Content-Disposition":
              'attachment; filename="plantilla_feria.xlsx"',
          },
        }),
      ),
    );
    const user = userEvent.setup();

    renderView();

    await user.click(
      screen.getByRole("button", { name: /Descargar plantilla/i }),
    );
    await waitFor(() =>
      expect(downloadedNames).toEqual(["plantilla_feria.xlsx"]),
    );
  });

  test("rejects files over 2 MB before calling the backend", async () => {
    let previewCalled = false;

    server.use(
      http.post("*/api/events/5/project-imports/preview", () => {
        previewCalled = true;

        return HttpResponse.json(okPreview);
      }),
    );
    const user = userEvent.setup();

    renderView();

    const big = new Uint8Array(2 * 1024 * 1024 + 1);

    big.set(VALID_XLSX_BYTES);
    await user.upload(
      screen.getByLabelText(/Seleccionar archivo Excel de proyectos/i),
      makeFile(big),
    );

    expect(
      await screen.findByText(/supera el tamaño máximo permitido de 2 MB/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Validar archivo" }),
    ).toBeDisabled();
    expect(previewCalled).toBe(false);
  });

  test("with error rows the preview cannot be confirmed", async () => {
    server.use(
      http.post("*/api/events/5/project-imports/preview", () =>
        HttpResponse.json({
          rows: [
            row(2, "CREATE", "Robot clasificador"),
            row(3, "ERROR", "Robot clasificador", {
              message: "El nombre está repetido en el archivo.",
            }),
          ],
          totals: {
            rows: 2,
            toCreate: 1,
            skipped: 0,
            errors: 1,
            participants: 2,
            withoutAccount: 1,
          },
          eventWarnings: [],
          canConfirm: false,
        }),
      ),
    );
    const user = userEvent.setup();

    renderView();
    await uploadAndValidate(user);

    expect(
      await screen.findByText("El nombre está repetido en el archivo."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Corrige las filas con error/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Confirmar y crear/i }),
    ).toBeDisabled();

    // Filter: only the error rows
    await user.click(screen.getByRole("button", { name: "Errores (1)" }));
    const table = screen.getByRole("grid", {
      name: /Vista previa de la carga/i,
    });

    expect(within(table).getAllByRole("row")).toHaveLength(2); // header + 1 row
  });

  test("full flow: preview with event warnings, confirm and summary with links", async () => {
    let hasFileField = false;

    server.use(
      http.post("*/api/events/5/project-imports/preview", () =>
        HttpResponse.json(okPreview),
      ),
      http.post(
        "*/api/events/5/project-imports/execute",
        async ({ request }) => {
          const body = await request.text();

          // jsdom + undici serialize the File as text: only the field is checked
          hasFileField = body.includes('name="file"');

          return HttpResponse.json({
            rows: [
              row(2, "CREATED", "Robot clasificador", {
                projectId: 77,
                failedEffects: ["NOTIFICATION"],
              }),
              okPreview.rows[1],
            ],
            // The execute totals do not carry rows
            totals: {
              created: 1,
              skipped: 1,
              errors: 0,
              emailsSent: 1,
              failedEffects: 1,
            },
          });
        },
      ),
    );
    const user = userEvent.setup();

    renderView();
    await uploadAndValidate(user);

    expect(
      await screen.findByText("La fecha límite de inscripción ya pasó."),
    ).toBeInTheDocument();
    expect(screen.getByText("Se creará")).toBeInTheDocument();
    expect(
      screen.getByText("Ya existe un proyecto con ese nombre en el evento."),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Confirmar y crear 1 proyecto(s)" }),
    );

    expect(await screen.findByText("Resumen de la carga")).toBeInTheDocument();
    expect(hasFileField).toBe(true);
    expect(screen.getByText("ID proyecto: 77")).toBeInTheDocument();
    expect(
      screen.getByText("No se pudieron registrar los correos de aprobación."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Ver proyectos aprobados").closest("a"),
    ).toHaveAttribute("href", "/app/projects?event=5&state=APPROVED");

    await user.click(
      screen.getByRole("button", { name: /Descargar resumen/i }),
    );
    expect(downloadedNames).toEqual(["resumen_carga_proyectos_evento_5.csv"]);
  });

  test("when execute answers 400 with the preview, it shows the new preview and the message", async () => {
    server.use(
      http.post("*/api/events/5/project-imports/preview", () =>
        HttpResponse.json(okPreview),
      ),
      http.post("*/api/events/5/project-imports/execute", () =>
        HttpResponse.json(
          {
            message: "El evento ya publicó sus resultados.",
            details: {
              preview: {
                ...okPreview,
                canConfirm: false,
                eventWarnings: ["Resultados publicados"],
              },
            },
          },
          { status: 400 },
        ),
      ),
    );
    const user = userEvent.setup();

    renderView();
    await uploadAndValidate(user);
    await user.click(
      await screen.findByRole("button", { name: /Confirmar y crear/i }),
    );

    expect(
      await screen.findByText("El evento ya publicó sus resultados."),
    ).toBeInTheDocument();
    expect(screen.getByText("Resultados publicados")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Confirmar y crear/i }),
    ).toBeDisabled();
  });
});
