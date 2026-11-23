import {
  effectiveCriterionWeights,
  formatCriterionWeight,
  parseRelativeWeight,
} from "../criterion-weights";

describe("parseRelativeWeight", () => {
  it("accepts a number above 0 written with dot or comma", () => {
    expect(parseRelativeWeight("1")).toBe(1);
    expect(parseRelativeWeight("10")).toBe(10);
    expect(parseRelativeWeight("2,5")).toBe(2.5);
    expect(parseRelativeWeight(" 0.5 ")).toBe(0.5);
  });

  it("rejects an empty, zero, negative or non numeric weight", () => {
    expect(parseRelativeWeight("")).toBeNull();
    expect(parseRelativeWeight("0")).toBeNull();
    expect(parseRelativeWeight("-1")).toBeNull();
    expect(parseRelativeWeight("1.2.3")).toBeNull();
    expect(parseRelativeWeight("abc")).toBeNull();
  });
});

describe("effectiveCriterionWeights", () => {
  const oral = { id: 1, weight: 0.3 };
  const prototype = { id: 2, weight: 0.7 };
  const criterion = (
    id: number,
    weight: number,
    componentId: number | null,
    overrides: { active?: boolean; categoryIds?: number[] } = {},
  ) => ({
    id,
    weight,
    active: overrides.active ?? true,
    categoryIds: overrides.categoryIds ?? [5],
    component: componentId
      ? { id: componentId, name: "", weight: 0 }
      : undefined,
  });

  it("splits the weight of a component by the relative weights of its criteria", () => {
    const weights = effectiveCriterionWeights(
      [oral, prototype],
      [
        criterion(10, 10, 1),
        criterion(11, 9, 1),
        criterion(12, 9, 1),
        criterion(13, 1, 2),
      ],
      5,
    );

    expect(weights.get(10)).toBeCloseTo(0.1071, 4);
    expect(weights.get(11)).toBeCloseTo(0.0964, 4);
    expect(weights.get(13)).toBeCloseTo(0.7);
    expect(
      [...weights.values()].reduce((sum, weight) => sum + weight, 0),
    ).toBeCloseTo(1);
  });

  it("leaves out inactive criteria, other categories and criteria without component", () => {
    const weights = effectiveCriterionWeights(
      [oral],
      [
        criterion(10, 1, 1),
        criterion(11, 1, 1, { active: false }),
        criterion(12, 1, 1, { categoryIds: [6] }),
        criterion(13, 1, null),
      ],
      5,
    );

    expect(weights.get(10)).toBeCloseTo(0.3);
    expect(weights.has(11)).toBe(false);
    expect(weights.has(12)).toBe(false);
    expect(weights.has(13)).toBe(false);
  });
});

describe("formatCriterionWeight", () => {
  it("shows the relative weight and, with a category, the weight in the grade", () => {
    expect(formatCriterionWeight(10)).toBe("Peso 10");
    expect(formatCriterionWeight(10, (0.3 * 10) / 28)).toBe(
      "Peso 10 · 10.7 % de la nota",
    );
  });
});
