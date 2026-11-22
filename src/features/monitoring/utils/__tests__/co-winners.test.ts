import { getCoWinnerPositions, getPositionLabel } from "../co-winners";

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
