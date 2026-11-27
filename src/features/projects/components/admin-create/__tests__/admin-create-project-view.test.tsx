import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { vi } from "vitest";

import { AdminCreateProjectView } from "../admin-create-project-view";

import { server } from "@/testing/mocks/server";
import {
  rtlRender,
  screen,
  userEvent,
  waitFor,
  within,
} from "@/testing/test-utils";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockPush }),
  useSearchParams: () => new URLSearchParams("event=5"),
  usePathname: () => "/app/projects/new",
}));

const mockBackend = () => {
  server.use(
    http.get("*/api/auth/me", () =>
      HttpResponse.json({
        id: 1,
        firstName: "Admin",
        lastName: "Iris",
        email: "admin@iris.local",
        active: true,
        status: "CONFIRMED",
        platformRoles: [],
        platformPermissions: ["manage:projects"],
      }),
    ),
    http.get("*/api/events/5", () =>
      HttpResponse.json({
        event: { id: 5, name: "Hackatón 2026", eventType: "Competition" },
      }),
    ),
    http.get("*/api/events/courses/event/5", () =>
      HttpResponse.json({ courses: [{ id: 30, name: "General" }] }),
    ),
    http.get("*/api/events/courses/30", () =>
      HttpResponse.json({ course: { id: 30, name: "General" } }),
    ),
  );
};

/** Admin data is prefilled from the session: replaced by a student */
const addParticipant = async (user: ReturnType<typeof userEvent.setup>) => {
  const field = (name: RegExp) => screen.getByRole("textbox", { name });

  for (const [name, value] of [
    [/primer nombre/i, "Marta"],
    [/apellido/i, "Díaz"],
    [/correo/i, "marta@uninorte.edu.co"],
    [/código estudiantil/i, "200333444"],
  ] as const) {
    await user.clear(field(name));
    await user.type(field(name), value);
  }
  await user.click(screen.getByRole("button", { name: /carrera/i }));
  await user.click(
    await screen.findByRole("option", {
      name: "Ingeniería de Sistemas y Computación",
    }),
  );
  await user.click(screen.getByRole("button", { name: /semestre/i }));
  await user.click(await screen.findByRole("option", { name: "5to Semestre" }));
  await user.click(
    screen.getByRole("button", { name: /agregar participante/i }),
  );
};

const goToReview = async (user: ReturnType<typeof userEvent.setup>) => {
  await screen.findByText(/Evento: Hackatón 2026/);
  await addParticipant(user);
  await user.click(screen.getByRole("button", { name: "Siguiente" }));
  await screen.findByText(/Vista previa del proyecto/);
};

const renderView = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  rtlRender(
    <QueryClientProvider client={queryClient}>
      <AdminCreateProjectView />
    </QueryClientProvider>,
  );
};

beforeEach(() => {
  mockPush.mockReset();
  mockBackend();
});

describe("AdminCreateProjectView", () => {
  test("creates the project with POST /projects/admin and the chosen initial state", async () => {
    const sent: Record<string, string> = {};

    server.use(
      http.post("*/api/projects/admin", async ({ request }) => {
        (await request.formData()).forEach((value, key) => {
          sent[key] = String(value);
        });

        return HttpResponse.json(
          {
            project: { id: 77, name: "Equipo de Marta", state: "UNDER_REVIEW" },
            participants: [],
            failedEffects: [],
            warning: null,
          },
          { status: 201 },
        );
      }),
    );
    const user = userEvent.setup();

    renderView();
    await goToReview(user);

    const stateGroup = screen.getByRole("radiogroup", {
      name: "Estado inicial del proyecto",
    });

    expect(
      within(stateGroup).getByRole("radio", { name: "Aprobado" }),
    ).toBeChecked();
    await user.click(
      within(stateGroup).getByRole("radio", { name: "En revisión" }),
    );
    await user.click(screen.getByRole("button", { name: "Crear proyecto" }));

    expect(await screen.findByText("Proyecto creado")).toBeInTheDocument();
    expect(sent.state).toBe("UNDER_REVIEW");
    expect(sent.eventId).toBe("5");
    expect(JSON.parse(sent.participants)[0].email).toBe(
      "marta@uninorte.edu.co",
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(
      screen.getByText("Ver proyectos del evento").closest("a"),
    ).toHaveAttribute("href", "/app/projects?event=5&state=UNDER_REVIEW");
  }, 20000);

  test.each([
    ["PROJECT_NAME_TAKEN", "Ya existe un proyecto con ese nombre en el evento"],
    [
      "PARTICIPANT_IN_OTHER_PROJECT",
      "Uno o más integrantes ya están en otro proyecto",
    ],
    ["EVENT_RESULTS_PUBLISHED", "El evento ya publicó sus resultados"],
  ])(
    "shows the 409 %s in Spanish and stays on the review",
    async (code, message) => {
      server.use(
        http.post("*/api/projects/admin", () =>
          HttpResponse.json(
            { statusCode: 409, code, message: "Conflict" },
            { status: 409 },
          ),
        ),
      );
      const user = userEvent.setup();

      renderView();
      await goToReview(user);
      await user.click(screen.getByRole("button", { name: "Crear proyecto" }));

      expect(await screen.findByText(new RegExp(message))).toBeInTheDocument();
      expect(
        screen.getByText("No se pudo crear el proyecto"),
      ).toBeInTheDocument();
      expect(screen.queryByText("Proyecto creado")).not.toBeInTheDocument();
    },
    20000,
  );

  test("warns about failedEffects and offers to upload the documents again", async () => {
    server.use(
      http.post("*/api/projects/admin", () =>
        HttpResponse.json(
          {
            project: { id: 77, name: "Equipo de Marta", state: "APPROVED" },
            participants: [],
            failedEffects: ["DOCUMENTS", "NOTIFICATION"],
            warning: "El proyecto se creó, pero fallaron algunas acciones.",
          },
          { status: 201 },
        ),
      ),
      http.get("*/api/projects/77/admin/documents", () =>
        HttpResponse.json({ documents: [] }),
      ),
    );
    const user = userEvent.setup();

    renderView();
    await goToReview(user);
    await user.click(screen.getByRole("button", { name: "Crear proyecto" }));

    const alert = await screen.findByRole("alert");

    expect(
      within(alert).getByText(
        "El proyecto se creó, pero fallaron algunas acciones.",
      ),
    ).toBeInTheDocument();
    expect(
      within(alert).getByText("No se pudieron subir los documentos."),
    ).toBeInTheDocument();
    expect(
      within(alert).getByText(
        "No se pudieron registrar los correos de aprobación.",
      ),
    ).toBeInTheDocument();

    await user.click(
      within(alert).getByRole("button", { name: /volver a subir documentos/i }),
    );
    await waitFor(() =>
      expect(screen.getByRole("dialog")).toHaveTextContent(
        "Documentos de «Equipo de Marta»",
      ),
    );
  }, 20000);
});
