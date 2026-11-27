import { describe, expect, test } from "vitest";

import {
  buildTourUrl,
  formatTourTeamCode,
  TOUR_360_BASE_URL,
} from "../tour-url";

describe("tour-url", () => {
  test("formats team code as <term.year><term.period>-E<event.id>-P<project.id>", () => {
    expect(
      formatTourTeamCode({
        termCode: { year: 2026, period: "30" },
        eventId: 11,
        projectId: 513,
      }),
    ).toBe("202630-E11-P513");

    expect(
      formatTourTeamCode({
        termCode: "202610",
        eventId: 4,
        projectId: 7,
      }),
    ).toBe("202610-E4-P7");
  });

  test("normalizes mock prefixed identifiers and falls back without term when absent", () => {
    expect(
      formatTourTeamCode({
        termCode: "202630",
        eventId: "event-011",
        projectId: "project-012",
      }),
    ).toBe("202630-E11-P12");

    expect(
      formatTourTeamCode({
        termCode: null,
        eventId: 11,
        projectId: 513,
      }),
    ).toBe("E11-P513");
  });

  test("builds tour URL with encoded url-dinamica pointing to IRIS evaluation page and equipo code", () => {
    const url = buildTourUrl({
      termCode: "202630",
      eventId: 11,
      projectId: 513,
      origin: "https://iris.uninorte.edu.co",
    });

    expect(url).not.toBeNull();
    const parsed = new URL(url!);
    expect(`${parsed.origin}${parsed.pathname}`).toBe(TOUR_360_BASE_URL);
    expect(parsed.searchParams.get("url-dinamica")).toBe(
      "https://iris.uninorte.edu.co/app/evaluations/513",
    );
    expect(parsed.searchParams.get("equipo")).toBe("202630-E11-P513");
  });

  test("returns null for missing ids or non-http(s) origins", () => {
    expect(
      buildTourUrl({
        termCode: "202630",
        eventId: null,
        projectId: 513,
        origin: "https://iris.uninorte.edu.co",
      }),
    ).toBeNull();

    expect(
      buildTourUrl({
        termCode: "202630",
        eventId: 11,
        projectId: 513,
        origin: "javascript:alert(1)",
      }),
    ).toBeNull();
  });
});

