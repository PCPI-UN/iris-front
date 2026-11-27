import type { ComponentStats, GradeStatus, ResultComponent } from "../types";

import { formatPoints } from "@/features/grading-scales/utils/grading-scale";

export { formatPoints };
export { formatWeight } from "@/features/jury/utils/criterion-weight";

export const GRADE_STATUS_LABELS: Record<GradeStatus, string> = {
  PENDING: "Sin evaluar",
  PRELIMINARY: "Preliminar",
  OFFICIAL: "Oficial",
};

/** A rubric component with its criteria, whatever its source (a result or the averages) */
export type BreakdownItem = {
  key: string;
  name: string;
  /** Effective weight in the grade (fraction, 0-1) */
  weight: number;
  /** Score or average, on the scale of the grade */
  value: number;
  criteria: { key: string; name: string; weight: number; value: number }[];
};

/** The back sends an empty name for the criteria without component */
const componentName = (name: string | null | undefined) =>
  name?.trim() || "Sin componente";

/** Components of a project result or of one juror's evaluation */
export const breakdownFromResult = (
  components: ResultComponent[],
): BreakdownItem[] =>
  components.map((component, index) => {
    const totalWeight = component.criteria.reduce(
      (sum, criterion) => sum + criterion.weight,
      0,
    );
    // The result sends only the criteria: the component scores what its criteria add up to
    const value =
      totalWeight > 0
        ? component.criteria.reduce(
            (sum, criterion) => sum + criterion.score * criterion.weight,
            0,
          ) / totalWeight
        : component.criteria.reduce((sum, c) => sum + c.score, 0) /
          Math.max(component.criteria.length, 1);

    return {
      key: `${index}-${component.component}`,
      name: componentName(component.component),
      weight: component.weight,
      value,
      criteria: component.criteria.map((criterion) => ({
        key: String(criterion.criterionId),
        name: criterion.criterion,
        weight: criterion.weight,
        value: criterion.score,
      })),
    };
  });

/** Average of each component and criterion over the evaluated projects */
export const breakdownFromStats = (
  components: ComponentStats[],
): BreakdownItem[] =>
  components.map((component, index) => ({
    key: `${component.id ?? `none-${index}`}`,
    name: componentName(component.name),
    weight: component.weight,
    value: component.average,
    criteria: component.criteria.map((criterion) => ({
      key: String(criterion.id),
      name: criterion.name,
      weight: criterion.weight,
      value: criterion.average,
    })),
  }));

/** Share of the scale reached (0-100); null without a scale */
export const scorePercent = (
  value: number,
  maxScore: number | null | undefined,
): number | null =>
  maxScore && maxScore > 0
    ? Math.min(Math.max((value / maxScore) * 100, 0), 100)
    : null;

/** "4.3 / 5", or only the score when the scale is unknown */
export const formatScore = (
  value: number,
  maxScore: number | null | undefined,
): string =>
  maxScore
    ? `${formatPoints(value)} / ${formatPoints(maxScore)}`
    : formatPoints(value);

/** Jurado A, B... in the order the back sends the evaluations; past Z, by number */
export const jurorLabel = (index: number): string =>
  `Jurado ${index < 26 ? String.fromCharCode(65 + index) : index + 1}`;
