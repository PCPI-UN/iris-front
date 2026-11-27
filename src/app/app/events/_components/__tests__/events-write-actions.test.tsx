import { Events } from "../events";

import {
  ADMIN_PERMISSIONS,
  DEAN_PERMISSIONS,
  renderWithSession,
} from "@/testing/render-with-session";
import { screen } from "@/testing/test-utils";

const event = {
  id: 3,
  name: "Feria de proyectos 2026-2",
  description: "Muestra de proyectos de ingeniería",
  startDate: "2099-11-20T00:00:00.000Z",
  endDate: "2099-11-30T00:00:00.000Z",
  inscriptionDeadline: "2099-11-10T00:00:00.000Z",
  accessCode: "FERIA26",
  isPubliclyJoinable: true,
  evaluationsOpened: false,
  resultsPublished: false,
  termId: null,
};

vi.mock("@/features/events/api/get-events", () => ({
  useEvents: () => ({
    isLoading: false,
    data: { data: [event], meta: { totalPages: 1 } },
  }),
}));

// The term label fetches its own data and is not an action
vi.mock("@/features/events/components/event-term-label", () => ({
  EventTermLabel: () => null,
}));

const WRITE_ACTIONS = [
  /crear evento/i,
  /actualizar evento/i,
  /eliminar evento/i,
  /publicar resultados/i,
];

describe("Eventos: acciones de escritura", () => {
  test("a read-only session (Dean) sees the event but no write action", async () => {
    await renderWithSession(<Events />, DEAN_PERMISSIONS);

    expect(screen.getByText(event.name)).toBeInTheDocument();
    for (const name of WRITE_ACTIONS) {
      expect(screen.queryByRole("button", { name })).not.toBeInTheDocument();
    }
    expect(
      screen.queryByRole("switch", { name: /publicar resultados/i }),
    ).not.toBeInTheDocument();
  });

  test("a session with manage:events sees create, update and delete", async () => {
    await renderWithSession(<Events />, ADMIN_PERMISSIONS);

    expect(
      await screen.findByRole("button", { name: /crear evento/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /actualizar evento/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /eliminar evento/i }),
    ).toBeInTheDocument();
  });
});
