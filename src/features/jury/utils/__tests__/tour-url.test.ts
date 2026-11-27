import { describe, expect, test } from "vitest";

import {
  buildTourUrl,
  formatTourTeamCode,
  TOUR_360_BASE_URL,
} from "../tour-url";

describe("tour-url", () => {
  test("formats team code with backend departmentName and assigned projectCode", () => {
    expect(
      formatTourTeamCode({
        termCode: { year: 2026, period: "30" },
        departmentName: "Ingeniería de Sistemas",
        projectCode: "10",
      }),
    ).toBe("202630-Ingeniería de Sistemas-10");

    expect(
      formatTourTeamCode({
        termCode: "202610",
        departmentName: "Ingeniería Industrial",
        projectCode: "5",
      }),
    ).toBe("202610-Ingeniería Industrial-5");
  });

  test("omits term prefix when no academic term is present", () => {
    expect(
      formatTourTeamCode({
        termCode: null,
        departmentName: "Ingeniería de Sistemas",
        projectCode: "10",
      }),
    ).toBe("Ingeniería de Sistemas-10");
  });

  test("returns null when departmentName or projectCode is missing", () => {
    expect(
      formatTourTeamCode({
        termCode: "202630",
        departmentName: null,
        projectCode: "10",
      }),
    ).toBeNull();

    expect(
      formatTourTeamCode({
        termCode: "202630",
        departmentName: "Ingeniería de Sistemas",
        projectCode: "",
      }),
    ).toBeNull();
  });

  test("builds tour URL with encoded url-dinamica pointing to IRIS evaluation page and equipo code", () => {
    const url = buildTourUrl({
      termCode: "202630",
      departmentName: "Ingeniería de Sistemas",
      projectCode: "10",
      projectId: 513,
      origin: "https://iris.uninorte.edu.co",
    });

    expect(url).not.toBeNull();
    const parsed = new URL(url!);
    expect(`${parsed.origin}${parsed.pathname}`).toBe(TOUR_360_BASE_URL);
    expect(parsed.searchParams.get("url-dinamica")).toBe(
      "https://iris.uninorte.edu.co/app/evaluations/513",
    );
    expect(parsed.searchParams.get("equipo")).toBe(
      "202630-Ingeniería de Sistemas-10",
    );
  });

  test("returns null for missing required fields or non-http(s) origins", () => {
    expect(
      buildTourUrl({
        termCode: "202630",
        departmentName: "",
        projectCode: "10",
        projectId: 513,
        origin: "https://iris.uninorte.edu.co",
      }),
    ).toBeNull();

    expect(
      buildTourUrl({
        termCode: "202630",
        departmentName: "Ingeniería de Sistemas",
        projectCode: "10",
        projectId: 513,
        origin: "javascript:alert(1)",
      }),
    ).toBeNull();
  });
});
