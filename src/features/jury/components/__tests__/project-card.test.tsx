import { vi } from "vitest";

import * as tourUrlModule from "../../utils/tour-url";
import { ProjectCard } from "../project-card";

import { rtlRender, screen, userEvent } from "@/testing/test-utils";

const baseProject = {
  id: 7,
  eventId: 11,
  projectCode: "10",
  name: "Proyecto Solar",
  participants: [],
  documents: [],
};

describe("ProjectCard", () => {
  test("an evaluated project with department and projectCode shows Tour alongside Ver evaluación", async () => {
    await rtlRender(
      <ProjectCard
        departmentName="Ingeniería de Sistemas"
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
    expect(screen.getByRole("button", { name: "Tour" })).toBeEnabled();
  });

  test("redirects to Tour in the same tab with <departmentName>-<projectCode>", async () => {
    const navigateSpy = vi
      .spyOn(tourUrlModule, "navigateToTour")
      .mockImplementation(() => {});

    await rtlRender(
      <ProjectCard
        showProjectCode
        departmentName="Ingeniería de Sistemas"
        maxGrade={5}
        project={{ ...baseProject, evaluated: false }}
      />,
    );

    expect(screen.queryByText(/Tu nota/)).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Evaluar Proyecto" }),
    ).toBeEnabled();

    const tourBtn = screen.getByRole("button", { name: "Tour" });
    expect(tourBtn).toBeEnabled();

    await userEvent.click(tourBtn);

    expect(navigateSpy).toHaveBeenCalledTimes(1);
    const navigatedUrl = new URL(navigateSpy.mock.calls[0][0]);
    expect(`${navigatedUrl.origin}${navigatedUrl.pathname}`).toBe(
      tourUrlModule.TOUR_360_BASE_URL,
    );
    expect(navigatedUrl.searchParams.get("url-dinamica")).toBe(
      `${window.location.origin}/app/evaluations/7`,
    );
    expect(navigatedUrl.searchParams.get("equipo")).toBe(
      "Ingeniería de Sistemas-10",
    );

    navigateSpy.mockRestore();
  });

  test("hides Tour button and leaves Evaluar full width when departmentName or projectCode is missing", async () => {
    const { rerender } = await rtlRender(
      <ProjectCard
        showProjectCode
        maxGrade={5}
        project={{ ...baseProject, evaluated: false }}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Evaluar Proyecto" }),
    ).toBeEnabled();
    expect(screen.queryByRole("button", { name: "Tour" })).not.toBeInTheDocument();

    rerender(
      <ProjectCard
        showProjectCode
        departmentName="Ingeniería de Sistemas"
        maxGrade={5}
        project={{ ...baseProject, projectCode: "", evaluated: false }}
      />,
    );

    expect(screen.queryByRole("button", { name: "Tour" })).not.toBeInTheDocument();
  });
});
