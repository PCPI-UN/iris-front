import { CriterionComponent } from "@/types/api";

// Same tolerance the backend uses to decide that the components of an event add up to 100 %
const WEIGHT_SUM_TOLERANCE = 1e-6;

/**
 * The backend stores the weight of a component as a fraction of the grade (0 to 1);
 * the form shows it as a percentage with up to 2 decimals.
 */
export const toWeightPercent = (fraction: number): number =>
  Math.round((Number(fraction) || 0) * 100 * 100) / 100;

export const toWeightFraction = (percent: number): number =>
  Math.round(percent * 100) / 10000;

/** Error of a percentage typed in the form, or null when the backend will accept it. */
export const validateWeightPercent = (raw: string): string | null => {
  if (raw.trim() === "") return "El peso es obligatorio.";
  const percent = Number(raw);

  if (!Number.isFinite(percent)) return "El peso debe ser un número.";
  if (percent <= 0 || percent > 100) {
    return "El peso debe ser mayor que 0 % y como máximo 100 %.";
  }

  return null;
};

export const sumComponentWeights = (
  components: Pick<CriterionComponent, "id" | "weight">[],
  excludeComponentId?: number,
): number =>
  components
    .filter((component) => component.id !== excludeComponentId)
    .reduce((sum, component) => sum + (Number(component.weight) || 0), 0);

export const isFullWeight = (sum: number): boolean =>
  Math.abs(sum - 1) <= WEIGHT_SUM_TOLERANCE;

export const exceedsFullWeight = (sum: number): boolean =>
  sum > 1 + WEIGHT_SUM_TOLERANCE;
