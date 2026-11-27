import { ProjectList } from "../project-list";

import {
  ADMIN_PERMISSIONS,
  DEAN_PERMISSIONS,
  renderWithSession,
} from "@/testing/render-with-session";
import { screen } from "@/testing/test-utils";

const project = {
  id: 7,
  name: "Robot clasificador",
  description: "Clasifica residuos",
  state: "UNDER_REVIEW",
  eventId: 1,
  reason: null,
  documents: [],
  participants: [],
  pendingParticipants: [],
  jurors: [],
};

vi.mock("@/features/projects/api/get-projects-with-jurors", () => ({
  useProjectsWithJurors: () => ({
    isLoading: false,
    data: { data: [project], meta: { totalPages: 1 } },
  }),
}));

vi.mock("@/features/events/api/get-events", () => ({
  useEvents: () => ({ isLoading: false, data: { data: [] } }),
}));

// The details dialog has its own permission tests (view-details)
vi.mock("../view-details", () => ({
  ViewDetails: () => null,
}));

// Approve, reject and request changes: PATCH /projects/:id/approve|reject|request-changes (manage:events)
const REVIEW_ACTIONS = [/^aprobar$/i, /^rechazar$/i, /^pedir cambios$/i];

describe("Proyectos: aprobar, rechazar y pedir cambios", () => {
  test("a read-only session (Dean) does not see the review actions", async () => {
    await renderWithSession(<ProjectList />, DEAN_PERMISSIONS);

    expect(screen.getAllByText(project.name).length).toBeGreaterThan(0);
    for (const name of REVIEW_ACTIONS) {
      expect(screen.queryByRole("button", { name })).not.toBeInTheDocument();
    }
    expect(
      screen.queryByRole("button", { name: /cambiar estado/i }),
    ).not.toBeInTheDocument();
  });

  test("a session with manage:events sees them on the project card", async () => {
    await renderWithSession(<ProjectList />, ADMIN_PERMISSIONS);

    for (const name of REVIEW_ACTIONS) {
      expect(await screen.findByRole("button", { name })).toBeInTheDocument();
    }
  });
});
