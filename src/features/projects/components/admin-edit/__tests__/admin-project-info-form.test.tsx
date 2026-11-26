import { http, HttpResponse } from "msw";

import { AdminProjectInfoForm, buildChanges } from "../admin-project-info-form";

import { gatewayError, renderWithClient } from "./render-with-client";

import { server } from "@/testing/mocks/server";
import { screen, userEvent, waitFor } from "@/testing/test-utils";

const project = {
  id: 7,
  eventId: 3,
  name: "Robot clasificador",
  description: "Clasifica residuos",
  projectCode: "RC-01",
  eventNumber: "12",
  courseId: 10,
};

type SentBody = Record<string, unknown>;

/** Records every body sent to PATCH /projects/:id/admin and answers in order */
const mockAdminPatch = (...responses: Array<(body: SentBody) => Response>) => {
  const bodies: SentBody[] = [];

  server.use(
    http.get("*/api/events/courses/dropdown/:eventId", () =>
      HttpResponse.json({
        courses: [
          { id: 10, code: "Software" },
          { id: 11, code: "Hardware" },
        ],
      }),
    ),
    http.patch("*/api/projects/:projectId/admin", async ({ request }) => {
      const body = (await request.json()) as SentBody;

      bodies.push(body);

      return responses[Math.min(bodies.length - 1, responses.length - 1)](body);
    }),
  );

  return bodies;
};

const renderForm = () =>
  renderWithClient(<AdminProjectInfoForm project={project} />);

const nameInput = () => screen.getByRole("textbox", { name: /nombre/i });
const saveButton = () =>
  screen.getByRole("button", { name: "Guardar cambios" });

/** Opens the category list (the visible HeroUI popover) and picks an option */
const chooseCategory = async (
  user: ReturnType<typeof userEvent.setup>,
  label: string,
) => {
  // The categories arrive after the first render
  await waitFor(() =>
    expect(
      Array.from(document.querySelectorAll("select option")).some(
        (option) => option.textContent === label,
      ),
    ).toBe(true),
  );
  await user.click(screen.getByRole("button", { name: /categoría/i }));
  await user.click(await screen.findByRole("option", { name: label }));
};

describe("buildChanges", () => {
  const initial = {
    name: "A",
    description: "B",
    projectCode: "C",
    eventNumber: "",
    courseId: "10",
  };

  test("only sends the fields that changed, and null for an emptied optional field", () => {
    expect(
      buildChanges(initial, {
        ...initial,
        name: " Nuevo ",
        projectCode: "  ",
        courseId: "11",
      }),
    ).toEqual({ name: "Nuevo", projectCode: null, courseId: 11 });
    expect(buildChanges(initial, initial)).toEqual({});
  });
});

describe("AdminProjectInfoForm", () => {
  test("keeps saving disabled until something changes", async () => {
    mockAdminPatch(() => HttpResponse.json(project));
    renderForm();

    expect(saveButton()).toBeDisabled();
    await userEvent.setup().type(nameInput(), " 2");
    expect(saveButton()).toBeEnabled();
  });

  test("does not send an empty name", async () => {
    const bodies = mockAdminPatch(() => HttpResponse.json(project));
    const user = userEvent.setup();

    renderForm();
    await user.clear(nameInput());
    await user.click(saveButton());

    expect(
      await screen.findByText("El nombre del proyecto es obligatorio"),
    ).toBeInTheDocument();
    expect(bodies).toHaveLength(0);
  });

  test("sends only the changed fields with the reason and invalidates the project", async () => {
    const bodies = mockAdminPatch(() =>
      HttpResponse.json({ ...project, name: "Robot clasificador 2" }),
    );
    const user = userEvent.setup();
    const { queryClient } = renderForm();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    await user.type(nameInput(), " 2");
    await user.type(
      screen.getByRole("textbox", { name: /motivo/i }),
      "Error de digitación",
    );
    await user.click(saveButton());

    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0]).toEqual({
      name: "Robot clasificador 2",
      reason: "Error de digitación",
    });
    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({
        queryKey: ["project-change-log", 7],
      }),
    );
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["projects"] });
  });

  test("shows the backend message in the name field when the name is taken", async () => {
    mockAdminPatch(() =>
      gatewayError(
        409,
        'Ya existe otro proyecto con el nombre "Dron" en este evento.',
        {
          code: "PROJECT_NAME_TAKEN",
          details: { name: "Dron" },
        },
      ),
    );
    const user = userEvent.setup();

    renderForm();
    await user.clear(nameInput());
    await user.type(nameInput(), "Dron");
    await user.click(saveButton());

    expect(
      await screen.findByText(
        'Ya existe otro proyecto con el nombre "Dron" en este evento.',
      ),
    ).toBeInTheDocument();
    expect(nameInput()).toHaveAttribute("aria-invalid", "true");
  });

  test("asks to confirm a blocked category change and resends it with force", async () => {
    const bodies = mockAdminPatch(
      () =>
        gatewayError(409, "No se cambió la categoría.", {
          code: "PROJECT_CATEGORY_CHANGE_BLOCKED",
          details: { evaluationCount: 2 },
        }),
      () => HttpResponse.json({ ...project, courseId: 11 }),
    );
    const user = userEvent.setup();

    renderForm();
    await chooseCategory(user, "Hardware");
    await user.click(saveButton());

    expect(
      await screen.findByText(/ya tiene 2 evaluaciones de jurados/),
    ).toBeInTheDocument();
    expect(bodies[0]).toEqual({ courseId: 11 });

    await user.click(
      screen.getByRole("button", { name: "Cambiar de todas formas" }),
    );

    await waitFor(() => expect(bodies).toHaveLength(2));
    expect(bodies[1]).toEqual({ courseId: 11, force: true });
    await waitFor(() =>
      expect(
        screen.queryByText(/ya tiene 2 evaluaciones de jurados/),
      ).not.toBeInTheDocument(),
    );
  });

  test("shows any other error of the backend in the form", async () => {
    mockAdminPatch(() =>
      gatewayError(400, "La categoría no es una categoría activa del evento"),
    );
    const user = userEvent.setup();

    renderForm();
    await chooseCategory(user, "Hardware");
    await user.click(saveButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "La categoría no es una categoría activa del evento",
    );
  });
});
