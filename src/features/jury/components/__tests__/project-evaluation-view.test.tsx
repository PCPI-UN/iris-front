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
  assigned = [{ id: 7, evaluated: false }],
}: {
  eventResponse: () => Response;
  sections?: {
    category: string;
    weight: number;
    criterions: { id: number; name: string; weight?: number }[];
  }[];
  assigned?: Record<string, unknown>[];
}) => {
  server.use(
    // Before "/projects/:projectId", which would also match it
    http.get("*/api/projects/assigned-projects", () =>
      HttpResponse.json({ items: assigned, page: 1, pageSize: 50, total: assigned.length }),
    ),
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
    http.get("*/api/me/events", ({ request }) =>
      HttpResponse.json({
        events:
          new URL(request.url).searchParams.get("status") === "current"
            ? [{ id: 5, name: "Feria", eventType: "Exposition", roles: ["JURY"] }]
            : [],
        meta: { total: 1, currentPage: 1, totalPages: 1, itemsPerPage: 50 },
      }),
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

test("a submitted evaluation is shown read-only, with its levels, comments and grade", async () => {
  mockEvaluationData({
    eventResponse: () => HttpResponse.json({ event: { id: 5, gradingScale: customScale } }),
    assigned: [
      {
        id: 7,
        evaluated: true,
        evaluation: {
          id: 3,
          grade: 30,
          comments: "Buen prototipo",
          scores: [{ criterionId: 11, score: 3 }],
        },
      },
    ],
  });
  renderView();

  const chosen = await screen.findByRole("radio", { name: "Destaca (30 puntos)" });
  expect(chosen).toHaveAttribute("aria-checked", "true");
  expect(chosen).toBeDisabled();
  expect(screen.getByText("Evaluación enviada")).toBeInTheDocument();
  expect(await screen.findByText("30 / 40")).toBeInTheDocument();
  expect(screen.getByText("Buen prototipo")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /enviar evaluación/i })).not.toBeInTheDocument();
});

test("a project not assigned to the juror shows no form", async () => {
  mockEvaluationData({
    eventResponse: () => HttpResponse.json({ event: { id: 5, gradingScale: customScale } }),
    assigned: [{ id: 8, evaluated: false }],
  });
  renderView();

  expect(
    await screen.findByText("Este proyecto no está asignado a tu evaluación"),
  ).toBeInTheDocument();
  expect(screen.queryByRole("radio")).not.toBeInTheDocument();
});

test("a rejected evaluation explains why inside the card, without a toast", async () => {
  mockEvaluationData({
    eventResponse: () => HttpResponse.json({ event: { id: 5, gradingScale: customScale } }),
  });
  server.use(
    http.post("*/api/evaluations/projects/evaluate", () =>
      HttpResponse.json({ message: "El periodo de evaluación terminó" }, { status: 400 }),
    ),
  );
  renderView();
  const user = userEvent.setup();

  await user.click(await screen.findByRole("radio", { name: "Destaca (30 puntos)" }));
  await user.click(screen.getByRole("button", { name: /enviar evaluación/i }));
  await user.click(await screen.findByRole("button", { name: /confirmar y enviar/i }));

  expect(await screen.findByRole("alert")).toHaveTextContent("El periodo de evaluación terminó");
  expect(useNotifications.getState().notifications).toHaveLength(0);
});

test("the juror sees the weight of each section and criterion and the grade of the levels chosen", async () => {
  mockEvaluationData({
    eventResponse: () =>
      HttpResponse.json({ event: { id: 5, gradingScale: customScale } }),
    sections: [
      {
        category: "Diseño",
        weight: 0.3,
        criterions: [
          { id: 11, name: "Claridad", weight: 0.1071 },
          { id: 12, name: "Orden", weight: 0.1929 },
        ],
      },
    ],
  });
  renderView();
  const user = userEvent.setup();

  expect(await screen.findByText("(30%)")).toBeInTheDocument();
  expect(screen.getByText("(10.7%)")).toBeInTheDocument();
  expect(screen.getByText("(19.3%)")).toBeInTheDocument();

  const [claridadLevel] = await screen.findAllByRole("radio", {
    name: "Sobresale (40 puntos)",
  });

  await user.click(claridadLevel);
  // 40 × 0.1071
  expect(screen.getByText("Nota parcial")).toBeInTheDocument();
  expect(screen.getByText("4.28 / 40")).toBeInTheDocument();
});

test("without the weight of every criterion the grade of the levels chosen is not shown", async () => {
  mockEvaluationData({
    eventResponse: () =>
      HttpResponse.json({ event: { id: 5, gradingScale: customScale } }),
  });
  renderView();

  expect(await screen.findByText("Claridad")).toBeInTheDocument();
  // Only the section shows its weight
  expect(
    screen.getAllByText(/%\)$/).map((element) => element.textContent),
  ).toEqual(["(100%)"]);
  expect(screen.queryByText("Nota parcial")).not.toBeInTheDocument();
});

test("a submitted evaluation shows the weight it was graded with", async () => {
  mockEvaluationData({
    eventResponse: () =>
      HttpResponse.json({ event: { id: 5, gradingScale: customScale } }),
    sections: [
      {
        category: "Diseño",
        weight: 1,
        criterions: [{ id: 11, name: "Claridad", weight: 1 }],
      },
    ],
    assigned: [
      {
        id: 7,
        evaluated: true,
        evaluation: {
          id: 3,
          grade: 15,
          scores: [{ criterionId: 11, score: 3, weight: 0.5 }],
        },
      },
    ],
  });
  renderView();

  expect(await screen.findByText("(50%)")).toBeInTheDocument();
});
