import { http, HttpResponse } from "msw";

import { AdminProjectEditor } from "../admin-project-editor";
import { AdminProjectParticipants } from "../admin-project-participants";

import { gatewayError, renderWithClient } from "./render-with-client";

import { server } from "@/testing/mocks/server";
import { screen, userEvent, waitFor, within } from "@/testing/test-utils";

const enrolled = {
  userId: 42,
  studentCode: "200111",
  firstName: "Ana",
  lastName: "Ruiz",
  email: "ana@uninorte.edu.co",
};
const pending = {
  pendingId: 5,
  firstName: "Luis",
  lastName: "Gómez",
  email: "luis@uninorte.edu.co",
  studentCode: "200222",
  status: "PENDING",
};

const renderParticipants = () =>
  renderWithClient(
    <AdminProjectParticipants
      participants={[enrolled]}
      pendingParticipants={[
        pending,
        { ...pending, pendingId: 6, status: "JOINED" },
      ]}
      projectId={7}
    />,
  );

const fillParticipant = async (user: ReturnType<typeof userEvent.setup>) => {
  const form = screen.getByRole("form", {
    name: "Agregar integrante pendiente",
  });
  const field = (name: RegExp) => within(form).getByRole("textbox", { name });

  await user.type(field(/^nombre/i), "Marta");
  await user.type(field(/^apellido/i), "Díaz");
  await user.type(field(/correo/i), "marta@uninorte.edu.co");
  await user.type(field(/código de estudiante/i), "200333");
  await user.type(field(/semestre/i), "5");
  await user.type(field(/carrera/i), "Ingeniería de Sistemas");

  return form;
};

describe("AdminProjectParticipants", () => {
  test("lists the enrolled and pending participants, not the pending rows that already joined", () => {
    renderParticipants();

    const list = screen.getByRole("region", {
      name: "Integrantes del proyecto",
    });

    expect(within(list).getByText("Ana Ruiz")).toBeInTheDocument();
    expect(within(list).getByText(/^Inscrito/)).toBeInTheDocument();
    expect(within(list).getAllByText("Luis Gómez")).toHaveLength(1);
    expect(within(list).getByText(/^Pendiente/)).toBeInTheDocument();
  });

  test("validates the new participant before sending it", async () => {
    const posted = vi.fn();

    server.use(
      http.post("*/api/projects/:projectId/admin/participants", () => {
        posted();

        return HttpResponse.json({});
      }),
    );
    const user = userEvent.setup();

    renderParticipants();
    await user.click(
      screen.getByRole("button", { name: "Agregar integrante" }),
    );

    expect(
      await screen.findByText("El nombre es obligatorio"),
    ).toBeInTheDocument();
    expect(screen.getByText("El correo es obligatorio")).toBeInTheDocument();
    expect(
      screen.getByText("El semestre debe ser un número"),
    ).toBeInTheDocument();
    expect(posted).not.toHaveBeenCalled();
  });

  test("adds a pending participant with the reason", async () => {
    let body: Record<string, unknown> | null = null;

    server.use(
      http.post(
        "*/api/projects/:projectId/admin/participants",
        async ({ request }) => {
          body = (await request.json()) as Record<string, unknown>;

          return HttpResponse.json(
            {
              participant: null,
              pendingParticipant: { pendingId: 9, status: "PENDING" },
              failedEffects: [],
              warning: null,
            },
            { status: 201 },
          );
        },
      ),
    );
    const user = userEvent.setup();

    renderParticipants();
    await user.type(
      screen.getAllByRole("textbox", { name: /motivo/i })[0],
      "Faltaba",
    );
    await fillParticipant(user);
    await user.click(
      screen.getByRole("button", { name: "Agregar integrante" }),
    );

    await waitFor(() =>
      expect(body).toEqual({
        firstName: "Marta",
        lastName: "Díaz",
        email: "marta@uninorte.edu.co",
        studentCode: "200333",
        semester: "5",
        career: "Ingeniería de Sistemas",
        reason: "Faltaba",
      }),
    );
  });

  test("shows the 409 of the backend when the student is in another project", async () => {
    server.use(
      http.post("*/api/projects/:projectId/admin/participants", () =>
        gatewayError(
          409,
          "El estudiante marta@uninorte.edu.co ya participa en otro proyecto activo de este evento (proyecto 12).",
          {
            code: "PARTICIPANT_HAS_ACTIVE_PROJECT",
            details: { email: "marta@uninorte.edu.co", projectId: 12 },
          },
        ),
      ),
    );
    const user = userEvent.setup();

    renderParticipants();
    const form = await fillParticipant(user);

    await user.click(
      screen.getByRole("button", { name: "Agregar integrante" }),
    );

    expect(await within(form).findByRole("alert")).toHaveTextContent(
      "ya participa en otro proyecto activo de este evento (proyecto 12)",
    );
  });

  test("removes an enrolled participant after the confirmation", async () => {
    const removed: string[] = [];

    server.use(
      http.delete(
        "*/api/projects/:projectId/admin/participants/:userId",
        ({ request }) => {
          removed.push(new URL(request.url).pathname);

          return new HttpResponse(null, { status: 204 });
        },
      ),
    );
    const user = userEvent.setup();

    renderParticipants();
    await user.click(screen.getByRole("button", { name: "Quitar a Ana Ruiz" }));
    expect(removed).toHaveLength(0);
    await user.click(screen.getByRole("button", { name: "Confirmar" }));

    await waitFor(() =>
      expect(removed).toEqual(["/api/projects/7/admin/participants/42"]),
    );
  });

  test("removes a pending participant by its pending id and shows the 400 of the backend", async () => {
    const removed: string[] = [];

    server.use(
      http.delete(
        "*/api/projects/:projectId/admin/participants/pending/:pendingId",
        ({ request }) => {
          removed.push(new URL(request.url).pathname);

          return gatewayError(
            400,
            "No se puede quitar al único integrante del proyecto. Agrega otro integrante antes de quitar este.",
            { code: "LAST_PARTICIPANT", details: {} },
          );
        },
      ),
    );
    const user = userEvent.setup();

    renderParticipants();
    await user.click(
      screen.getByRole("button", { name: "Quitar a Luis Gómez" }),
    );
    await user.click(screen.getByRole("button", { name: "Confirmar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No se puede quitar al único integrante del proyecto",
    );
    expect(removed).toEqual(["/api/projects/7/admin/participants/pending/5"]);
  });
});

describe("AdminProjectEditor participants", () => {
  test("the list updates without reloading after an addition and a removal", async () => {
    let project = {
      id: 7,
      eventId: 3,
      name: "Robot clasificador",
      courseId: 10,
      participants: [
        enrolled,
        { ...enrolled, userId: 43, firstName: "Pedro", email: "pedro@x.co" },
      ],
      pendingParticipants: [] as Array<typeof pending>,
      tutors: [],
    };

    server.use(
      http.get("*/api/events/courses/dropdown/:eventId", () =>
        HttpResponse.json({ courses: [{ id: 10, code: "Software" }] }),
      ),
      http.get("*/api/projects/:projectId/admin/documents", () =>
        HttpResponse.json({ items: [] }),
      ),
      http.get("*/api/projects/:projectId", () => HttpResponse.json(project)),
      http.post("*/api/projects/:projectId/admin/participants", () => {
        project = {
          ...project,
          pendingParticipants: [
            { ...pending, pendingId: 9, firstName: "Marta", lastName: "Díaz" },
          ],
        };

        return HttpResponse.json(
          {
            participant: null,
            pendingParticipant: { pendingId: 9 },
            warning: null,
          },
          { status: 201 },
        );
      }),
      http.delete(
        "*/api/projects/:projectId/admin/participants/:userId",
        () => {
          project = {
            ...project,
            participants: project.participants.filter((p) => p.userId !== 43),
          };

          return new HttpResponse(null, { status: 204 });
        },
      ),
    );
    const user = userEvent.setup();

    renderWithClient(<AdminProjectEditor projectId={7} />);
    await user.click(await screen.findByRole("tab", { name: "Integrantes" }));
    await fillParticipant(user);
    await user.click(
      screen.getByRole("button", { name: "Agregar integrante" }),
    );

    const list = () =>
      screen.getByRole("region", { name: "Integrantes del proyecto" });

    expect(await within(list()).findByText("Marta Díaz")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Quitar a Pedro Ruiz" }),
    );
    await user.click(screen.getByRole("button", { name: "Confirmar" }));

    await waitFor(() =>
      expect(within(list()).queryByText("Pedro Ruiz")).not.toBeInTheDocument(),
    );
    expect(within(list()).getByText("Ana Ruiz")).toBeInTheDocument();
  });
});
