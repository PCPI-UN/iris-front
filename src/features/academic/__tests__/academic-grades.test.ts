import { breakdownFromResult, jurorLabel } from "../utils/academic-grades";

describe("academic grades", () => {
  it("scores a component with the weighted average of its criteria", () => {
    const [component] = breakdownFromResult([
      {
        component: "",
        weight: 0.4,
        criteria: [
          { criterionId: 1, criterion: "Claridad", weight: 0.3, score: 5 },
          { criterionId: 2, criterion: "Apoyos", weight: 0.1, score: 3 },
        ],
      },
    ]);

    expect(component.name).toBe("Sin componente");
    expect(component.value).toBeCloseTo(4.5);
    expect(component.criteria.map((criterion) => criterion.value)).toEqual([
      5, 3,
    ]);
  });

  it("names the jurors by letter and past Z by number", () => {
    expect(jurorLabel(0)).toBe("Jurado A");
    expect(jurorLabel(1)).toBe("Jurado B");
    expect(jurorLabel(26)).toBe("Jurado 27");
  });
});
