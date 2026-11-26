import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { vi } from "vitest";

import { Notifications } from "@/components/ui/notifications";
import { server } from "@/testing/mocks/server";
import { rtlRender, screen, userEvent, waitFor } from "@/testing/test-utils";

import { JurorImportView } from "../juror-import/juror-import-view";

const mockPush = vi.fn();
let mockEventParam: string | null = "5";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockPush }),
  useSearchParams: () => new URLSearchParams(mockEventParam ? `event=${mockEventParam}` : ""),
}));

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const VALID_XLSX_BYTES = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00]);

const makeValidXlsxFile = (name = "jurados_evento_5.xlsx") =>
  new File([VALID_XLSX_BYTES], name, { type: XLSX_MIME });

const mockActiveEvents = () => {
  server.use(
    http.get("*/api/events", () =>
      HttpResponse.json({
        data: [
          {
            id: 5,
            name: "Feria de Proyectos 2026",
            description: "Evento activo",
            startDate: "2026-11-01T08:00:00Z",
            endDate: "2026-11-30T18:00:00Z",
            inscriptionDeadline: "2026-11-15T23:59:59Z",
            evaluationsOpened: true,
            active: true,
            eventType: "Competition",
          },
        ],
      }),
    ),
  );
};

const downloadedNames: string[] = [];

beforeEach(() => {
  mockPush.mockReset();
  mockEventParam = "5";
  downloadedNames.length = 0;

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
      createObjectURL: vi.fn(() => "blob:template"),
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
      <Notifications />
      <JurorImportView />
    </QueryClientProvider>,
  );
};

describe("JurorImportView (IRIS-V3-ADM-01 / S2-08)", () => {
  test("rechaza archivos que no sean Excel .xlsx válidos antes de enviar al backend", async () => {
    mockActiveEvents();
    let previewCalled = false;
    server.use(
      http.post("*/api/events/5/juror-imports/preview", () => {
        previewCalled = true;
        return HttpResponse.json({});
      }),
    );

    const user = userEvent.setup({ applyAccept: false });
    renderView();

    const input = await screen.findByLabelText(
      /Seleccionar archivo Excel de jurados/i,
    );
    const spoofedFile = new File(["<html>bad</html>"], "fake.xlsx", {
      type: XLSX_MIME,
    });
    await user.upload(input, spoofedFile);

    expect(
      await screen.findByText(/no corresponde a un archivo Excel/i),
    ).toBeInTheDocument();
    expect(previewCalled).toBe(false);
  });

  test("descarga la plantilla oficial del evento desde GET /juror-imports/template", async () => {
    mockActiveEvents();
    server.use(
      http.get("*/api/events/5/juror-imports/template", () =>
        HttpResponse.arrayBuffer(VALID_XLSX_BYTES.buffer, {
          headers: {
            "Content-Type": XLSX_MIME,
            "Content-Disposition":
              'attachment; filename="plantilla_feria_5.xlsx"',
          },
        }),
      ),
    );

    const user = userEvent.setup();
    renderView();

    const downloadBtn = await screen.findByRole("button", {
      name: /Descargar plantilla/i,
    });
    await waitFor(() => expect(downloadBtn).toBeEnabled());
    await user.click(downloadBtn);

    await waitFor(() =>
      expect(downloadedNames).toEqual(["plantilla_feria_5.xlsx"]),
    );
  });

  test("flujo completo: vista previa con aviso de tutor (no bloqueante), confirmación y resumen de ejecución con invitationsReused", async () => {
    mockActiveEvents();
    let executeFieldFilePresent = false;
    let resolveExecute!: () => void;
    const executeGate = new Promise<void>((res) => {
      resolveExecute = res;
    });

    server.use(
      http.post("*/api/events/5/juror-imports/preview", async ({ request }) => {
        const rawBody = await request.text();
        expect(rawBody).toContain('name="file"');
        return HttpResponse.json({
          rows: [
            {
              rowNumber: 2,
              jurorSlot: 1,
              outcome: "ASSIGN",
              userStatus: "NEW",
              message: "es tutor de este proyecto",
              email: "tutor@uninorte.edu.co",
              projectId: 101,
              projectName: "<script>alert(1)</script> Proyecto Seguro",
              userId: null,
            },
            {
              rowNumber: 3,
              jurorSlot: 1,
              outcome: "SKIP",
              userStatus: "ACTIVE",
              message: "Ya estaba asignado",
              email: "existente@uninorte.edu.co",
              projectId: 102,
              projectName: "Proyecto B",
              userId: 8,
            },
          ],
          totals: {
            rows: 2,
            assigned: 1,
            skipped: 1,
            errors: 0,
            warnings: 1,
            jurors: 2,
            invitationsSent: 1,
            invitationsReused: 0,
            newUsers: 1,
          },
        });
      }),
      http.post("*/api/events/5/juror-imports/execute", async ({ request }) => {
        const rawBody = await request.text();
        executeFieldFilePresent = rawBody.includes('name="file"');
        await executeGate;
        return HttpResponse.json({
          rows: [
            {
              rowNumber: 2,
              jurorSlot: 1,
              outcome: "ASSIGN",
              userStatus: "NEW",
              message:
                "Asignado y se envió invitación; debe aceptar la invitación para evaluar.",
              email: "tutor@uninorte.edu.co",
              projectId: 101,
              projectName: "<script>alert(1)</script> Proyecto Seguro",
              userId: 50,
            },
            {
              rowNumber: 3,
              jurorSlot: 1,
              outcome: "SKIP",
              userStatus: "ACTIVE",
              message: "Ya estaba asignado.",
              email: "existente@uninorte.edu.co",
              projectId: 102,
              projectName: "Proyecto B",
              userId: 8,
            },
          ],
          totals: {
            rows: 2,
            assigned: 1,
            skipped: 1,
            errors: 0,
            jurors: 2,
            invitationsSent: 1,
            invitationsReused: 1,
            newUsers: 1,
          },
        });
      }),
    );

    const user = userEvent.setup();
    renderView();

    const input = await screen.findByLabelText(
      /Seleccionar archivo Excel de jurados/i,
    );
    await user.upload(input, makeValidXlsxFile());

    const previewBtn = await screen.findByRole("button", {
      name: /Generar vista previa/i,
    });
    await waitFor(() => expect(previewBtn).toBeEnabled());
    await user.click(previewBtn);

    // Vista previa: el aviso de tutor no bloquea la confirmación y XSS se renderiza como texto literal
    expect(
      await screen.findByText(/es tutor de este proyecto/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/<script>alert\(1\)<\/script> Proyecto Seguro/),
    ).toBeInTheDocument();

    const confirmBtn = screen.getByRole("button", {
      name: /Confirmar y ejecutar asignación/i,
    });
    expect(confirmBtn).toBeEnabled();
    await user.click(confirmBtn);

    const modalConfirmBtn = await screen.findByRole("button", {
      name: /^Confirmar y ejecutar$/i,
    });
    await user.click(modalConfirmBtn);

    // Botón deshabilitado mientras la petición está en curso
    await waitFor(() =>
      expect(
        screen.getByRole("button", {
          name: /Ejecutando y enviando invitaciones/i,
        }),
      ).toBeDisabled(),
    );

    resolveExecute();

    // Resumen de ejecución con totales exactos incluyendo invitationsReused
    expect(
      await screen.findByText(/Resumen de la asignación ejecutada/i),
    ).toBeInTheDocument();
    expect(executeFieldFilePresent).toBe(true);
    expect(
      screen.getAllByText(/Invitaciones reutilizadas/i).length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByText(
        /debe aceptar la invitación para evaluar/i,
      ),
    ).toBeInTheDocument();
  });

  test("bloquea confirmación cuando /preview reporta errores y maneja 400 { message, preview } en /execute", async () => {
    mockActiveEvents();
    server.use(
      http.post("*/api/events/5/juror-imports/preview", () =>
        HttpResponse.json({
          rows: [
            {
              rowNumber: 2,
              jurorSlot: 1,
              outcome: "ASSIGN",
              userStatus: "ACTIVE",
              message: "",
              email: "ok@uninorte.edu.co",
              projectId: 10,
              projectName: "Proyecto Válido",
              userId: 3,
            },
          ],
          totals: {
            rows: 1,
            assigned: 1,
            skipped: 0,
            errors: 0,
            jurors: 1,
            invitationsSent: 0,
            invitationsReused: 0,
            newUsers: 0,
          },
        }),
      ),
      http.post("*/api/events/5/juror-imports/execute", () =>
        HttpResponse.json(
          {
            message: "El proyecto ya fue modificado y tiene errores.",
            preview: {
              rows: [
                {
                  rowNumber: 2,
                  jurorSlot: 1,
                  outcome: "ERROR",
                  userStatus: "ACTIVE",
                  message: "El proyecto ya no pertenece al evento.",
                  email: "ok@uninorte.edu.co",
                  projectId: 10,
                  projectName: "Proyecto Válido",
                  userId: 3,
                },
              ],
              totals: {
                rows: 1,
                assigned: 0,
                skipped: 0,
                errors: 1,
                jurors: 1,
                invitationsSent: 0,
                invitationsReused: 0,
                newUsers: 0,
              },
            },
          },
          { status: 400 },
        ),
      ),
    );

    const user = userEvent.setup();
    renderView();

    const input = await screen.findByLabelText(
      /Seleccionar archivo Excel de jurados/i,
    );
    await user.upload(input, makeValidXlsxFile());
    await user.click(
      await screen.findByRole("button", { name: /Generar vista previa/i }),
    );

    await user.click(
      await screen.findByRole("button", {
        name: /Confirmar y ejecutar asignación/i,
      }),
    );
    await user.click(
      await screen.findByRole("button", { name: /^Confirmar y ejecutar$/i }),
    );

    expect(
      await screen.findByText(/El proyecto ya fue modificado y tiene errores\./i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/El proyecto ya no pertenece al evento\./i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Confirmar y ejecutar asignación/i }),
    ).toBeDisabled();
  });

  test("maneja 400 { message, invitedJurors } mostrando correos invitados y permitiendo reintento idempotente", async () => {
    mockActiveEvents();
    let executeAttempt = 0;

    server.use(
      http.post("*/api/events/5/juror-imports/preview", () =>
        HttpResponse.json({
          rows: [
            {
              rowNumber: 2,
              jurorSlot: 1,
              outcome: "ASSIGN",
              userStatus: "NEW",
              message: "",
              email: "nuevo.jurado@uninorte.edu.co",
              projectId: 20,
              projectName: "Proyecto C",
              userId: null,
            },
          ],
          totals: {
            rows: 1,
            assigned: 1,
            skipped: 0,
            errors: 0,
            jurors: 1,
            invitationsSent: 1,
            invitationsReused: 0,
            newUsers: 1,
          },
        }),
      ),
      http.post("*/api/events/5/juror-imports/execute", () => {
        executeAttempt++;
        if (executeAttempt === 1) {
          return HttpResponse.json(
            {
              message:
                "Un proyecto cambió en la validación final, pero las invitaciones ya salieron.",
              invitedJurors: ["nuevo.jurado@uninorte.edu.co"],
            },
            { status: 400 },
          );
        }
        return HttpResponse.json({
          rows: [
            {
              rowNumber: 2,
              jurorSlot: 1,
              outcome: "ASSIGN",
              userStatus: "PENDING",
              message: "Asignado reutilizando invitación enviada.",
              email: "nuevo.jurado@uninorte.edu.co",
              projectId: 20,
              projectName: "Proyecto C",
              userId: 99,
            },
          ],
          totals: {
            rows: 1,
            assigned: 1,
            skipped: 0,
            errors: 0,
            jurors: 1,
            invitationsSent: 0,
            invitationsReused: 1,
            newUsers: 0,
          },
        });
      }),
    );

    const user = userEvent.setup();
    renderView();

    const input = await screen.findByLabelText(
      /Seleccionar archivo Excel de jurados/i,
    );
    await user.upload(input, makeValidXlsxFile());
    await user.click(
      await screen.findByRole("button", { name: /Generar vista previa/i }),
    );
    await user.click(
      await screen.findByRole("button", {
        name: /Confirmar y ejecutar asignación/i,
      }),
    );
    await user.click(
      await screen.findByRole("button", { name: /^Confirmar y ejecutar$/i }),
    );

    expect(
      await screen.findByText(/Validación final rechazada tras enviar invitaciones/i),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText("nuevo.jurado@uninorte.edu.co").length,
    ).toBeGreaterThanOrEqual(1);

    const retryBtn = screen.getByRole("button", {
      name: /Reintentar ejecución/i,
    });
    await user.click(retryBtn);

    expect(
      await screen.findByText(/Importación finalizada sin errores/i),
    ).toBeInTheDocument();
    expect(executeAttempt).toBe(2);
    expect(
      screen.getByText(/Asignado reutilizando invitación enviada/i),
    ).toBeInTheDocument();
  });
});
