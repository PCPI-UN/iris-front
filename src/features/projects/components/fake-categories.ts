// fake-categories.ts

export const categoriesByEvent: Record<number, { id: number; name: string }[]> = {
  7: [
    { id: 1, name: "course-001" },
    { id: 2, name: "course-002" },
    { id: 3, name: "course-003" },
    { id: 4, name: "course-004" },
  ],
  2: [
    { id: 1, name: "course-001" },
    { id: 2, name: "course-002" },
  ],
  3: [
    { id: 1, name: "course-001" },
    { id: 2, name: "course-002" },
  ],
  4: [
    { id: 1, name: "course-001" },
    { id: 2, name: "course-002" },
  ],
};