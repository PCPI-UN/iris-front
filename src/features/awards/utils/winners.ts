import type { TopProject } from "@/features/monitoring/api/get-top-projects";
import type { AwardWinner } from "../types";

/**
 * Projects of the category ranking that can still win the award: the ones
 * that are not already winners of it. The ranking only has approved projects
 * with evaluations, so the grade sent to the backend is always the ranking average.
 */
export const getEligibleProjects = (
  ranking: TopProject[],
  winners: Pick<AwardWinner, "projectId">[],
) => {
  const winnerIds = new Set(winners.map((winner) => winner.projectId));

  return ranking.filter((project) => !winnerIds.has(project.id));
};

/**
 * Other projects that share the position of the given one in the ranking
 * (same average rounded to 2 decimals): they are co-winners. The front never
 * recalculates ties, it reads the positions of the backend.
 */
export const getCoWinnersOf = (
  ranking: TopProject[],
  projectId: number,
): TopProject[] => {
  const project = ranking.find((item) => item.id === projectId);

  if (!project) return [];

  return ranking.filter(
    (item) => item.position === project.position && item.id !== projectId,
  );
};

/** Projects to assign: the chosen one and, when asked, its co-winners that can still win */
export const buildWinnersToAssign = ({
  ranking,
  projectId,
  includeCoWinners,
  winners,
}: {
  ranking: TopProject[];
  projectId: number;
  includeCoWinners: boolean;
  winners: Pick<AwardWinner, "projectId">[];
}) => {
  const eligible = getEligibleProjects(ranking, winners);
  const chosen = eligible.find((project) => project.id === projectId);

  if (!chosen) return [];
  const coWinners = includeCoWinners ? getCoWinnersOf(eligible, projectId) : [];

  return [chosen, ...coWinners].map((project) => ({
    projectId: project.id,
    grade: project.averageGrade,
  }));
};

export const formatGrade = (grade?: number | null) =>
  typeof grade === "number" && Number.isFinite(grade) ? grade.toFixed(2) : "—";
