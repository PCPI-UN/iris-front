import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";

import { useNotifications } from "@/components/ui/notifications";
import { server } from "@/testing/mocks/server";
import { rtlRender, screen, userEvent } from "@/testing/test-utils";

import { ProjectEvaluationView } from "../project-evaluation-view";

const customScale = {
  id: 9,
  name: "Decenas",
  isSystem: false,
  locked: false,
  levels: [
    { level: 1, label: "Por mejorar", points: 10 },
    { level: 2, label: "Cumple", points: 20 },
    { level: 3, label: "Destaca", points: 30 },
    { level: 4, label: "Sobresale", points: 40 },
  ],
};

const oneSection = [
  { category: "Diseño", weight: 1, criterions: [{ id: 11, name: "Claridad" }] },
];

const mockEvaluationData = ({
  eventResponse,
  sections = oneSection,
}: {
  eventResponse: () => Response;
  sections?: typeof oneSection;
}) => {
  server.use(
    http.get("*/api/projects/:projectId", () =>
      HttpResponse.json({
        id: 7,
        name: "Proyecto Solar",
        description: "Paneles",
        eventId: 5,
        categoryId: 3,
        participants: [],
        documents: [],
      }),
    ),
    http.get("*/api/criterions/course/:categoryId", () =>
      HttpResponse.json({ categories: sections }),
    ),
    http.get("*/api/events/my-events", () =>
      HttpResponse.json({ data: [{ id: 5, name: "Feria", eventType: "Exposition" }] }),
    ),
    http.get("*/api/events/5", eventResponse),
  );
};

const renderView = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return rtlRender(
    <QueryClientProvider client={queryClient}>
      <ProjectEvaluationView projectId="7" />
    </QueryClientProvider>,
  );
};

beforeEach(() => {
  useNotifications.setState({ notifications: [] });
});

test("the juror sees the labels and points of the event scale", async () => {
  mockEvaluationData({
    eventResponse: () => HttpResponse.json({ event: { id: 5, gradingScale: customScale } }),
  });
  renderView();

  expect(await screen.findByText("Sobresale")).toBeInTheDocument();
  for (const text of ["Por mejorar", "Cumple", "Destaca", "10 pts", "20 pts", "30 pts", "40 pts"]) {
    expect(screen.getByText(text)).toBeInTheDocument();
  }
  expect(screen.queryByText("Excelente")).not.toBeInTheDocument();

  const user = userEvent.setup();
  const level = screen.getByRole("radio", { name: "Destaca (30 puntos)" });
  await user.click(level);
  expect(level).toHaveAttribute("aria-checked", "true");
});

test("without access to the event scale the juror sees the default labels, without an error", async () => {
  mockEvaluationData({
    eventResponse: () => HttpResponse.json({ message: "Prohibido" }, { status: 403 }),
  });
  renderView();

  expect(await screen.findByText("Claridad")).toBeInTheDocument();
  for (const text of ["Insuficiente", "Aceptable", "Bueno", "Excelente"]) {
    expect(await screen.findByText(text)).toBeInTheDocument();
  }
  expect(screen.queryByText(/pts$/)).not.toBeInTheDocument();
  expect(useNotifications.getState().notifications).toHaveLength(0);
});

test("the evaluation is not sent until every criterion has a level", async () => {
  mockEvaluationData({
    eventResponse: () =>
      HttpResponse.json({ event: { id: 5, gradingScale: customScale } }),
    sections: [
      {
        category: "Diseño",
        weight: 0.5,
        criterions: [{ id: 11, name: "Claridad" }],
      },
      {
        category: "Prototipo",
        weight: 0.5,
        criterions: [{ id: 12, name: "Funcionamiento" }],
      },
    ],
  });
  renderView();
  const user = userEvent.setup();

  await user.click(
    await screen.findByRole("radio", { name: "Destaca (30 puntos)" }),
  );
  await user.click(screen.getByRole("button", { name: /siguiente/i }));

  expect(screen.getByRole("button", { name: /enviar evaluación/i })).toBeDisabled();
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Falta calificar 1 criterio(s): Funcionamiento.",
  );

  await user.click(screen.getByRole("radio", { name: "Cumple (20 puntos)" }));
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: /enviar evaluación/i }));
  expect(await screen.findByText(/confirmar envío/i)).toBeInTheDocument();
});
