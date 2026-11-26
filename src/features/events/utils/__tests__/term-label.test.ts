import { describe, expect, test } from "vitest";

import { eventTermLabel, NO_TERM_LABEL } from "../term-label";

const terms = [
  { id: 1, year: 2026, period: "10" },
  { id: 2, year: 2026, period: "30" },
];

describe("eventTermLabel", () => {
  test("shows the term code of the event", () => {
    expect(eventTermLabel(1, terms)).toBe("202610");
    expect(eventTermLabel(2, terms)).toBe("202630");
  });

  test.each([[-1], [0], [undefined], [null]])(
    "an event created before terms existed (%s) has no term",
    (termId) => {
      expect(eventTermLabel(termId, terms)).toBe(NO_TERM_LABEL);
      expect(NO_TERM_LABEL).toBe("Sin periodo");
    },
  );

  test("a term the list does not have yet is still shown", () => {
    expect(eventTermLabel(9, terms)).toBe("Periodo 9");
    expect(eventTermLabel(1, undefined)).toBe("Periodo 1");
  });
});
