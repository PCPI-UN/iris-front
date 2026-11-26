import type { ProjectWithJurors } from "@/features/projects/api/get-projects-with-jurors";

import {
  buildCategoryEvaluationStats,
  getStatisticsProjects,
} from "../calculations";

// with-jurors sends the category as courseId, without categoryId
const project = (id: number, courseId?: number) =>
  ({
    id,
    courseId,
    state: "UNDER_REVIEW",
    jurors: [],
  }) as unknown as ProjectWithJurors;

const projects = [project(1, 7), project(2, 7), project(3, 8), project(4)];

describe("getStatisticsProjects", () => {
  test("counts every project with category when no category is chosen", () => {
    expect(
      getStatisticsProjects(projects).map(({ id, categoryId }) => [
        id,
        categoryId,
      ]),
    ).toEqual([
      [1, 7],
      [2, 7],
      [3, 8],
    ]);
  });

  test("keeps only the chosen category", () => {
    expect(getStatisticsProjects(projects, 8).map(({ id }) => id)).toEqual([3]);
  });
});

describe("buildCategoryEvaluationStats", () => {
  test("groups the projects by the category resolved from courseId", () => {
    const stats = buildCategoryEvaluationStats(
      getStatisticsProjects(projects),
      [
        { id: 7, code: "ING-1" },
        { id: 8, code: "ING-2" },
      ],
      new Map(),
    );

    expect(
      stats.map(({ categoryId, totalProjects }) => [categoryId, totalProjects]),
    ).toEqual([
      [7, 2],
      [8, 1],
    ]);
    expect(stats.some(({ label }) => label.includes("undefined"))).toBe(false);
  });
});
