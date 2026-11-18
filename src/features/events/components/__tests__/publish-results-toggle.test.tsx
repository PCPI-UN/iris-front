import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { vi } from "vitest";

import { useNotifications } from "@/components/ui/notifications";
import { normalizeEvent } from "@/features/events/api/event-adapter";
import { server } from "@/testing/mocks/server";
import { rtlRender, screen, userEvent, waitFor } from "@/testing/test-utils";

import { PublishResultsToggle } from "../publish-results-toggle";

const mockPatch = (status = 200) => {
  const bodies: unknown[] = [];
  server.use(
    http.patch("*/api/events/:eventId", async ({ request, params }) => {
      bodies.push({ eventId: params.eventId, body: await request.json() });
      return status === 200
        ? HttpResponse.json({ event: { id: Number(params.eventId) } })
        : HttpResponse.json({ message: "error" }, { status });
    }),
  );
  return bodies;
};

beforeEach(() => {
  // The global mock in setup-tests cannot be used with `new`
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

const renderToggle = (resultsPublished: boolean) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return rtlRender(
    <QueryClientProvider client={queryClient}>
      <PublishResultsToggle eventId={5} resultsPublished={resultsPublished} />
    </QueryClientProvider>,
  );
};

const lastNotification = () => {
  const notifications = useNotifications.getState().notifications;
  return notifications[notifications.length - 1];
};

test("shows whether the results are published", () => {
  const { unmount } = renderToggle(false);
  expect(screen.getByText("No publicados")).toBeInTheDocument();
  expect(
    screen.getByRole("switch", { name: /publicar resultados/i }),
  ).not.toBeChecked();
  unmount();

  renderToggle(true);
  expect(screen.getByText("Publicados")).toBeInTheDocument();
  expect(
    screen.getByRole("switch", { name: /publicar resultados/i }),
  ).toBeChecked();
});

test("asks for confirmation before publishing and sends only resultsPublished", async () => {
  const bodies = mockPatch();
  renderToggle(false);

  await userEvent.click(
    screen.getByRole("switch", { name: /publicar resultados/i }),
  );
  expect(
    await screen.findByText("¿Publicar los resultados?"),
  ).toBeInTheDocument();
  expect(bodies).toHaveLength(0);

  await userEvent.click(
    screen.getByRole("button", { name: "Publicar resultados" }),
  );

  await waitFor(() =>
    expect(bodies).toEqual([
      { eventId: "5", body: { resultsPublished: true } },
    ]),
  );
  await waitFor(() =>
    expect(lastNotification()).toMatchObject({
      type: "success",
      title: "Resultados publicados",
    }),
  );
});

test("cancelling the confirmation does not publish", async () => {
  const bodies = mockPatch();
  renderToggle(false);

  await userEvent.click(
    screen.getByRole("switch", { name: /publicar resultados/i }),
  );
  await userEvent.click(
    await screen.findByRole("button", { name: "Cancelar" }),
  );

  await waitFor(() =>
    expect(
      screen.queryByText("¿Publicar los resultados?"),
    ).not.toBeInTheDocument(),
  );
  expect(bodies).toHaveLength(0);
});

test("hides the results without confirmation", async () => {
  const bodies = mockPatch();
  renderToggle(true);

  await userEvent.click(
    screen.getByRole("switch", { name: /publicar resultados/i }),
  );

  await waitFor(() =>
    expect(bodies).toEqual([
      { eventId: "5", body: { resultsPublished: false } },
    ]),
  );
  expect(
    screen.queryByText("¿Publicar los resultados?"),
  ).not.toBeInTheDocument();
  await waitFor(() =>
    expect(lastNotification()).toMatchObject({ title: "Resultados ocultos" }),
  );
});

test("shows a clear error when the user lacks permission", async () => {
  mockPatch(403);
  renderToggle(true);

  await userEvent.click(
    screen.getByRole("switch", { name: /publicar resultados/i }),
  );

  await waitFor(() =>
    expect(lastNotification()).toMatchObject({
      type: "error",
      message: "No tienes permiso para cambiar la publicación de resultados.",
    }),
  );
});

describe("normalizeEvent", () => {
  test("reads resultsPublished and defaults to false", () => {
    expect(
      normalizeEvent({ id: 1, resultsPublished: true }).resultsPublished,
    ).toBe(true);
    expect(normalizeEvent({ id: 1 }).resultsPublished).toBe(false);
  });
});
