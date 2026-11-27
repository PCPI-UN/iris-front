import { filterByCategory } from "../filters";

const projects = [
  { id: 1, categoryId: 10 },
  { id: 2, categoryId: 20 },
  // Older responses still name the category courseId
  { id: 3, courseId: 10 },
];

describe("filterByCategory", () => {
  test("keeps only the projects of the category, also with the legacy courseId", () => {
    expect(filterByCategory(projects, 10).map((p) => p.id)).toEqual([1, 3]);
  });

  test("returns every project when no category is chosen", () => {
    expect(filterByCategory(projects, undefined)).toHaveLength(3);
  });

  test("returns nothing when no project belongs to the category", () => {
    expect(filterByCategory(projects, 99)).toEqual([]);
  });
});
