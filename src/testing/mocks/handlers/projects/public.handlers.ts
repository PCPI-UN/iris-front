// All public project endpoints (no authentication required)
import { HttpResponse, http } from "msw";

import { env } from "@/config/env";

import { db, persistDb } from "../../db";
import { networkDelay } from "../../utils";
import { type ProjectBody } from "./dto";
import { mapProjectToDTO } from "./mapper";
import {
  PAGE_SIZE,
  calculatePagination,
  validatePage,
} from "./pagination";

export const projectsPublicHandlers = [
  http.post(`${env.API_URL}/projects`, async ({ request }) => {
    await networkDelay();

    try {
      const data = (await request.json()) as ProjectBody;

      const result = db.project.create({
        eventId: data.eventId,
        courseId: data.courseId,
        name: data.name,
        logo: data.logo,
        description: data.description || undefined,
        eventNumber: undefined,
        state: data.state || "UNDER_REVIEW",
        createdAt: Date.now(),
        documents: data.documents ?? [],
        participants: data.participants ?? [],
        jurorAssignments: data.jurorAssignments ?? [],
      });

      await persistDb("project");
      return HttpResponse.json(result);
    } catch (error: any) {
      return HttpResponse.json(
        { message: error?.message || "Server Error" },
        { status: 500 },
      );
    }
  }),

  http.get(`${env.API_URL}/projects`, async ({ request }) => {
    await networkDelay();

    try {
      const url = new URL(request.url);
      const page = Number(url.searchParams.get("page") || 1);
      const eventParam = url.searchParams.get("event");
      const pageSize = Number(url.searchParams.get("pageSize") || PAGE_SIZE);
      const shouldReturnAll = pageSize >= 1000;

      let allProjects = db.project.getAll();

      if (eventParam) {
        const eventIds = eventParam
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean);

        allProjects = allProjects.filter((project) =>
          eventIds.includes(String(project.eventId)),
        );
      }

      const total = allProjects.length;
      const validPage = validatePage(page);
      const pagination = calculatePagination(total, validPage, pageSize);

      const projects = shouldReturnAll
        ? allProjects.map((project) => mapProjectToDTO(project))
        : allProjects
          .slice(pageSize * (pagination.page - 1), pageSize * pagination.page)
          .map((project) => mapProjectToDTO(project));

      return HttpResponse.json({
        data: projects,
        meta: pagination,
      });
    } catch (error: any) {
      return HttpResponse.json(
        { message: error?.message || "Server Error" },
        { status: 500 },
      );
    }
  }),
];
