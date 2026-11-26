import { CriterionComponent } from "@/types/api";

type WeightedCriterion = {
  id: number;
  weight: number;
  active?: boolean;
  categoryIds: number[];
  component?: Pick<CriterionComponent, "id">;
};

export const DEFAULT_RELATIVE_WEIGHT = 1;

/** Relative weight typed in the form (comma or dot), or null when it is not a number above 0. */
export const parseRelativeWeight = (raw: string): number | null => {
  const normalized = raw.trim().replace(",", ".");

  if (!/^\d+(\.\d+)?$/.test(normalized)) return null;
  const weight = Number(normalized);

  return weight > 0 ? weight : null;
};

/**
 * Weight of each criterion in the grade of one category, as the backend computes it:
 *
 *   componentWeight × criterionWeight ÷ Σ criterionWeight (same component, same category)
 *
 * Example: a 30 % component with criteria of relative weight 10, 9 and 9 gives the
 * first one 0.3 × 10 ÷ 28 = 10.7 %. Inactive criteria, criteria of other categories
 * and criteria without component of the event do not take part.
 */
export const effectiveCriterionWeights = (
  components: Pick<CriterionComponent, "id" | "weight">[],
  criteria: WeightedCriterion[],
  categoryId: number,
): Map<number, number> => {
  const componentWeights = new Map(
    components.map((component) => [
      component.id,
      Number(component.weight) || 0,
    ]),
  );
  const relativeTotals = new Map<number, number>();
  const counted = criteria.filter(
    (criterion) =>
      criterion.active !== false &&
      criterion.categoryIds.includes(categoryId) &&
      !!criterion.component?.id &&
      componentWeights.has(criterion.component.id),
  );

  for (const criterion of counted) {
    const componentId = criterion.component!.id;

    relativeTotals.set(
      componentId,
      (relativeTotals.get(componentId) ?? 0) + (Number(criterion.weight) || 0),
    );
  }

  return new Map(
    counted.map((criterion) => {
      const componentId = criterion.component!.id;
      const relativeTotal = relativeTotals.get(componentId) ?? 0;

      return [
        criterion.id,
        relativeTotal > 0
          ? (componentWeights.get(componentId)! *
              (Number(criterion.weight) || 0)) /
            relativeTotal
          : 0,
      ];
    }),
  );
};

/** "Peso 10", or "Peso 10 · 10.7 % de la nota" when the category is known. */
export const formatCriterionWeight = (
  relativeWeight: number,
  effectiveWeight?: number,
): string => {
  const relative = `Peso ${Number(relativeWeight) || 0}`;

  return effectiveWeight === undefined
    ? relative
    : `${relative} · ${Math.round(effectiveWeight * 1000) / 10} % de la nota`;
};
