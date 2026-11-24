import type { EventCriteriaStats } from "@/features/evaluations/api/get-event-criteria-stats";

import { CriteriaPerformanceCard } from "../criteria-performance-card";

import { rtlRender, screen, within } from "@/testing/test-utils";

// Scale 25/55/75/90; one project graded 90/55/75/25 with weights 0.2667/0.1333/0.3/0.3
const stats: EventCriteriaStats = {
  maxScore: 90,
  components: [
    {
      id: 1,
      name: "Diseño",
      weight: 0.4,
      average: 78.33,
      projectCount: 1,
      criteria: [
        { id: 1, name: "Planos", weight: 0.2667, average: 90 },
        { id: 2, name: "Cálculo", weight: 0.1333, average: 55 },
      ],
    },
    {
      id: 2,
      name: "Oral",
      weight: 0.3,
      average: 25,
      projectCount: 2,
      criteria: [{ id: 4, name: "Exposición", weight: 0.3, average: 25 }],
    },
  ],
};

const componentRow = (name: string) =>
  screen
    .getAllByTestId("component-stats")
    .find((row) => within(row).queryByText(name) !== null)!;

describe("CriteriaPerformanceCard", () => {
  it("shows each component with its weight, average and the scale maximum", () => {
    rtlRender(<CriteriaPerformanceCard showCriteria={false} stats={stats} />);

    const design = componentRow("Diseño");

    expect(within(design).getByText("78.33")).toBeInTheDocument();
    expect(within(design).getByText("de 90")).toBeInTheDocument();
    expect(
      within(design).getByText(/Peso 40 % · 1 proyecto evaluado/),
    ).toBeInTheDocument();
    // 78.33 of 90 is 87 % of the scale
    expect(within(design).getByText("87%")).toBeInTheDocument();
    expect(
      within(componentRow("Oral")).getByText(/2 proyectos evaluados/),
    ).toBeInTheDocument();
    expect(screen.queryByText("Planos")).not.toBeInTheDocument();
  });

  it("lists the criteria of each component with their effective weight when a category is chosen", () => {
    rtlRender(<CriteriaPerformanceCard showCriteria stats={stats} />);

    const design = componentRow("Diseño");

    expect(within(design).getByText("Planos")).toBeInTheDocument();
    expect(within(design).getByText("(26.67 %)")).toBeInTheDocument();
    expect(within(design).getByText("Cálculo")).toBeInTheDocument();
    expect(within(design).getByText("(13.33 %)")).toBeInTheDocument();
  });

  it("shows the average without bar nor maximum when the event has no scale", () => {
    rtlRender(
      <CriteriaPerformanceCard
        showCriteria={false}
        stats={{ components: stats.components }}
      />,
    );

    const design = componentRow("Diseño");

    expect(within(design).getByText("78.33")).toBeInTheDocument();
    expect(within(design).queryByText(/^de /)).not.toBeInTheDocument();
    expect(within(design).queryByText(/%$/)).not.toBeInTheDocument();
  });

  it("labels the criteria without component, which come with an empty name", () => {
    rtlRender(
      <CriteriaPerformanceCard
        showCriteria
        stats={{
          maxScore: 90,
          components: [
            {
              name: "",
              weight: 0.3,
              average: 75,
              projectCount: 1,
              criteria: [{ id: 3, name: "Bitácora", weight: 0.3, average: 75 }],
            },
          ],
        }}
      />,
    );

    const row = componentRow("Sin componente");

    expect(within(row).getByText("Bitácora")).toBeInTheDocument();
    expect(within(row).getByText(/Peso 30 %/)).toBeInTheDocument();
  });

  it("says there is nothing to show without evaluated components", () => {
    rtlRender(
      <CriteriaPerformanceCard
        showCriteria={false}
        stats={{ maxScore: 5, components: [] }}
      />,
    );

    expect(
      screen.getByText(
        "Todavía no hay criterios con evaluaciones para mostrar.",
      ),
    ).toBeInTheDocument();
  });
});
