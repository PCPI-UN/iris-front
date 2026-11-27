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
              // Shape written by the project service
              after: {
                name: "Robot clasificador",
                state: "APPROVED",
                participants: ["ana@unal.edu.co"],
                tutors: { userIds: [3, 5], emails: ["tutor@unal.edu.co"] },
                origin: {
                  kind: "ADMIN_BULK",
                  fileName: "proyectos_feria.xlsx",
                  rowNumber: 4,
                },
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
    expect(
      within(data).getByText("2 con cuenta; tutor@unal.edu.co"),
    ).toBeInTheDocument();
    // The origin is in the sentence, not repeated as a field
    expect(within(data).queryByText(/ADMIN_BULK/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText("pasa a")).not.toBeInTheDocument();
  });

  test("says when it was created from the form", async () => {
    server.use(
      http.get("*/api/projects/7/change-log", () =>
        HttpResponse.json({
          entries: [
            {
              ...created,
              after: {
                name: "App de tutorías",
                tutors: { userIds: [], emails: [] },
                origin: { kind: "ADMIN_FORM" },
              },
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
    expect(screen.queryByText(/userIds/)).not.toBeInTheDocument();
  });
});
