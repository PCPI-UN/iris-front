import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";

import { ProjectChangeLog } from "../project-change-log";

import { server } from "@/testing/mocks/server";
import { rtlRender, screen } from "@/testing/test-utils";

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

describe("ProjectChangeLog", () => {
  test("shows the action, author, date, states and reason of each change", async () => {
    server.use(
      http.get("*/api/projects/7/change-log", () =>
        HttpResponse.json({
          entries: [
            {
              id: 3,
              action: "STATE",
              actor: { id: 12, name: "Laura Gómez" },
              createdAt: "2026-11-20T15:04:05.000Z",
              before: { state: "APPROVED" },
              after: { state: "UNDER_REVIEW" },
              reason: "Se aprobó por error",
            },
            {
              id: 2,
              action: "INFO",
              actor: { id: 9, name: null },
              createdAt: "2026-11-19T10:00:00.000Z",
              before: { name: "Robot" },
              after: { name: "Robot clasificador" },
              reason: null,
            },
          ],
        }),
      ),
    );
    renderChangeLog();

    expect(await screen.findByText("Cambio de estado")).toBeInTheDocument();
    expect(screen.getByText("Por Laura Gómez")).toBeInTheDocument();
    expect(screen.getByText("Aprobado")).toBeInTheDocument();
    expect(screen.getByText("En revisión")).toBeInTheDocument();
    expect(screen.getByText("Se aprobó por error")).toBeInTheDocument();
    expect(
      document.querySelector('time[datetime="2026-11-20T15:04:05.000Z"]'),
    ).not.toBeNull();

    // Author without a resolved name, and a field change other than the state
    expect(screen.getByText("Por Usuario #9")).toBeInTheDocument();
    expect(screen.getByText("Nombre:")).toBeInTheDocument();
    expect(screen.getByText("Robot clasificador")).toBeInTheDocument();
  });

  test("shows an empty state when the project has no changes", async () => {
    server.use(
      http.get("*/api/projects/7/change-log", () =>
        HttpResponse.json({ entries: [] }),
      ),
    );
    renderChangeLog();

    expect(
      await screen.findByText(
        "Este proyecto aún no tiene cambios administrativos.",
      ),
    ).toBeInTheDocument();
  });
});
