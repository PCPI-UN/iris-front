import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";

import { ProjectChangeLog } from "../project-change-log";

import { server } from "@/testing/mocks/server";
import { rtlRender, screen, within } from "@/testing/test-utils";

const renderChangeLog = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  rtlRender(
    <QueryClientProvider client={queryClient}>
      <ProjectChangeLog projectId={7} />
    </QueryClientProvider>,
  );
};

const created = {
  id: 1,
  action: "CREATED",
  actor: { id: 12, name: "Laura Gómez" },
  createdAt: "2026-11-20T15:04:05.000Z",
  before: {},
  reason: null,
};

describe("ProjectChangeLog: CREATED", () => {
  test("shows who created it from the bulk upload, with file, row and the initial data", async () => {
    server.use(
      http.get("*/api/projects/7/change-log", () =>
        HttpResponse.json({
          entries: [
            {
              ...created,
              after: {
                origin: "ADMIN_BULK",
                fileName: "proyectos_feria.xlsx",
                rowNumber: 4,
                name: "Robot clasificador",
                state: "APPROVED",
              },
            },
          ],
        }),
      ),
    );
    renderChangeLog();

    expect(
      await screen.findByText("Creación del proyecto"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Proyecto creado por Laura Gómez desde la carga masiva (archivo proyectos_feria.xlsx, fila 4)",
      ),
    ).toBeInTheDocument();
    const data = screen.getByLabelText("Datos iniciales");

    expect(within(data).getByText("Robot clasificador")).toBeInTheDocument();
    expect(within(data).getByText("Aprobado")).toBeInTheDocument();
    // The origin is in the sentence, not repeated as a field
    expect(within(data).queryByText("ADMIN_BULK")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("pasa a")).not.toBeInTheDocument();
  });

  test("says when it was created from the form (origin at the entry level)", async () => {
    server.use(
      http.get("*/api/projects/7/change-log", () =>
        HttpResponse.json({
          entries: [
            {
              ...created,
              origin: "ADMIN_FORM",
              after: { name: "App de tutorías" },
            },
          ],
        }),
      ),
    );
    renderChangeLog();

    expect(
      await screen.findByText(
        "Proyecto creado por Laura Gómez desde el formulario",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("App de tutorías")).toBeInTheDocument();
  });
});
