import { AdministratorsList } from "../administrators-list";

import {
  ADMIN_PERMISSIONS,
  DEAN_PERMISSIONS,
  renderWithSession,
} from "@/testing/render-with-session";
import { screen } from "@/testing/test-utils";

vi.mock("@/features/administrators/api/get-administrators", () => ({
  useAdministrators: () => ({
    isLoading: false,
    data: {
      data: [
        {
          id: 1,
          email: "facultad@unal.edu.co",
          invitationStatus: "ACCEPTED",
          createdAt: "2026-11-01T00:00:00.000Z",
        },
      ],
      meta: { total: 1, totalPages: 1 },
    },
  }),
}));

describe("Administradores: invitar", () => {
  test("a read-only session (Dean) does not see Invitar Administrador", async () => {
    await renderWithSession(<AdministratorsList />, DEAN_PERMISSIONS);

    expect(screen.getByRole("button", { name: /estado/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /invitar administrador/i }),
    ).not.toBeInTheDocument();
  });

  test("a session with create:users sees it", async () => {
    await renderWithSession(<AdministratorsList />, ADMIN_PERMISSIONS);

    expect(
      await screen.findByRole("button", { name: /invitar administrador/i }),
    ).toBeInTheDocument();
  });
});
