import { ProjectCard } from "../project-card";

import { rtlRender, screen } from "@/testing/test-utils";

const baseProject = {
  id: 7,
  name: "Proyecto Solar",
  participants: [],
  documents: [],
};

describe("ProjectCard", () => {
  test("an evaluated project shows the juror's grade and opens the evaluation", async () => {
    await rtlRender(
      <ProjectCard
        maxGrade={5}
        project={{
          ...baseProject,
          evaluated: true,
          evaluation: { id: 1, grade: 4.25, scores: [] },
        }}
      />,
    );

    expect(screen.getByText("4.25 / 5")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Ver evaluación" }),
    ).toBeEnabled();
  });

  test("a project still to evaluate shows no grade", async () => {
    await rtlRender(
      <ProjectCard
        showProjectCode
        maxGrade={5}
        project={{ ...baseProject, evaluated: false }}
      />,
    );

    expect(screen.queryByText(/Tu nota/)).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Evaluar Proyecto" }),
    ).toBeEnabled();
  });
});
