import {
  exceedsFullWeight,
  isFullWeight,
  sumComponentWeights,
  toWeightFraction,
  toWeightPercent,
  validateWeightPercent,
} from "../component-weights";

describe("toWeightFraction and toWeightPercent", () => {
  it("convert between the percentage of the form and the fraction of the backend", () => {
    expect(toWeightFraction(30)).toBe(0.3);
    expect(toWeightFraction(33.33)).toBe(0.3333);
    expect(toWeightPercent(0.3)).toBe(30);
    expect(toWeightPercent(0.3333)).toBe(33.33);
  });

  it("shows the 0 of the component left by the migration as 0 %", () => {
    expect(toWeightPercent(0)).toBe(0);
  });
});

describe("validateWeightPercent", () => {
  it("accepts a weight above 0 % and up to 100 %", () => {
    expect(validateWeightPercent("0.01")).toBeNull();
    expect(validateWeightPercent("40")).toBeNull();
    expect(validateWeightPercent("100")).toBeNull();
  });

  it("rejects an empty, zero, negative or over 100 % weight", () => {
    expect(validateWeightPercent("")).not.toBeNull();
    expect(validateWeightPercent("0")).not.toBeNull();
    expect(validateWeightPercent("-5")).not.toBeNull();
    expect(validateWeightPercent("100.5")).not.toBeNull();
    expect(validateWeightPercent("abc")).not.toBeNull();
  });
});

describe("sumComponentWeights", () => {
  const components = [
    { id: 1, weight: 0.3 },
    { id: 2, weight: 0.3 },
    { id: 3, weight: 0.4 },
  ];

  it("adds the weights of the components of the event", () => {
    expect(isFullWeight(sumComponentWeights(components))).toBe(true);
  });

  it("leaves out the component being edited", () => {
    expect(sumComponentWeights(components, 3)).toBeCloseTo(0.6);
  });
});

describe("isFullWeight and exceedsFullWeight", () => {
  it("treat 0.1 + 0.2 + 0.7 as exactly 100 %", () => {
    const sum = 0.1 + 0.2 + 0.7;

    expect(isFullWeight(sum)).toBe(true);
    expect(exceedsFullWeight(sum)).toBe(false);
  });

  it("tell a rubric under 100 % from one over 100 %", () => {
    expect(isFullWeight(0.9)).toBe(false);
    expect(exceedsFullWeight(0.9)).toBe(false);
    expect(exceedsFullWeight(1.1)).toBe(true);
  });
});
