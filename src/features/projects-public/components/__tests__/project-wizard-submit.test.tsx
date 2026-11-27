import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { vi } from "vitest";

import { ProjectWizard } from "../project-wizard";

import { server } from "@/testing/mocks/server";
import { rtlRender, screen, userEvent, waitFor } from "@/testing/test-utils";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(""),
  usePathname: () => "/",
}));

type User = ReturnType<typeof userEvent.setup>;

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
    http.get("*/api/events/courses/event/5", () =>
      HttpResponse.json({ courses: [{ id: 30, code: "SIS", name: "SIS" }] }),
    ),
    http.get("*/api/events/courses/30", () =>
      HttpResponse.json({ course: { id: 30, code: "SIS", name: "SIS" } }),
    ),
  );
};

const renderWizard = (
  eventType: "Competition" | "Exposition",
  mode: "public" | "admin",
) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return rtlRender(
    <QueryClientProvider client={queryClient}>
      <ProjectWizard eventId={5} eventType={eventType} mode={mode} />
    </QueryClientProvider>,
  );
};

const fillParticipant = async (user: User, withLists: boolean) => {
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
  if (withLists) {
    await user.click(screen.getByRole("button", { name: /carrera/i }));
    await user.click(
      await screen.findByRole("option", {
        name: "Ingeniería de Sistemas y Computación",
      }),
    );
    await user.click(screen.getByRole("button", { name: /semestre/i }));
    await user.click(
      await screen.findByRole("option", { name: "5to Semestre" }),
    );
  }
  await user.click(
    screen.getByRole("button", { name: /agregar participante/i }),
  );
};

beforeEach(() => {
  mockBackend();
});

describe("ProjectWizard submit", () => {
  test("public mode sends the competition once to POST /projects", async () => {
    let publicCalls = 0;
    let adminCalls = 0;

    server.use(
      http.post("*/api/projects", () => {
        publicCalls++;

        return HttpResponse.json({ id: 1 }, { status: 201 });
      }),
      http.post("*/api/projects/admin", () => {
        adminCalls++;

        return HttpResponse.json({}, { status: 201 });
      }),
    );
    const user = userEvent.setup();

    renderWizard("Competition", "public");
    await fillParticipant(user, true);
    await user.click(screen.getByRole("button", { name: "Siguiente" }));
    await user.click(
      await screen.findByRole("button", { name: /inscribir equipo/i }),
    );

    expect(
      await screen.findByText("¡Equipo Inscrito Exitosamente!"),
    ).toBeInTheDocument();
    expect(publicCalls).toBe(1);
    expect(adminCalls).toBe(0);
  }, 20000);

  test("admin mode sends an exposition with its poster to POST /projects/admin", async () => {
    let publicCalls = 0;
    const sent: Record<string, string> = {};

    server.use(
      http.post("*/api/projects", () => {
        publicCalls++;

        return HttpResponse.json({ id: 1 }, { status: 201 });
      }),
      http.post("*/api/projects/admin", async ({ request }) => {
        (await request.formData()).forEach((value, key) => {
          sent[key] = String(value);
        });

        return HttpResponse.json(
          {
            project: { id: 88, name: "Robot clasificador" },
            failedEffects: [],
            warning: null,
          },
          { status: 201 },
        );
      }),
    );
    const user = userEvent.setup({ applyAccept: false });
    const { container } = renderWizard("Exposition", "admin");

    await fillParticipant(user, false);
    await user.click(screen.getByRole("button", { name: "Siguiente" }));

    await user.type(
      await screen.findByRole("textbox", { name: /nombre del proyecto/i }),
      "Robot clasificador",
    );
    await user.click(screen.getByRole("button", { name: /categoría/i }));
    await user.click(await screen.findByRole("option", { name: "SIS" }));
    await user.click(screen.getByRole("button", { name: "Siguiente" }));

    const posterInput = await waitFor(() => {
      const input =
        container.querySelector<HTMLInputElement>('input[type="file"]');

      if (!input) throw new Error("poster input not rendered");

      return input;
    });

    await user.upload(
      posterInput,
      new File([new Uint8Array([1, 2, 3])], "poster.png", {
        type: "image/png",
      }),
    );
    await user.click(screen.getByRole("button", { name: "Siguiente" }));
    await user.click(
      await screen.findByRole("button", { name: "Crear proyecto" }),
    );

    expect(await screen.findByText("Proyecto creado")).toBeInTheDocument();
    expect(publicCalls).toBe(0);
    expect(sent.state).toBe("APPROVED");
    expect(sent.name).toBe("Robot clasificador");
    expect(sent.eventType).toBe("Exposition");
    expect(JSON.parse(sent.documents)).toEqual([{ type: "POSTER", url: "" }]);
  }, 20000);
});
