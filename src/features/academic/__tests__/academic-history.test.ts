import type { AcademicEvent } from "../types";

import dayjs from "dayjs";

import {
  eventStage,
  formatEventRange,
  groupEventsBySemester,
  semesterOf,
} from "../utils/academic-history";

const event = (
  id: number,
  startDate: string,
  changes: Partial<AcademicEvent> = {},
): AcademicEvent => ({
  id,
  name: `Feria ${id}`,
  startDate,
  endDate: startDate,
  inscriptionDeadline: startDate,
  active: false,
  evaluationsOpened: false,
  resultsPublished: false,
  requiresCourse: true,
  ...changes,
});

describe("academic history", () => {
  it("puts January to June in the first semester and July onwards in the second", () => {
    expect(semesterOf({ startDate: "2026-06-15T12:00:00" })).toBe("2026-1");
    expect(semesterOf({ startDate: "2026-07-01T12:00:00" })).toBe("2026-2");
  });

  it("groups the events by semester, newest semester and event first", () => {
    const groups = groupEventsBySemester([
      event(1, "2025-11-20T12:00:00"),
      event(2, "2026-05-10T12:00:00"),
      event(3, "2026-03-01T12:00:00"),
    ]);

    expect(groups.map(({ semester }) => semester)).toEqual([
      "2026-1",
      "2025-2",
    ]);
    expect(groups[0].events.map(({ id }) => id)).toEqual([2, 3]);
  });

  it("tells the stage of the event, published results first", () => {
    const now = dayjs("2026-11-25T12:00:00");

    expect(
      eventStage(
        event(1, "2026-11-01T12:00:00", {
          evaluationsOpened: true,
          resultsPublished: true,
        }),
        now,
      ),
    ).toBe("results");
    expect(
      eventStage(
        event(1, "2026-11-01T12:00:00", { evaluationsOpened: true }),
        now,
      ),
    ).toBe("evaluation");
    expect(eventStage(event(1, "2026-11-01T12:00:00"), now)).toBe("finished");
    expect(eventStage(event(1, "2026-12-01T12:00:00"), now)).toBe("ongoing");
  });

  it("writes the month and the year once when they repeat", () => {
    expect(
      formatEventRange(
        event(1, "2026-02-20T12:00:00", { endDate: "2026-02-22T12:00:00" }),
      ),
    ).toBe("20 – 22 feb, 2026");
  });
});
