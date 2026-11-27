import { JuriesList } from "../juries-list";

import {
  ADMIN_PERMISSIONS,
  DEAN_PERMISSIONS,
  renderWithSession,
} from "@/testing/render-with-session";
import { screen } from "@/testing/test-utils";

const invitations = [
  // Pending: accept and resend
  {
    id: "15",
    email: "pendiente@unal.edu.co",
    status: 0,
    event: { name: "Feria" },
  },
  // Expired: resend
  {
    id: "16",
    email: "vencida@unal.edu.co",
    status: 3,
    event: { name: "Feria" },
  },
];

vi.mock("@/features/juries/api/get-juries", () => ({
  useJuryInvitations: () => ({
    isLoading: false,
    data: { invitations, meta: { total: 2, totalPages: 1 } },
  }),
}));

vi.mock("@/features/events/api/get-events-dropdown", () => ({
  useEventsDropdown: () => ({
    isLoading: false,
    data: { data: [{ id: 1, name: "Feria" }] },
  }),
}));

describe("Jurados: acciones de escritura", () => {
  test("a read-only session (Dean) sees the invitations without actions or the Acciones column", async () => {
    await renderWithSession(<JuriesList />, DEAN_PERMISSIONS);

    expect(screen.getByText("pendiente@unal.edu.co")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /invitar jurado/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /importar excel/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /reenviar invitación/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /aceptar invitación/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("columnheader", { name: "Acciones" }),
    ).not.toBeInTheDocument();
  });

  test("a session with manage:events can invite, import, accept and resend", async () => {
    await renderWithSession(<JuriesList />, ADMIN_PERMISSIONS);

    expect(
      await screen.findByRole("button", { name: /invitar jurado/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /importar excel/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Acciones" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /aceptar invitación/i }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: /reenviar invitación/i }),
    ).toHaveLength(2);
  });
});
