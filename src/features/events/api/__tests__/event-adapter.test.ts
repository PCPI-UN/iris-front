import { describe, expect, it } from "vitest";

import { normalizeEvent } from "../event-adapter";
import { formatTermCode } from "../get-terms";
import { nrcSchema } from "@/features/projects-public/schemas/wizard-schema";

describe("normalizeEvent: academic term and course section", () => {
  it("keeps termId and requiresCourse from the gateway", () => {
    const event = normalizeEvent({ id: 6, termId: 3, requiresCourse: true });

    expect(event.termId).toBe(3);
    expect(event.requiresCourse).toBe(true);
  });

  it("reads a missing requiresCourse as false: the gateway leaves false booleans out", () => {
    const event = normalizeEvent({ id: 7, termId: 3 });

    expect(event.requiresCourse).toBe(false);
  });

  it("keeps the -1 term of the events created before terms existed", () => {
    expect(normalizeEvent({ id: 4, termId: -1, requiresCourse: true }).termId).toBe(-1);
  });
});

describe("formatTermCode", () => {
  it("joins year and period as the university writes the term", () => {
    expect(formatTermCode({ year: 2026, period: "10" })).toBe("202610");
  });
});

describe("nrcSchema", () => {
  it("accepts an NRC and trims it", () => {
    expect(nrcSchema.parse(" 1001 ")).toBe("1001");
  });

  it("rejects an empty or too long NRC", () => {
    expect(nrcSchema.safeParse("").success).toBe(false);
    expect(nrcSchema.safeParse("1".repeat(21)).success).toBe(false);
  });
});
