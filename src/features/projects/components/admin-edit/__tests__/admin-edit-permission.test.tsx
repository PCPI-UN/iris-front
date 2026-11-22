import { http, HttpResponse } from "msw";

import { ViewDetails } from "../../view-details";

import { renderWithClient } from "./render-with-client";

import { server } from "@/testing/mocks/server";
import { screen, userEvent, waitFor } from "@/testing/test-utils";
import { Project } from "@/types/api";

const session = { loaded: false };

const mockSession = (permissions: string[]) => {
  session.loaded = false;
  server.use(
    http.get("*/api/auth/me", () => {
      session.loaded = true;

      return HttpResponse.json({
        id: 1,
        firstName: "Ana",
        lastName: "Ruiz",
        email: "ana@uninorte.edu.co",
        active: true,
        status: "CONFIRMED",
        platformRoles: [],
        platformPermissions: permissions,
      });
    }),
    http.get("*/api/projects/:projectId/change-log", () =>
      HttpResponse.json({ entries: [] }),
    ),
    http.get("*/api/projects/:projectId", () =>
      HttpResponse.json({ ...project, tutors: [], pendingParticipants: [] }),
    ),
    http.get("*/api/events/courses/dropdown/:eventId", () =>
      HttpResponse.json({ courses: [{ id: 10, code: "Software" }] }),
    ),
  );
};

const project = {
  id: 7,
  eventId: 3,
  courseId: 10,
  name: "Robot clasificador",
  description: "Clasifica residuos",
  state: "UNDER_REVIEW",
  participants: [],
  pendingParticipants: [],
  documents: [],
  reason: null,
} as unknown as Project;

const openDetails = async () => {
  const user = userEvent.setup();

  renderWithClient(<ViewDetails project={project} />);
  await user.click(screen.getByRole("button", { name: /ver detalles/i }));
  await screen.findByText("Detalles del proyecto");

  return user;
};

describe("administrative edit of a project", () => {
  test("is hidden without manage:projects", async () => {
    mockSession(["read:events", "manage:events"]);
    await openDetails();

    // The session must have loaded before checking the button is not there
    await waitFor(() => expect(session.loaded).toBe(true));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(
      screen.queryByRole("button", { name: "Editar" }),
    ).not.toBeInTheDocument();
  });

  test("with manage:projects opens the edit mode with its sections", async () => {
    mockSession(["read:events", "manage:projects"]);
    const user = await openDetails();

    // The detail shows the category by its code
    expect(await screen.findByText("Software")).toBeInTheDocument();
    await user.click(await screen.findByRole("button", { name: "Editar" }));

    expect(await screen.findByText("Editar proyecto")).toBeInTheDocument();
    for (const tab of [
      "Datos y categoría",
      "Integrantes",
      "Tutores",
      "Documentos",
    ]) {
      expect(await screen.findByRole("tab", { name: tab })).toBeInTheDocument();
    }
    expect(await screen.findByRole("textbox", { name: /nombre/i })).toHaveValue(
      "Robot clasificador",
    );

    await user.click(screen.getByRole("button", { name: "Volver al detalle" }));
    expect(
      await screen.findByText("Detalles del proyecto"),
    ).toBeInTheDocument();
  });
});
