import type { EventJuror } from "@/features/juries/api/get-event-juries";
import { reassignJurorInputSchema } from "@/features/projects/api/assign-jurors";

import {
  applyLocalJurorSwap,
  formatJurorName,
  getAvailableReplacementJurors,
} from "../juror-swap";

const eventJuror = (
  id: string,
  firstName: string,
  lastName: string,
  email: string,
  assignedCount = 0,
): EventJuror => ({
  id,
  firstName,
  lastName,
  email,
  assignedProjects: Array.from({ length: assignedCount }, (_, idx) => ({
    id: idx + 100,
    evaluated: false,
  })),
});

describe("getAvailableReplacementJurors", () => {
  const pool: EventJuror[] = [
    eventJuror("1", "Ana", "Gómez", "ana@uninorte.edu.co", 2),
    eventJuror("2", "Carlos", "Pérez", "carlos@uninorte.edu.co", 3),
    eventJuror("3", "Beatriz", "López", "beatriz@uninorte.edu.co", 1),
    eventJuror("4", "David", "Martínez", "david@uninorte.edu.co", 1),
  ];

  test("excludes currently assigned jurors by id or email and sorts by lowest workload then name", () => {
    const available = getAvailableReplacementJurors(pool, [
      { id: "1", memberUserId: "1", email: "ana@uninorte.edu.co" },
    ]);

    expect(available.map((j) => j.id)).toEqual(["3", "4", "2"]);
  });

  test("filters case- and accent-insensitively across name and email", () => {
    const byAccent = getAvailableReplacementJurors(
      pool,
      [{ id: "1", memberUserId: "1", email: "ana@uninorte.edu.co" }],
      "perez",
    );
    expect(byAccent.map((j) => j.id)).toEqual(["2"]);

    const byEmail = getAvailableReplacementJurors(
      pool,
      [{ id: "1", memberUserId: "1", email: "ana@uninorte.edu.co" }],
      "beatriz@",
    );
    expect(byEmail.map((j) => j.id)).toEqual(["3"]);
  });
});

describe("applyLocalJurorSwap", () => {
  test("replaces only the swapped juror while preserving other assignments", () => {
    const replacement = eventJuror("3", "Beatriz", "López", "beatriz@uninorte.edu.co");
    const updated = applyLocalJurorSwap(
      [
        { id: "1", memberUserId: "1", firstName: "Ana", lastName: "Gómez", email: "ana@uninorte.edu.co" },
        { id: "2", memberUserId: "2", firstName: "Carlos", lastName: "Pérez", email: "carlos@uninorte.edu.co" },
      ],
      "1",
      replacement,
    );

    expect(updated.map((j) => j.memberUserId)).toEqual(["3", "2"]);
    expect(updated[0].firstName).toBe("Beatriz");
  });
});

describe("formatJurorName", () => {
  test("falls back from full name to email to default label", () => {
    expect(formatJurorName({ firstName: "Ana", lastName: "Gómez" })).toBe("Ana Gómez");
    expect(formatJurorName({ email: "ana@uninorte.edu.co" })).toBe("ana@uninorte.edu.co");
    expect(formatJurorName({})).toBe("Jurado sin nombre");
  });
});

describe("reassignJurorInputSchema", () => {
  test("accepts valid distinct positive integer IDs and rejects same juror", () => {
    expect(
      reassignJurorInputSchema.parse({
        projectId: "12",
        fromUserId: "5",
        toUserId: 8,
      }),
    ).toEqual({ projectId: 12, fromUserId: 5, toUserId: 8 });

    expect(() =>
      reassignJurorInputSchema.parse({
        projectId: 12,
        fromUserId: 5,
        toUserId: 5,
      }),
    ).toThrow(/diferente al actual/i);
  });
});

