import type { ReactNode } from "react";
import type { Criterion } from "@/types/api";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";

import { CreateCriteriaContextual } from "../create-criteria-contextual";

import { server } from "@/testing/mocks/server";
import { rtlRender, screen, userEvent, waitFor } from "@/testing/test-utils";

// The permission check is covered by its own tests
vi.mock("@/components/auth/can", () => ({
  Can: ({ children }: { children: ReactNode }) => children,
}));

const eventId = 7;
const oral = { id: 2, name: "Comunicación oral", weight: 0.3, eventId };

const mockApi = () => {
  const requests: { method: string; body: any }[] = [];

  server.use(
    http.get("*/api/events", () =>
      HttpResponse.json({ data: [{ id: eventId, name: "Feria 2026" }] }),
    ),
    http.get("*/api/events/courses/all", () =>
      HttpResponse.json({
        courses: [
          { id: 5, code: "IST-101" },
          { id: 6, code: "IST-102" },
        ],
      }),
    ),
    http.post("*/api/criterions", async ({ request }) => {
      const body = await request.json();

      requests.push({ method: "POST", body });

      return HttpResponse.json({ data: { id: 30, ...(body as object) } });
    }),
    http.put("*/api/criterions/:id", async ({ request }) => {
      const body = await request.json();

      requests.push({ method: "PUT", body });

      return HttpResponse.json({ data: { id: 30, ...(body as object) } });
    }),
  );

  return requests;
};

const renderForm = (ui: ReactNode) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return rtlRender(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
};

test("a criterion is created inside its component with a relative weight", async () => {
  const requests = mockApi();

  renderForm(
    <CreateCriteriaContextual
      defaultEventId={String(eventId)}
      fixedComponent={oral}
    />,
  );

  await userEvent.click(
    screen.getByRole("button", { name: /agregar criterio/i }),
  );
  expect(screen.getByLabelText(/peso relativo/i)).toHaveValue("1");
  expect(screen.getByLabelText(/^componente/i)).toHaveValue(
    "Comunicación oral",
  );

  await userEvent.type(screen.getByLabelText(/nombre/i), "Claridad");
  const weight = screen.getByLabelText(/peso relativo/i);

  await userEvent.clear(weight);
  await userEvent.type(weight, "10");
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: /categorías/i }),
    ).toHaveTextContent("Todas"),
  );
  await userEvent.click(
    screen.getByRole("button", { name: /crear criterio/i }),
  );

  await waitFor(() => expect(requests).toHaveLength(1));
  expect(requests[0].body).toMatchObject({
    eventId,
    name: "Claridad",
    weight: 10,
    componentId: oral.id,
    categoryIds: [5, 6],
  });
});

test("a weight of 0 is not sent", async () => {
  const requests = mockApi();

  renderForm(
    <CreateCriteriaContextual
      defaultEventId={String(eventId)}
      fixedComponent={oral}
    />,
  );

  await userEvent.click(
    screen.getByRole("button", { name: /agregar criterio/i }),
  );
  await userEvent.type(screen.getByLabelText(/nombre/i), "Claridad");
  const weight = screen.getByLabelText(/peso relativo/i);

  await userEvent.clear(weight);
  await userEvent.type(weight, "0");

  expect(await screen.findByText(/mayor que 0/i)).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /crear criterio/i }),
  ).toBeDisabled();
  expect(requests).toHaveLength(0);
});

test("editing a criterion keeps its component", async () => {
  const requests = mockApi();
  const criterion = {
    id: 30,
    eventId,
    name: "Claridad",
    description: "",
    weight: 10,
    active: true,
    categoryIds: [5, 6],
    component: oral,
  } as unknown as Criterion;

  renderForm(
    <CreateCriteriaContextual
      criterionToEdit={criterion}
      defaultEventId={String(eventId)}
    />,
  );

  await userEvent.click(
    screen.getByRole("button", { name: /editar criterio/i }),
  );
  expect(screen.getByLabelText(/peso relativo/i)).toHaveValue("10");

  const weight = screen.getByLabelText(/peso relativo/i);

  await userEvent.clear(weight);
  await userEvent.type(weight, "9");
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: /categorías/i }),
    ).toHaveTextContent("Todas"),
  );
  await userEvent.click(
    screen.getByRole("button", { name: /guardar cambios/i }),
  );

  await waitFor(() => expect(requests).toHaveLength(1));
  expect(requests[0]).toMatchObject({ method: "PUT", body: { weight: 9 } });
  expect(requests[0].body).not.toHaveProperty("componentId");
});

test("a new criterion leaves out the categories that already have evaluations", async () => {
  const requests = mockApi();

  renderForm(
    <CreateCriteriaContextual
      defaultEventId={String(eventId)}
      fixedComponent={oral}
      lockedCategoryIds={[5]}
    />,
  );

  await userEvent.click(
    screen.getByRole("button", { name: /agregar criterio/i }),
  );
  await userEvent.type(screen.getByLabelText(/nombre/i), "Claridad");
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: /categorías/i }),
    ).toHaveTextContent("IST-102"),
  );
  expect(
    screen.getByText(/con evaluaciones no se pueden agregar ni quitar/i),
  ).toBeInTheDocument();
  await userEvent.click(
    screen.getByRole("button", { name: /crear criterio/i }),
  );

  await waitFor(() => expect(requests).toHaveLength(1));
  expect(requests[0].body.categoryIds).toEqual([6]);
});

test("a criterion of an evaluated category keeps its weight", async () => {
  mockApi();
  const criterion = {
    id: 30,
    eventId,
    name: "Claridad",
    description: "",
    weight: 10,
    active: true,
    categoryIds: [5],
    component: oral,
  } as unknown as Criterion;

  renderForm(
    <CreateCriteriaContextual
      criterionToEdit={criterion}
      defaultEventId={String(eventId)}
      lockedCategoryIds={[5]}
    />,
  );

  await userEvent.click(
    screen.getByRole("button", { name: /editar criterio/i }),
  );

  expect(screen.getByLabelText(/peso relativo/i)).toHaveAttribute("readonly");
  expect(
    screen.getByText(/ya tiene evaluaciones: el peso no se puede cambiar/i),
  ).toBeInTheDocument();
});
