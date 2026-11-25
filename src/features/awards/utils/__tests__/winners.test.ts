import type { TopProject } from "@/features/monitoring/api/get-top-projects";

import {
  buildWinnersToAssign,
  getCoWinnersOf,
  getEligibleProjects,
} from "../winners";

const project = (
  id: number,
  position: number,
  averageGrade: number,
): TopProject => ({
  id,
  name: `Proyecto ${id}`,
  position,
  averageGrade,
  evaluationCount: 3,
  participants: [],
});

// 10 and 11 share the first position: co-winners
const ranking = [project(10, 1, 4.5), project(11, 1, 4.5), project(12, 2, 4.1)];

test("projects that already won the award cannot win it again", () => {
  expect(
    getEligibleProjects(ranking, [{ projectId: 11 }]).map((item) => item.id),
  ).toEqual([10, 12]);
});

test("co-winners are the projects that share the position", () => {
  expect(getCoWinnersOf(ranking, 10).map((item) => item.id)).toEqual([11]);
  expect(getCoWinnersOf(ranking, 12)).toEqual([]);
  expect(getCoWinnersOf(ranking, 99)).toEqual([]);
});

test("assigns the chosen project and, when asked, its co-winners with their average", () => {
  expect(
    buildWinnersToAssign({
      ranking,
      projectId: 10,
      includeCoWinners: true,
      winners: [],
    }),
  ).toEqual([
    { projectId: 10, grade: 4.5 },
    { projectId: 11, grade: 4.5 },
  ]);
  expect(
    buildWinnersToAssign({
      ranking,
      projectId: 10,
      includeCoWinners: false,
      winners: [],
    }),
  ).toEqual([{ projectId: 10, grade: 4.5 }]);
});

test("does not assign again a co-winner that already won the award", () => {
  expect(
    buildWinnersToAssign({
      ranking,
      projectId: 10,
      includeCoWinners: true,
      winners: [{ projectId: 11 }],
    }),
  ).toEqual([{ projectId: 10, grade: 4.5 }]);
  expect(
    buildWinnersToAssign({
      ranking,
      projectId: 11,
      includeCoWinners: true,
      winners: [{ projectId: 11 }],
    }),
  ).toEqual([]);
});
