import { http, HttpResponse } from "msw";
import { describe, expect, test } from "vitest";

import { getJuryAssignedProjects } from "../get-jury-project";

import { server } from "@/testing/mocks/server";

const project = (id: number) => ({
  id,
  name: `Proyecto ${id}`,
  evaluated: false,
});

describe("getJuryAssignedProjects", () => {
  test("keeps asking for pages until it has every assigned project", async () => {
    const pages: string[] = [];

    server.use(
      http.get("*/api/projects/assigned-projects", ({ request }) => {
        const url = new URL(request.url);
        const page = Number(url.searchParams.get("page"));
        const pageSize = Number(url.searchParams.get("pageSize"));

        pages.push(`${url.searchParams.get("eventId")}:${page}:${pageSize}`);
        const start = (page - 1) * pageSize;
        const count = Math.max(0, Math.min(pageSize, 105 - start));

        return HttpResponse.json({
          items: Array.from({ length: count }, (_, i) =>
            project(start + i + 1),
          ),
          page,
          pageSize,
          total: 105,
        });
      }),
    );

    const projects = await getJuryAssignedProjects(4);

    expect(projects).toHaveLength(105);
    expect(projects[104].id).toBe(105);
    expect(pages).toEqual(["4:1:50", "4:2:50", "4:3:50"]);
  });

  test("stops when a page comes back empty before reaching the total", async () => {
    let calls = 0;

    server.use(
      http.get("*/api/projects/assigned-projects", () => {
        calls++;

        return HttpResponse.json({
          items: calls === 1 ? [project(1)] : [],
          page: calls,
          pageSize: 50,
          total: 30,
        });
      }),
    );

    const projects = await getJuryAssignedProjects(4);

    expect(projects).toHaveLength(1);
    expect(calls).toBe(2);
  });
});
