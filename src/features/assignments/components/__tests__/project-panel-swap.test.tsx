import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { vi } from "vitest";

import { Notifications } from "@/components/ui/notifications";
import { server } from "@/testing/mocks/server";
import { rtlRender, screen, userEvent, waitFor } from "@/testing/test-utils";

import { ProjectPanel } from "../project-panel";

const EVENT_JURORS = [
  {
    id: "10",
    firstName: "Ana",
    lastName: "Gómez",
    email: "ana@uninorte.edu.co",
    assignedProjects: [{ id: 100, evaluated: false }],
  },
  {
    id: "11",
    firstName: "Luis",
    lastName: "Evaluador",
    email: "luis@uninorte.edu.co",
    assignedProjects: [{ id: 100, evaluated: true }],
  },
  {
    id: "20",
    firstName: "Beatriz",
    lastName: "Disponible",
    email: "beatriz@uninorte.edu.co",
    assignedProjects: [{ id: 201, evaluated: false }],
  },
  {
    id: "21",
    firstName: "Carlos",
    lastName: "Libre",
    email: "carlos@uninorte.edu.co",
    assignedProjects: [],
  },
];

const PROJECT = {
  id: 100,
  eventId: 7,
  name: "Sistema Solar Inteligente",
  description: "Monitoreo fotovoltaico en tiempo real",
  jurors: [
    { id: "10", firstName: "Ana", lastName: "Gómez", email: "ana@uninorte.edu.co" },
    { id: "11", firstName: "Luis", lastName: "Evaluador", email: "luis@uninorte.edu.co" },
  ],
};

beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  server.use(
    http.get("*/api/events/:eventId/jurors", () =>
      HttpResponse.json({
        jurors: EVENT_JURORS,
        data: EVENT_JURORS,
      }),
    ),
  );
});

const renderPanel = (project = PROJECT, onClose = vi.fn()) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return {
    onClose,
    ...rtlRender(
      <QueryClientProvider client={queryClient}>
        <Notifications />
        <ProjectPanel project={project} onClose={onClose} />
      </QueryClientProvider>,
    ),
  };
};

test("renders swap button next to delete and disables both for jurors who already evaluated", async () => {
  renderPanel();

  await screen.findByText("Ya evaluó");

  const anaSwap = screen.getByRole("button", {
    name: /intercambiar jurado ana gómez/i,
  });
  const anaDelete = screen.getByRole("button", {
    name: /eliminar jurado ana gómez/i,
  });
  const luisSwap = screen.getByRole("button", {
    name: /intercambiar jurado luis evaluador/i,
  });
  const luisDelete = screen.getByRole("button", {
    name: /eliminar jurado luis evaluador/i,
  });

  expect(anaSwap).toBeEnabled();
  expect(anaDelete).toBeEnabled();
  expect(luisSwap).toBeDisabled();
  expect(luisDelete).toBeDisabled();
});

test("swaps an assigned juror with an available juror via PATCH /projects/reassign-juror", async () => {
  const payloads: unknown[] = [];

  server.use(
    http.patch("*/api/projects/reassign-juror", async ({ request }) => {
      payloads.push(await request.json());
      return HttpResponse.json({ ok: true, changed: true });
    }),
  );

  renderPanel();

  await screen.findByText("Ya evaluó");

  await userEvent.click(
    screen.getByRole("button", { name: /intercambiar jurado ana gómez/i }),
  );

  expect(screen.getByText("Intercambiar jurado")).toBeInTheDocument();
  // Already-assigned jurors are excluded from the available list
  expect(
    screen.queryByRole("radio", { name: /luis evaluador/i }),
  ).not.toBeInTheDocument();

  // Search filters available jurors
  await userEvent.type(
    screen.getByRole("textbox", { name: /buscar jurado disponible/i }),
    "beatriz",
  );
  expect(
    screen.queryByRole("radio", { name: /carlos libre/i }),
  ).not.toBeInTheDocument();

  const beatrizOption = screen.getByRole("radio", {
    name: /beatriz disponible/i,
  });
  const confirmButton = screen.getByRole("button", { name: /^intercambiar$/i });
  expect(confirmButton).toBeDisabled();

  await userEvent.click(beatrizOption);
  expect(beatrizOption).toHaveAttribute("aria-checked", "true");
  expect(confirmButton).toBeEnabled();

  await userEvent.click(confirmButton);

  await waitFor(() =>
    expect(payloads).toEqual([
      { projectId: 100, fromUserId: 10, toUserId: 20 },
    ]),
  );

  // Panel returns to project details and immediately displays the replacement juror
  expect(await screen.findByText("Beatriz Disponible")).toBeInTheDocument();
  expect(screen.queryByText("Ana Gómez")).not.toBeInTheDocument();
  expect(screen.getByText("Jurado intercambiado")).toBeInTheDocument();
});

test("returns cleanly to project details when canceling the swap flow", async () => {
  renderPanel();
  await screen.findByText("Ya evaluó");

  await userEvent.click(
    screen.getByRole("button", { name: /intercambiar jurado ana gómez/i }),
  );
  expect(screen.getByText("Intercambiar jurado")).toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: /cancelar/i }));

  expect(screen.queryByText("Intercambiar jurado")).not.toBeInTheDocument();
  expect(screen.getByText("Ana Gómez")).toBeInTheDocument();
});

test("shows an empty state when no other event jurors are available", async () => {
  server.use(
    http.get("*/api/events/:eventId/jurors", () =>
      HttpResponse.json({
        jurors: EVENT_JURORS.slice(0, 2),
        data: EVENT_JURORS.slice(0, 2),
      }),
    ),
  );

  renderPanel();
  await screen.findByText("Ya evaluó");

  await userEvent.click(
    screen.getByRole("button", { name: /intercambiar jurado ana gómez/i }),
  );

  expect(
    await screen.findByText(
      /no hay otros jurados disponibles en este evento para intercambiar/i,
    ),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /^intercambiar$/i }),
  ).toBeDisabled();
});

test("keeps swap view open and shows error notification if reassignment fails", async () => {
  server.use(
    http.patch("*/api/projects/reassign-juror", () =>
      HttpResponse.json(
        { message: "No se pudo reasignar el jurado" },
        { status: 500 },
      ),
    ),
  );

  renderPanel();
  await screen.findByText("Ya evaluó");

  await userEvent.click(
    screen.getByRole("button", { name: /intercambiar jurado ana gómez/i }),
  );
  await userEvent.click(
    screen.getByRole("radio", { name: /carlos libre/i }),
  );
  await userEvent.click(
    screen.getByRole("button", { name: /^intercambiar$/i }),
  );

  expect(
    await screen.findByText("Error al intercambiar jurado"),
  ).toBeInTheDocument();
  // Swap view stays open so admin can retry or pick another juror
  expect(screen.getByText("Intercambiar jurado")).toBeInTheDocument();
});

test("preserves delete juror flow without regression", async () => {
  const deletedUrls: string[] = [];
  server.use(
    http.delete("*/api/projects/:projectId/jurors/:memberUserId", ({ request }) => {
      deletedUrls.push(request.url);
      return HttpResponse.json({ success: true });
    }),
  );

  const { onClose } = renderPanel();
  await screen.findByText("Ya evaluó");

  await userEvent.click(
    screen.getByRole("button", { name: /eliminar jurado ana gómez/i }),
  );

  await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  expect(deletedUrls[0]).toContain("/projects/100/jurors/10");
});

