import { http, HttpResponse } from "msw";
import { describe, expect, test } from "vitest";

import { getMeEvents } from "../get-me-events";

import { server } from "@/testing/mocks/server";

const rawEvent = {
  id: 7,
  name: "Feria",
  startDate: "2026-12-01T00:00:00",
  endDate: "2026-12-03T00:00:00",
  statusName: "UPCOMING",
  statusDescription: "Inscripciones abiertas",
  eventType: 1,
};

describe("getMeEvents", () => {
  test("asks for the given status and page and keeps the roles in order", async () => {
    let query = "";
    server.use(
      http.get("*/api/me/events", ({ request }) => {
        query = new URL(request.url).search;
        return HttpResponse.json({
          events: [{ ...rawEvent, roles: ["JURY", "TUTOR"] }],
          meta: { total: 11, currentPage: 2, totalPages: 2, itemsPerPage: 10 },
        });
      }),
    );

    const { data, meta } = await getMeEvents({ status: "current", page: 2 });

    expect(query).toContain("status=current");
    expect(query).toContain("page=2");
    expect(data[0]).toMatchObject({
      id: 7,
      statusName: "UPCOMING",
      statusDescription: "Inscripciones abiertas",
      roles: ["JURY", "TUTOR"],
    });
    expect(meta).toEqual({ page: 2, total: 11, totalPages: 2 });
  });

  test("drops a role code the front does not know and tolerates a missing list", async () => {
    server.use(
      http.get("*/api/me/events", () =>
        HttpResponse.json({
          events: [
            { ...rawEvent, roles: ["JURY", "ALUMNI"] },
            { ...rawEvent, id: 8 },
          ],
          meta: { total: 2, currentPage: 1, totalPages: 0 },
        }),
      ),
    );

    const { data, meta } = await getMeEvents({ status: "past" });

    expect(data[0].roles).toEqual(["JURY"]);
    expect(data[1].roles).toEqual([]);
    expect(meta.totalPages).toBe(1);
  });
});
