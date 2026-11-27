import {
  filterByTopPositions,
  getCoWinnerPositions,
  getPositionLabel,
} from "../co-winners";

describe("getCoWinnerPositions", () => {
  test("marks the positions shared by more than one project", () => {
    // Dense positions from the backend: 1, 1, 2, 3, 3
    const items = [1, 1, 2, 3, 3].map((position) => ({ position }));
    expect([...getCoWinnerPositions(items)]).toEqual([1, 3]);
  });

  test("no ties, no co-winners", () => {
    expect(
      getCoWinnerPositions([1, 2, 3].map((position) => ({ position }))).size,
    ).toBe(0);
    expect(getCoWinnerPositions([]).size).toBe(0);
  });
});

describe("getPositionLabel", () => {
  test.each([
    [1, "1.er puesto"],
    [2, "2.º puesto"],
    [3, "3.er puesto"],
    [4, "4.º puesto"],
  ])("labels position %i", (position, label) => {
    expect(getPositionLabel(position)).toBe(label);
  });
});

describe("filterByTopPositions", () => {
  test("keeps every co-winner tied at the last visible position", () => {
    const rows = [
      { id: 1, position: 1 },
      { id: 2, position: 1 },
      { id: 3, position: 2 },
      { id: 4, position: 2 },
      { id: 5, position: 3 },
    ];

    expect(filterByTopPositions(rows, 2).map((row) => row.id)).toEqual([
      1, 2, 3, 4,
    ]);
  });

  test("returns all rows when limit is non-positive", () => {
    const rows = [
      { id: 1, position: 1 },
      { id: 2, position: 2 },
    ];

    expect(filterByTopPositions(rows, 0)).toEqual(rows);
  });
});
