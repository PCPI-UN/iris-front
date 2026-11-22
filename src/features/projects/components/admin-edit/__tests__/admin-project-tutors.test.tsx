import { http, HttpResponse } from "msw";

import { AdminProjectTutors } from "../admin-project-tutors";

import { gatewayError, renderWithClient } from "./render-with-client";

import { server } from "@/testing/mocks/server";
import { screen, userEvent, waitFor } from "@/testing/test-utils";

const renderTutors = () =>
  renderWithClient(
    <AdminProjectTutors
      projectId={7}
      tutors={[
        { userId: 12, firstName: "Laura", lastName: "Gómez", pending: false },
        {
          firstName: "Iván",
          lastName: "Paz",
          email: "ivan@x.co",
          pending: true,
        },
      ]}
    />,
  );

describe("AdminProjectTutors", () => {
  test("replaces the tutors with PUT /projects/:id/tutors", async () => {
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

        return HttpResponse.json({
          tutors: [
            {
              userId: 20,
              firstName: "Carlos",
              lastName: "Mora",
              pending: false,
            },
          ],
        });
      }),
    );
    const user = userEvent.setup();

    renderTutors();
    expect(
      screen.getByRole("button", { name: "Guardar tutores" }),
    ).toBeDisabled();

    await user.click(
      screen.getByRole("button", { name: "Quitar tutor Laura Gómez" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Quitar tutor Iván Paz" }),
    );
    await user.type(
      screen.getByRole("textbox", { name: /buscar tutor/i }),
      "car",
    );
    await user.click(
      await screen.findByRole("button", { name: "Carlos Mora" }),
    );
    await user.type(
      screen.getByRole("textbox", { name: /nombre del tutor/i }),
      "Sara",
    );
    await user.type(
      screen.getByRole("textbox", { name: /correo del tutor/i }),
      "sara@x.co",
    );
    await user.click(
      screen.getByRole("button", { name: "Agregar a la lista" }),
    );
    await user.click(screen.getByRole("button", { name: "Guardar tutores" }));

    await waitFor(() =>
      expect(body).toEqual({
        userIds: [20],
        pending: [{ firstName: "Sara", email: "sara@x.co" }],
      }),
    );
  });

  test("shows the error of the backend", async () => {
    server.use(
      http.put("*/api/projects/:projectId/tutors", () =>
        gatewayError(400, "El usuario 12 no tiene el rol Tutor ni Profesor"),
      ),
    );
    const user = userEvent.setup();

    renderTutors();
    await user.click(
      screen.getByRole("button", { name: "Quitar tutor Iván Paz" }),
    );
    await user.click(screen.getByRole("button", { name: "Guardar tutores" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "El usuario 12 no tiene el rol Tutor ni Profesor",
    );
  });
});
