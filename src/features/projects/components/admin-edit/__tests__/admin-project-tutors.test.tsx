import { http, HttpResponse } from "msw";

import { AdminProjectTutors, tutorsSignature } from "../admin-project-tutors";

import { gatewayError, renderWithClient } from "./render-with-client";

import { server } from "@/testing/mocks/server";
import { screen, userEvent, waitFor, within } from "@/testing/test-utils";

const TUTORS = [
  { userId: 12, firstName: "Laura", lastName: "Gómez", pending: false },
  { firstName: "Iván", lastName: "Paz", email: "ivan@x.co", pending: true },
];

const renderTutors = () =>
  renderWithClient(<AdminProjectTutors projectId={7} tutors={TUTORS} />);

const saveButton = () =>
  screen.getByRole("button", { name: "Guardar tutores" });

const addPendingTutor = async (
  user: ReturnType<typeof userEvent.setup>,
  firstName: string,
  email: string,
) => {
  await user.click(
    screen.getByRole("button", { name: "No encuentro al tutor" }),
  );
  await user.type(
    screen.getByRole("textbox", { name: /nombre\(s\)/i }),
    firstName,
  );
  await user.type(
    screen.getByRole("textbox", { name: /correo del tutor/i }),
    email,
  );
  await user.click(screen.getByRole("button", { name: "Agregar tutor" }));
};

describe("tutorsSignature", () => {
  test("ignores the order but not the names", () => {
    const base = {
      userIds: [2, 1],
      pending: [
        { firstName: "Iván", email: "b@x.co" },
        { firstName: "Ana", email: "a@x.co" },
      ],
    };

    expect(tutorsSignature(base)).toBe(
      tutorsSignature({
        userIds: [1, 2],
        pending: [...base.pending].reverse(),
      }),
    );
    expect(tutorsSignature(base)).not.toBe(
      tutorsSignature({
        ...base,
        pending: [
          { firstName: "Iván", lastName: "Paz", email: "b@x.co" },
          base.pending[1],
        ],
      }),
    );
  });
});

describe("AdminProjectTutors", () => {
  test("replaces the tutors with PUT /projects/:id/tutors and the reason", async () => {
    let body: Record<string, unknown> | null = null;

    server.use(
      http.get("*/api/projects/tutor-candidates", ({ request }) =>
        HttpResponse.json(
          new URL(request.url).searchParams.get("search") === "car"
            ? [{ id: 20, firstName: "Carlos", lastName: "Mora" }]
            : [],
        ),
      ),
      http.put("*/api/projects/:projectId/tutors", async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;

        return HttpResponse.json({ tutors: [] });
      }),
    );
    const user = userEvent.setup();

    renderTutors();
    expect(saveButton()).toBeDisabled();

    await user.click(
      screen.getByRole("button", { name: "Quitar a Laura Gómez" }),
    );
    await user.click(screen.getByRole("button", { name: "Quitar a Iván Paz" }));
    await user.type(
      screen.getByRole("textbox", { name: /buscar tutor/i }),
      "car",
    );
    await user.click(
      await screen.findByRole("button", { name: "Carlos Mora" }),
    );
    await addPendingTutor(user, "Sara", "sara@x.co");
    await user.type(
      screen.getByRole("textbox", { name: /motivo/i }),
      "Cambio de tutor",
    );
    await user.click(saveButton());

    await waitFor(() =>
      expect(body).toEqual({
        userIds: [20],
        pending: [{ firstName: "Sara", email: "sara@x.co" }],
        reason: "Cambio de tutor",
      }),
    );
  });

  test("a pending tutor added again with a corrected name counts as a change", async () => {
    let body: Record<string, unknown> | null = null;

    server.use(
      http.put("*/api/projects/:projectId/tutors", async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;

        return HttpResponse.json({ tutors: [] });
      }),
    );
    const user = userEvent.setup();

    renderTutors();
    await user.click(screen.getByRole("button", { name: "Quitar a Iván Paz" }));
    expect(saveButton()).toBeEnabled();
    await addPendingTutor(user, "Iván Darío", "ivan@x.co");

    expect(saveButton()).toBeEnabled();
    await user.click(saveButton());
    await waitFor(() =>
      expect(body).toEqual({
        userIds: [12],
        pending: [{ firstName: "Iván Darío", email: "ivan@x.co" }],
      }),
    );
  });

  test("going back to the saved list disables saving", async () => {
    const user = userEvent.setup();

    renderTutors();
    await user.click(screen.getByRole("button", { name: "Quitar a Iván Paz" }));
    await addPendingTutor(user, "Iván", "ivan@x.co");

    // Same email but no last name: still a change
    expect(saveButton()).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Descartar cambios" }));

    expect(saveButton()).toBeDisabled();
    expect(
      within(
        screen.getByRole("list", { name: "Tutores del proyecto" }),
      ).getByText("Iván Paz · ivan@x.co · Pendiente"),
    ).toBeInTheDocument();
  });

  test("shows the error of the backend in the form", async () => {
    server.use(
      http.put("*/api/projects/:projectId/tutors", () =>
        gatewayError(400, "El usuario 12 no tiene el rol Tutor ni Profesor"),
      ),
    );
    const user = userEvent.setup();

    renderTutors();
    await user.click(screen.getByRole("button", { name: "Quitar a Iván Paz" }));
    await user.click(saveButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "El usuario 12 no tiene el rol Tutor ni Profesor",
    );
  });
});
