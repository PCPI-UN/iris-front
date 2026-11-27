import { vi } from "vitest";

import * as tourUrlModule from "../../utils/tour-url";
import { ProjectCard } from "../project-card";

import { rtlRender, screen, userEvent } from "@/testing/test-utils";

const baseProject = {
  id: 7,
  eventId: 11,
  name: "Proyecto Solar",
  participants: [],
  documents: [],
};

describe("ProjectCard", () => {
  test("an evaluated project shows the juror's grade, opens the evaluation, and renders Tour", async () => {
    await rtlRender(
      <ProjectCard
        eventId={11}
        maxGrade={5}
        project={{
          ...baseProject,
          evaluated: true,
          evaluation: { id: 1, grade: 4.25, scores: [] },
        }}
        termCode="202630"
      />,
    );

    expect(screen.getByText("4.25 / 5")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Ver evaluación" }),
    ).toBeEnabled();
    expect(screen.getByRole("button", { name: "Tour" })).toBeEnabled();
  });

  test("a project still to evaluate shows no grade and redirects to Tour in the same tab", async () => {
    const navigateSpy = vi
      .spyOn(tourUrlModule, "navigateToTour")
      .mockImplementation(() => {});

    await rtlRender(
      <ProjectCard
        eventId={11}
        maxGrade={5}
        project={{ ...baseProject, evaluated: false }}
        showProjectCode
        termCode="202630"
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
    expect(navigatedUrl.searchParams.get("equipo")).toBe("202630-E11-P7");

    navigateSpy.mockRestore();
  });
});
