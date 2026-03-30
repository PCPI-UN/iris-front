// All private (authenticated) project endpoints

import { HttpResponse, http } from "msw";
import { env } from "@/config/env";

import { db, persistDb } from "../../db";
import { networkDelay, requireAuth } from "../../utils";
import { type ProjectBody } from "./dto";
import { mapProjectToDTO } from "./mapper";
import {
  PAGE_SIZE,
  calculatePagination,
  validatePage,
} from "./pagination";

const isUserAssignedToProject = (project: any, userId: string): boolean => {
  const assignments = project.jurorAssignments ?? [];

  return assignments.some((assignment: any) => {
    if (typeof assignment === "string") {
      return assignment === userId;
    }

    return assignment?.memberUserId === userId;
  });
};

const isUserJuryOfEvent = (userId: string, eventId: string): boolean => {
  const membership = db.eventMembership?.findFirst({
    where: {
      userId: { equals: userId },
      eventId: { equals: eventId },
      eventRole: { equals: "JURY" },
    },
  });

  return !!membership;
};

export const projectsPrivateHandlers = [
  http.get(`${env.API_URL}/projects/:projectId`, async ({ cookies, request, params }) => {
    await networkDelay();

    try {
      const { error } = requireAuth(cookies);
      if (error) {
        return HttpResponse.json({ message: error }, { status: 401 });
      }

      void request;
      const projectId = params.projectId as string;

      if (!projectId) {
        return HttpResponse.json({ message: "projectId is required" }, { status: 400 });
      }

      const project = db.project.findFirst({
        where: { id: { equals: projectId } },
      });

      if (!project) {
        return HttpResponse.json({ message: "Project not found" }, { status: 404 });
      }

      return HttpResponse.json({ data: project });
    } catch (error: any) {
      return HttpResponse.json(
        { message: error?.message || "Server Error" },
        { status: 500 },
      );
    }
  }),

  http.get(
    `${env.API_URL}/events/:eventId/projects`,
    async ({ cookies, request, params }) => {
      await networkDelay();

      try {
        const { user, error } = requireAuth(cookies);
        if (error || !user) {
          return HttpResponse.json({ message: error || "Unauthorized" }, { status: 401 });
        }

        const url = new URL(request.url);
        const eventId = params.eventId as string;
        if (!eventId) {
          return HttpResponse.json({ message: "eventId is required" }, { status: 400 });
        }

        const page = Number(url.searchParams.get("page") || 1);
        const pageSize = Number(url.searchParams.get("pageSize") || PAGE_SIZE);
        const validPage = validatePage(page);

        if (user.role === "ADMIN") {
          const allProjects = db.project
            .getAll()
            .filter((project) => String(project.eventId) === String(eventId));
          const total = allProjects.length;
          const pagination = calculatePagination(total, validPage, pageSize);
          const start = pageSize * (pagination.page - 1);
          const end = start + pageSize;
          const paginatedProjects = allProjects.slice(start, end);

          const projects = paginatedProjects.map((project) => mapProjectToDTO(project));

          return HttpResponse.json({
            data: projects,
            meta: pagination,
          });
        }

        const userId = (user as any)?.id ?? (user as any)?.userId;
        if (!userId) {
          return HttpResponse.json({ message: "userId not found on user" }, { status: 400 });
        }

        if (!isUserJuryOfEvent(userId, eventId)) {
          return HttpResponse.json(
            { message: "User is not a jury member of this event" },
            { status: 403 },
          );
        }

        const allProjects = db.project
          .getAll()
          .filter((project) => String(project.eventId) === String(eventId))
          .filter((project) => isUserAssignedToProject(project, userId));

        const total = allProjects.length;
        const pagination = calculatePagination(total, validPage, pageSize);
        const start = pageSize * (pagination.page - 1);
        const end = start + pageSize;
        const paginatedProjects = allProjects.slice(start, end);

        const projects = paginatedProjects.map((project) => mapProjectToDTO(project));

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
    },
  ),

  http.patch(
    `${env.API_URL}/projects/:projectId`,
    async ({ cookies, request, params }) => {
      await networkDelay();

      try {
        const { error } = requireAuth(cookies);
        if (error) {
          return HttpResponse.json({ message: error }, { status: 401 });
        }

        const projectId = params.projectId as string;
        const data = (await request.json()) as Partial<ProjectBody>;

        if (!data || typeof data !== "object") {
          return HttpResponse.json({ message: "Invalid body" }, { status: 400 });
        }

        const updateData: Partial<ProjectBody> = {};
        if (data.eventId) updateData.eventId = data.eventId;
        if (data.courseId) updateData.courseId = data.courseId;
        if (data.name) updateData.name = data.name;
        if (data.logo) updateData.logo = data.logo;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.state) updateData.state = data.state;
        if (data.documents) updateData.documents = data.documents;
        if (data.participants) updateData.participants = data.participants;
        if (data.jurorAssignments) updateData.jurorAssignments = data.jurorAssignments;

        const project = db.project.update({
          where: { id: { equals: projectId } },
          data: updateData,
        });

        if (!project) {
          return HttpResponse.json({ message: "Project not found" }, { status: 404 });
        }

        await persistDb("project");
        return HttpResponse.json({ data: project });
      } catch (error: any) {
        return HttpResponse.json(
          { message: error?.message || "Server Error" },
          { status: 500 },
        );
      }
    },
  ),

  http.delete(`${env.API_URL}/projects/:id`, async ({ cookies, params }) => {
    await networkDelay();

    try {
      const { error } = requireAuth(cookies);
      if (error) {
        return HttpResponse.json({ message: error }, { status: 401 });
      }

      const projectId = params.id as string;
      const project = db.project.delete({
        where: { id: { equals: projectId } },
      });

      if (!project) {
        return HttpResponse.json({ message: "Project not found" }, { status: 404 });
      }

      await persistDb("project");
      return HttpResponse.json({ data: project });
    } catch (error: any) {
      return HttpResponse.json(
        { message: error?.message || "Server Error" },
        { status: 500 },
      );
    }
  }),
];
