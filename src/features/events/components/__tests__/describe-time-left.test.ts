import type { MeEvent } from "../../api/get-me-events";

import dayjs from "dayjs";

import { describeTimeLeft } from "../me-events-section";

const event = (startDate: string, endDate: string) =>
  ({
    id: 1,
    name: "Feria",
    startDate,
    endDate,
    roles: [],
  }) as unknown as MeEvent;

const now = dayjs("2026-11-23T10:00:00");

test("before it starts, counts the days to the start", () => {
  expect(
    describeTimeLeft(event("2026-12-01T08:00:00", "2026-12-30T18:00:00"), now),
  ).toBe("Empieza en 8 días");
});

test("once started, counts the days to the end", () => {
  expect(
    describeTimeLeft(event("2026-11-20T08:00:00", "2026-12-20T18:00:00"), now),
  ).toBe("Termina en 27 días");
});

test("tomorrow and today read as words", () => {
  expect(
    describeTimeLeft(event("2026-11-24T08:00:00", "2026-11-30T18:00:00"), now),
  ).toBe("Empieza mañana");
  expect(
    describeTimeLeft(event("2026-11-20T08:00:00", "2026-11-23T18:00:00"), now),
  ).toBe("Termina hoy");
});
