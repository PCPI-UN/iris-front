import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { vi } from "vitest";

import { AwardsTab } from "../awards-tab";

import {
  resetAwardsMockState,
  seedAwardsMockState,
} from "@/testing/mocks/handlers/awards";
import { server } from "@/testing/mocks/server";
import {
  createUser,
  loginAsUser,
  rtlRender,
  screen,
  userEvent,
  waitFor,
  within,
} from "@/testing/test-utils";

const EVENT_ID = 1;
const CATEGORY_ID = 2;

const rankingProject = (
  id: number,
  name: string,
  position: number,
  averageGrade: number,
) => ({
  id,
  name,
  position,
  averageGrade,
  evaluationCount: 3,
  participants: [],
});

// Alfa and Beta share the first position: co-winners
const RANKING = [
  rankingProject(10, "Alfa", 1, 4.5),
  rankingProject(11, "Beta", 1, 4.5),
  rankingProject(12, "Gamma", 2, 4.1),
];

const mockSession = (permissions: string[]) =>
  server.use(
    http.get("*/api/auth/me", () =>
      HttpResponse.json({
        id: 1,
        firstName: "Admin",
        lastName: "System",
        email: "admin@iris.local",
        active: true,
        status: "CONFIRMED",
        platformRoles: [],
        platformPermissions: permissions,
      }),
    ),
  );

const rankingLimits: string[] = [];

beforeEach(async () => {
  resetAwardsMockState();
  rankingLimits.length = 0;
  // The awards handlers read the session cookie, like the other mocks
  await loginAsUser(await createUser());
  mockSession(["read:events", "read:grades", "manage:events"]);
  server.use(
    http.get(
      "*/api/evaluations/courses/:courseId/top-projects",
      ({ request }) => {
        rankingLimits.push(
          new URL(request.url).searchParams.get("limit") ?? "",
        );

        return HttpResponse.json({
          items: RANKING,
          courseId: CATEGORY_ID,
          eventId: EVENT_ID,
        });
      },
    ),
  );
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

const renderTab = (props: Partial<Parameters<typeof AwardsTab>[0]> = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return rtlRender(
    <QueryClientProvider client={queryClient}>
      <AwardsTab
        selectedCategoryId={CATEGORY_ID}
        selectedCategoryName="Ingeniería"
        selectedEventId={EVENT_ID}
        selectedEventName="Feria 2026-2"
        {...props}
      />
    </QueryClientProvider>,
  );
};

const award = (id: number, title: string, position: number, value = 0) => ({
  id,
  categoryId: CATEGORY_ID,
  title,
  description: "",
  value,
  position,
});

/** The actions stay disabled while their data loads: click once they are enabled */
const clickWhenEnabled = async (button: HTMLElement) => {
  await waitFor(() => expect(button).toBeEnabled());
  await userEvent.click(button);
};

/**
 * The modal hides the rest of the page from the accessibility tree until it
 * closes, after its requests (200 ms each in the mocks) and the refetch.
 */
const waitForDialogToClose = () =>
  waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument(), {
    timeout: 4000,
  });

afterEach(() => {
  server.events.removeAllListeners();
});

const cardOf = async (title: string) =>
  screen.findByRole("article", { name: title });

test("asks for a category before showing the awards", () => {
  renderTab({ selectedCategoryId: undefined });
  expect(
    screen.getByText(/selecciona un evento y una categoría/i),
  ).toBeInTheDocument();
});

test("shows the empty state when the category has no awards", async () => {
  renderTab();
  expect(
    await screen.findByText("Esta categoría aún no tiene premios."),
  ).toBeInTheDocument();
});

test("lists the awards by position with their winners named from the ranking", async () => {
  seedAwardsMockState({
    awards: [
      award(2, "Mención de honor", 2),
      award(1, "Primer puesto", 1, 3000000),
    ],
    winners: [
      { id: 1, awardId: 1, projectId: 10, grade: 4.5 },
      { id: 2, awardId: 1, projectId: 11, grade: 4.5 },
    ],
  });
  renderTab();

  const cards = await screen.findAllByRole("article");

  expect(
    cards.map((card) => within(card).getByRole("heading").textContent),
  ).toEqual(["Primer puesto", "Mención de honor"]);

  const first = await cardOf("Primer puesto");

  expect(await within(first).findByText("Alfa")).toBeInTheDocument();
  expect(within(first).getByText("Beta")).toBeInTheDocument();
  expect(within(first).getByText("Coganadores")).toBeInTheDocument();
  expect(within(first).getByText("$3.000.000 COP")).toBeInTheDocument();

  const second = await cardOf("Mención de honor");

  expect(
    await within(second).findByText("Sin ganador asignado."),
  ).toBeInTheDocument();
  // Every project of the ranking can win: no top-N cut
  expect(rankingLimits).toContain("0");
});

test("creates an award, validating the form first", async () => {
  const bodies: unknown[] = [];

  server.events.on("request:start", async ({ request }) => {
    if (
      request.method === "POST" &&
      request.url.includes("/events/category-awards")
    ) {
      bodies.push(await request.clone().json());
    }
  });
  renderTab();

  await clickWhenEnabled(
    await screen.findByRole("button", { name: /nuevo premio/i }),
  );
  const dialog = await screen.findByRole("dialog");

  // The position after the existing awards is suggested
  expect(within(dialog).getByLabelText(/posición/i)).toHaveValue(1);

  await userEvent.click(
    within(dialog).getByRole("button", { name: "Crear premio" }),
  );
  expect(
    await within(dialog).findByText("El nombre del premio es obligatorio"),
  ).toBeInTheDocument();
  expect(bodies).toHaveLength(0);

  await userEvent.type(
    within(dialog).getByLabelText(/nombre del premio/i),
    "Primer puesto",
  );
  await userEvent.type(within(dialog).getByLabelText(/valor/i), "1.500.000");
  await userEvent.click(
    within(dialog).getByRole("button", { name: "Crear premio" }),
  );

  await waitForDialogToClose();
  expect(await cardOf("Primer puesto")).toBeInTheDocument();
  expect(bodies).toEqual([
    {
      categoryId: CATEGORY_ID,
      title: "Primer puesto",
      description: "",
      value: 1500000,
      position: 1,
    },
  ]);
});

test("edits an award sending its id in the body too", async () => {
  seedAwardsMockState({ awards: [award(7, "Primer puesto", 1)] });
  renderTab();

  const card = await cardOf("Primer puesto");

  await userEvent.click(
    await within(card).findByRole("button", { name: /editar primer puesto/i }),
  );
  const dialog = await screen.findByRole("dialog");
  const title = within(dialog).getByLabelText(/nombre del premio/i);

  await userEvent.clear(title);
  await userEvent.type(title, "Gran premio");
  await userEvent.click(
    within(dialog).getByRole("button", { name: "Guardar cambios" }),
  );

  await waitForDialogToClose();
  expect(await cardOf("Gran premio")).toBeInTheDocument();
});

test("assigns the winner together with its co-winners", async () => {
  seedAwardsMockState({ awards: [award(1, "Primer puesto", 1)] });
  renderTab();

  const card = await cardOf("Primer puesto");

  await clickWhenEnabled(
    await within(card).findByRole("button", {
      name: /asignar ganador a primer puesto/i,
    }),
  );
  const dialog = await screen.findByRole("dialog");

  await userEvent.click(within(dialog).getByRole("radio", { name: /alfa/i }));

  expect(within(dialog).getByText(/son\s+coganadores/i)).toHaveTextContent(
    "Beta",
  );
  expect(within(dialog).getByRole("checkbox")).toBeChecked();
  await userEvent.click(
    within(dialog).getByRole("button", { name: "Asignar" }),
  );

  await waitForDialogToClose();
  expect(await within(card).findByText("Alfa")).toBeInTheDocument();
  expect(within(card).getByText("Beta")).toBeInTheDocument();
  expect(within(card).getByText("Coganadores")).toBeInTheDocument();
});

test("assigns only the chosen project when the co-winners are left out", async () => {
  seedAwardsMockState({ awards: [award(1, "Primer puesto", 1)] });
  renderTab();

  const card = await cardOf("Primer puesto");

  await clickWhenEnabled(
    await within(card).findByRole("button", {
      name: /asignar ganador a primer puesto/i,
    }),
  );
  const dialog = await screen.findByRole("dialog");

  await userEvent.click(within(dialog).getByRole("radio", { name: /beta/i }));
  await userEvent.click(within(dialog).getByRole("checkbox"));
  await userEvent.click(
    within(dialog).getByRole("button", { name: "Asignar" }),
  );

  await waitForDialogToClose();
  expect(await within(card).findByText("Beta")).toBeInTheDocument();
  expect(within(card).queryByText("Alfa")).not.toBeInTheDocument();
  // The co-winner can still be added later, and the winner is no longer offered
  await clickWhenEnabled(
    within(card).getByRole("button", {
      name: /asignar ganador a primer puesto/i,
    }),
  );
  const next = await screen.findByRole("dialog");

  expect(
    within(next).queryByRole("radio", { name: /beta/i }),
  ).not.toBeInTheDocument();
  expect(
    within(next).getByRole("radio", { name: /alfa/i }),
  ).toBeInTheDocument();
});

test("a retry after a partial failure does not assign the saved co-winner twice", async () => {
  seedAwardsMockState({ awards: [award(1, "Primer puesto", 1)] });
  const postedProjects: number[] = [];
  let failBeta = true;

  server.use(
    http.post("*/events/award-winners", async ({ request }) => {
      const body = (await request.clone().json()) as { projectId: number };

      postedProjects.push(body.projectId);
      if (body.projectId === 11 && failBeta) {
        failBeta = false;

        return HttpResponse.json({ message: "Error" }, { status: 500 });
      }
      // Any other request goes on to the default handler, which saves it
    }),
  );
  renderTab();

  const card = await cardOf("Primer puesto");

  await clickWhenEnabled(
    await within(card).findByRole("button", {
      name: /asignar ganador a primer puesto/i,
    }),
  );
  const dialog = await screen.findByRole("dialog");

  // Alfa is saved, its co-winner Beta fails
  await userEvent.click(within(dialog).getByRole("radio", { name: /alfa/i }));
  await userEvent.click(
    within(dialog).getByRole("button", { name: "Asignar" }),
  );
  expect(await within(dialog).findByRole("alert")).toBeInTheDocument();

  // The modal reads the refreshed winners: Alfa is no longer offered
  await waitFor(() =>
    expect(
      within(dialog).queryByRole("radio", { name: /alfa/i }),
    ).not.toBeInTheDocument(),
  );
  await userEvent.click(within(dialog).getByRole("radio", { name: /beta/i }));
  await clickWhenEnabled(
    within(dialog).getByRole("button", { name: "Asignar" }),
  );

  await waitForDialogToClose();
  expect(await within(card).findByText("Beta")).toBeInTheDocument();
  expect(within(card).getAllByText("Alfa")).toHaveLength(1);
  expect(postedProjects).toEqual([10, 11, 11]);
});

test("removes a winner after confirming", async () => {
  seedAwardsMockState({
    awards: [award(1, "Primer puesto", 1)],
    winners: [{ id: 5, awardId: 1, projectId: 12, grade: 4.1 }],
  });
  renderTab();

  const card = await cardOf("Primer puesto");

  await userEvent.click(
    await within(card).findByRole("button", {
      name: /quitar a gamma de primer puesto/i,
    }),
  );
  const dialog = await screen.findByRole("dialog");

  await userEvent.click(within(dialog).getByRole("button", { name: "Quitar" }));
  await waitForDialogToClose();

  expect(
    await within(card).findByText("Sin ganador asignado."),
  ).toBeInTheDocument();
});

test("deletes an award that has winners, removing the winners first", async () => {
  seedAwardsMockState({
    awards: [award(1, "Primer puesto", 1), award(2, "Mención", 2)],
    winners: [{ id: 5, awardId: 1, projectId: 12, grade: 4.1 }],
  });
  renderTab();

  const card = await cardOf("Primer puesto");

  await within(card).findByText("Gamma");
  await clickWhenEnabled(
    await within(card).findByRole("button", {
      name: /eliminar primer puesto/i,
    }),
  );
  const dialog = await screen.findByRole("dialog");

  expect(
    within(dialog).getByText("También se quitará su ganador."),
  ).toBeInTheDocument();
  await userEvent.click(
    within(dialog).getByRole("button", { name: "Eliminar" }),
  );

  await waitForDialogToClose();
  expect(await cardOf("Mención")).toBeInTheDocument();
  await waitFor(() =>
    expect(
      screen.queryByRole("article", { name: "Primer puesto" }),
    ).not.toBeInTheDocument(),
  );
});

test("read-only roles see the awards and winners without the actions", async () => {
  mockSession(["read:events", "read:grades"]);
  seedAwardsMockState({
    awards: [award(1, "Primer puesto", 1)],
    winners: [{ id: 5, awardId: 1, projectId: 12, grade: 4.1 }],
  });
  renderTab();

  const card = await cardOf("Primer puesto");

  expect(await within(card).findByText("Gamma")).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /nuevo premio/i }),
  ).not.toBeInTheDocument();
  expect(within(card).queryByRole("button")).not.toBeInTheDocument();
});

test("shows an error when the awards cannot be loaded", async () => {
  server.use(
    http.get("*/api/events/category-awards", () =>
      HttpResponse.json(
        { message: "categoryId must be an integer number" },
        { status: 400 },
      ),
    ),
  );
  renderTab();
  expect(
    await screen.findByText(/no se pudieron cargar los premios/i),
  ).toBeInTheDocument();
});
