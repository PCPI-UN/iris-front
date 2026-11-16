import {
  EventAward,
  formatAwardValue,
  getAwardDescription,
  getAwardPositionLabel,
  getAwardTitle,
  getVisibleAwards,
} from "../event-awards";

const award = (overrides: Partial<EventAward> = {}): EventAward => ({
  title: "Primer lugar",
  description: "Premio monetario",
  value: 3000000,
  position: 1,
  ...overrides,
});

describe("getAwardTitle", () => {
  test("uses the title registered by the admin", () => {
    expect(
      getAwardTitle(award({ title: "  Mención especial ", position: 3 })),
    ).toBe("Mención especial");
  });

  test("falls back to the position label when there is no title", () => {
    expect(getAwardTitle(award({ title: "", position: 2 }))).toBe(
      "Segundo puesto",
    );
    expect(getAwardTitle(award({ title: "   ", position: 7 }))).toBe(
      "7° puesto",
    );
  });
});

describe("getAwardPositionLabel", () => {
  test.each([
    [1, "Primer puesto"],
    [3, "Tercer puesto"],
    [4, "Cuarto puesto"],
    [5, "5° puesto"],
  ])("labels position %i", (position, label) => {
    expect(getAwardPositionLabel(position)).toBe(label);
  });
});

describe("formatAwardValue", () => {
  test("formats the value in Colombian pesos", () => {
    expect(formatAwardValue(3000000)).toBe("$3.000.000 COP");
    expect(formatAwardValue(1500)).toBe("$1.500 COP");
  });

  test.each([0, -10, undefined, null, Number.NaN])(
    "returns null for %s",
    (value) => {
      expect(formatAwardValue(value)).toBeNull();
    },
  );
});

describe("getAwardDescription", () => {
  test("returns null for an empty description", () => {
    expect(getAwardDescription(award({ description: "  " }))).toBeNull();
    expect(getAwardDescription(award({ description: undefined }))).toBeNull();
  });

  test("returns the trimmed description", () => {
    expect(getAwardDescription(award({ description: " Bono " }))).toBe("Bono");
  });
});

describe("getVisibleAwards", () => {
  test("orders the awards by position", () => {
    const awards = [
      award({ title: "C", position: 3 }),
      award({ title: "A", position: 1 }),
      award({ title: "B", position: 2 }),
    ];
    expect(getVisibleAwards(awards).map((a) => a.title)).toEqual([
      "A",
      "B",
      "C",
    ]);
  });

  test("handles missing or malformed data", () => {
    expect(getVisibleAwards(undefined)).toEqual([]);
    expect(getVisibleAwards(null)).toEqual([]);
    expect(
      getVisibleAwards([award(), null, { title: "sin posición" }] as never),
    ).toHaveLength(1);
  });

  test("does not mutate the original array", () => {
    const awards = [award({ position: 2 }), award({ position: 1 })];
    getVisibleAwards(awards);
    expect(awards.map((a) => a.position)).toEqual([2, 1]);
  });
});
