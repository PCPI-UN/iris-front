/**
 * A weight given as a fraction of 1, shown as a percentage with at most one decimal: 0.1071 → "10.7%",
 * with a decimal point like the points of the scale (`formatPoints`).
 * Built by hand because Intl's spacing before "%" changes between runtimes.
 */
export const formatWeight = (weight: number): string =>
  `${Math.round(weight * 1000) / 10}%`;

type WeightedScore = { weight?: number; points?: number };

/**
 * Grade the scored criteria add up to: points of the chosen level × effective weight, the same
 * sum the backend grades with. Undefined while some criterion lacks its weight or its points,
 * because a partial sum would then understate the grade.
 */
export const partialGrade = (scored: WeightedScore[]): number | undefined => {
  let total = 0;

  for (const { weight, points } of scored) {
    if (weight === undefined || points === undefined) return undefined;
    total += points * weight;
  }

  return total;
};
