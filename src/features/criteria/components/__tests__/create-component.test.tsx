import type { ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";

import { CreateComponent } from "../create-component";

import { server } from "@/testing/mocks/server";
import { rtlRender, screen, userEvent, waitFor } from "@/testing/test-utils";

// The permission check is covered by its own tests
vi.mock("@/components/auth/can", () => ({
  Can: ({ children }: { children: ReactNode }) => children,
}));

const eventId = 7;
const otherComponents = [
  { id: 1, name: "Innovación", weight: 0.4, eventId },
  { id: 2, name: "Comunicación oral", weight: 0.3, eventId },
];

const mockApi = ({ updateStatus = 200 } = {}) => {
  const requests: { method: string; body: any }[] = [];

  server.use(
    http.get("*/api/events", () =>
      HttpResponse.json({ data: [{ id: eventId, name: "Feria 2026" }] }),
    ),
    http.get("*/api/criterions/components", () =>
      HttpResponse.json({ components: otherComponents }),
    ),
    http.post("*/api/criterions/components", async ({ request }) => {
      const body = await request.json();

      requests.push({ method: "POST", body });

      return HttpResponse.json({ id: 3, ...(body as object) });
    }),
    http.put("*/api/criterions/components/:id", async ({ request }) => {
      const body = await request.json();

      requests.push({ method: "PUT", body });

      return updateStatus === 200
        ? HttpResponse.json({ id: 2, ...(body as object) })
        : HttpResponse.json(
            {
              message:
                "La rúbrica del evento ya tiene evaluaciones; no se pueden cambiar los pesos",
            },
            { status: updateStatus },
          );
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

test("a new component sends its weight as a fraction and shows what the event adds up to", async () => {
  const requests = mockApi();

  renderForm(<CreateComponent eventId={eventId} />);

  await userEvent.click(
    screen.getByRole("button", { name: /agregar componente/i }),
  );
  await userEvent.type(screen.getByLabelText(/nombre/i), "Prototipo");
  await userEvent.type(screen.getByLabelText(/peso en la nota/i), "30");

  expect(
    await screen.findByText(/otros componentes del evento: 70 %/i),
  ).toHaveTextContent(/el evento suma 100 %/i);

  await userEvent.click(
    screen.getByRole("button", { name: /crear componente/i }),
  );

  await waitFor(() => expect(requests).toHaveLength(1));
  expect(requests[0]).toEqual({
    method: "POST",
    body: { name: "Prototipo", eventId, weight: 0.3 },
  });
});

test("a weight over what the event has left is not sent", async () => {
  const requests = mockApi();

  renderForm(<CreateComponent eventId={eventId} />);

  await userEvent.click(
    screen.getByRole("button", { name: /agregar componente/i }),
  );
  await userEvent.type(screen.getByLabelText(/nombre/i), "Prototipo");
  await userEvent.type(screen.getByLabelText(/peso en la nota/i), "40");

  expect(
    await screen.findByText(/otros componentes del evento: 70 %/i),
  ).toHaveTextContent(/sumaría 110 %/i);
  expect(
    screen.getByRole("button", { name: /crear componente/i }),
  ).toBeDisabled();
  expect(requests).toHaveLength(0);
});

test("a weight of 0 % is not sent", async () => {
  const requests = mockApi();

  renderForm(<CreateComponent eventId={eventId} />);

  await userEvent.click(
    screen.getByRole("button", { name: /agregar componente/i }),
  );
  await userEvent.type(screen.getByLabelText(/nombre/i), "Prototipo");
  await userEvent.type(screen.getByLabelText(/peso en la nota/i), "0");
  await userEvent.click(
    screen.getByRole("button", { name: /crear componente/i }),
  );

  expect(
    await screen.findByText(/mayor que 0 % y como máximo 100 %/i),
  ).toBeInTheDocument();
  expect(requests).toHaveLength(0);
});

test("renaming a component without touching its weight does not send the weight", async () => {
  const requests = mockApi();

  renderForm(
    <CreateComponent componentToEdit={otherComponents[1]} eventId={eventId} />,
  );

  await userEvent.click(
    screen.getByRole("button", { name: /editar componente/i }),
  );
  expect(screen.getByLabelText(/peso en la nota/i)).toHaveValue(30);

  const name = screen.getByLabelText(/nombre/i);

  await userEvent.clear(name);
  await userEvent.type(name, "Presentación oral");
  await userEvent.click(
    screen.getByRole("button", { name: /guardar cambios/i }),
  );

  await waitFor(() => expect(requests).toHaveLength(1));
  expect(requests[0]).toEqual({
    method: "PUT",
    body: { name: "Presentación oral", eventId },
  });
});

test("once the event has evaluations the weight is read-only and only the name is sent", async () => {
  const requests = mockApi();

  renderForm(
    <CreateComponent
      componentToEdit={otherComponents[1]}
      eventId={eventId}
      isWeightLocked
    />,
  );

  await userEvent.click(
    screen.getByRole("button", { name: /editar componente/i }),
  );
  const weight = screen.getByLabelText(/peso en la nota/i);

  expect(weight).toHaveAttribute("readonly");
  expect(
    screen.getByText(/ya tiene evaluaciones: el peso no se puede cambiar/i),
  ).toBeInTheDocument();

  const name = screen.getByLabelText(/nombre/i);

  await userEvent.clear(name);
  await userEvent.type(name, "Presentación oral");
  await userEvent.click(
    screen.getByRole("button", { name: /guardar cambios/i }),
  );

  await waitFor(() => expect(requests).toHaveLength(1));
  expect(requests[0].body).not.toHaveProperty("weight");
});

test("the backend refusal is shown inside the form", async () => {
  mockApi({ updateStatus: 400 });
  renderForm(
    <CreateComponent componentToEdit={otherComponents[1]} eventId={eventId} />,
  );

  await userEvent.click(
    screen.getByRole("button", { name: /editar componente/i }),
  );
  const weight = screen.getByLabelText(/peso en la nota/i);

  await userEvent.clear(weight);
  await userEvent.type(weight, "20");
  await userEvent.click(
    screen.getByRole("button", { name: /guardar cambios/i }),
  );

  expect(await screen.findByRole("alert")).toHaveTextContent(
    /ya tiene evaluaciones/i,
  );
});
