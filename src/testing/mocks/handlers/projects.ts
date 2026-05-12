import { HttpResponse, http } from "msw";
import { env } from "@/config/env";
import { db, persistDb } from "../db";
import { requireAuth, networkDelay } from "../utils";

type ProjectBody = {
  eventId: string;
  categoryId?: string;
  courseId?: string;
  name: string;
  logo?: string;
  description?: string | undefined;
  eventNumber?: string | undefined;
  state?: string;
  documents?: Array<{ type: string; url: string }>;
  reason?: string;
  participants?: Array<{
    firstName: string;
    lastName: string;
    email: string;
    studentCode?: string;
    carreer?: string;
    semester?: string;
  }>;
  jurorAssignments?: Array<{
    memberUserId: string;
  }>;
};

const PAGE_SIZE = 10;

const toInternalPrefixedId = (value: string, prefix: string): string => {
  if (value.startsWith(`${prefix}-`)) return value;
  if (/^\d+$/.test(value)) return `${prefix}-${value.padStart(3, "0")}`;
  return value;
};

const parseJsonArray = <T>(value: FormDataEntryValue | null, fallback: T): T => {
  if (typeof value !== "string") return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const parseProjectBody = async (request: Request): Promise<ProjectBody> => {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    return {
      name: String(form.get("name") || ""),
      description: String(form.get("description") || ""),
      eventId: String(form.get("eventId") || ""),
      categoryId: String(form.get("categoryId") || form.get("courseId") || ""),
      logo: String(form.get("logo") || ""),
      state: String(form.get("state") || "UNDER_REVIEW"),
      participants: parseJsonArray(form.get("participants"), []),
      documents: parseJsonArray(form.get("documents"), []),
    };
  }

  return (await request.json()) as ProjectBody;
};

type ProjectDTO = {
  id: string;
  name: string;
  description?: string;
  logo: string;
  state: string;
  eventId: string;
  categoryId?: string;
  eventNumber?: string;
  createdAt: number;
  documents: Array<{ type: string; url: string }>;
  reason: string;
  participants: Array<{
    firstName: string;
    lastName: string;
    email: string;
    studentCode?: string;
  }>;
};

const mapProjectToDTO = (project: any): ProjectDTO => {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    logo: project.logo,
    state: project.state,
    eventId: project.eventId,
    categoryId: project.categoryId ?? project.courseId,
    eventNumber: project.eventNumber || "",
    createdAt: project.createdAt,
    documents: project.documents ?? [],
    reason: project.reason,
    participants: project.participants ?? [],
  };
};

type UpdateProjectStatusBody = {
  state: "APPROVED" | "REJECTED" | "REQUEST_CHANGES";
  reason?: string;
};

const validatePage = (page: number): number => {
  return Math.max(1, Math.floor(page)) || 1;
};

const calculatePagination = (total: number, page: number, pageSize: number = PAGE_SIZE) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return {
    page: Math.min(page, totalPages),
    total,
    totalPages,
  };
};

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

export const projectsHandlers = [
  // Contract used by src/features/projects/api/get-projects.ts
  http.get(`${env.API_URL}/projects/by-event/:eventId`, async ({ cookies, request, params }) => {
    await networkDelay();

    try {
      const { user, error } = requireAuth(cookies);
      if (error || !user) {
        return HttpResponse.json({ message: error || "Unauthorized" }, { status: 401 });
      }

      const rawEventId = String(params.eventId ?? "");
      if (!rawEventId || rawEventId === "undefined" || rawEventId === "NaN") {
        return HttpResponse.json({ items: [], page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
      }

      const eventId = toInternalPrefixedId(rawEventId, "event");
      const url = new URL(request.url);
      const page = Number(url.searchParams.get("page") || 1);
      const state = url.searchParams.get("state");
      const rawCategoryId = url.searchParams.get("categoryId") || url.searchParams.get("courseId");
      const categoryId = rawCategoryId ? toInternalPrefixedId(rawCategoryId, "course") : undefined;
      const pageSize = PAGE_SIZE;
      const validPage = validatePage(page);

      let allProjects = db.project
        .getAll()
        .filter((p) => String(p.eventId) === String(eventId));

      if (state) {
        allProjects = allProjects.filter((p) => String(p.state) === String(state));
      }

      if (categoryId) {
        allProjects = allProjects.filter(
          (p) =>
            String((p as any).categoryId ?? (p as any).courseId) ===
            String(categoryId)
        );
      }

      // USER role: only assigned projects if jury of event
      if (user.role !== "ADMIN") {
        const userId = (user as any)?.id ?? (user as any)?.userId;
        if (!userId || !isUserJuryOfEvent(userId, eventId)) {
          allProjects = [];
        } else {
          allProjects = allProjects.filter((p) => isUserAssignedToProject(p, userId));
        }
      }

      const total = allProjects.length;
      const pagination = calculatePagination(total, validPage, pageSize);
      const start = pageSize * (pagination.page - 1);
      const end = start + pageSize;
      const items = allProjects.slice(start, end).map(mapProjectToDTO);

      return HttpResponse.json({
        items,
        page: pagination.page,
        limit: pageSize,
        total: pagination.total,
        totalPages: pagination.totalPages,
      });
    } catch (error: any) {
      return HttpResponse.json(
        { message: error?.message || "Server Error" },
        { status: 500 }
      );
    }
  }),

  http.post(`${env.API_URL}/projects`, async ({ cookies, request }) => {
    await networkDelay();

    try {
      const data = await parseProjectBody(request);

      // Validar eventId siempre (requerido para ambos tipos)
      if (!data.eventId?.trim()) {
        return HttpResponse.json(
          { message: "eventId is required" },
          { status: 400 }
        );
      }

      // Validar participants siempre (requerido para ambos tipos)
      const participants = parseJsonArray(
        typeof data.participants === "string" 
          ? data.participants 
          : JSON.stringify(data.participants),
        []
      );
      
      if (!Array.isArray(participants) || participants.length === 0) {
        return HttpResponse.json(
          { message: "At least one participant is required" },
          { status: 400 }
        );
      }

      // Determinar si es Competition o Exposition:
      // Competition: no envía name (solo participantes, categoría asignada en cliente)
      // Exposition: requiere name y categoryId ingresados por el usuario
      const isCompetition = !data.name?.trim();
      const selectedCategoryId = data.categoryId || data.courseId;

      if (!isCompetition) {
        // Para Exposition: validar name y categoryId
        if (!data.name?.trim()) {
          return HttpResponse.json(
            { message: "name is required" },
            { status: 400 }
          );
        }

        if (!selectedCategoryId?.trim()) {
          return HttpResponse.json(
            { message: "categoryId is required" },
            { status: 400 }
          );
        }
      }

      const result = db.project.create({
        eventId: toInternalPrefixedId(String(data.eventId), "event"),
        categoryId: selectedCategoryId ? toInternalPrefixedId(String(selectedCategoryId), "course") : "no-course",
        courseId: selectedCategoryId ? toInternalPrefixedId(String(selectedCategoryId), "course") : "no-course",
        name: data.name || (isCompetition ? "Competition Entry" : ""),
        logo: data.logo || "",
        description: data.description || undefined,
        eventNumber: undefined,
        state: data.state || "UNDER_REVIEW",
        createdAt: Date.now(),
        documents: data.documents ?? [],
        reason: data.reason,
        participants: data.participants ?? [],
        jurorAssignments: data.jurorAssignments ?? [],
      });
      await persistDb("project");
      return HttpResponse.json(result);
    } catch (error: any) {
      return HttpResponse.json(
        { message: error?.message || "Server Error" },
        { status: 500 }
      );
    }
  }),

  http.get(`${env.API_URL}/projects/:projectId`, async ({ cookies, request, params }) => {
    await networkDelay();
    try {
      const { error } = requireAuth(cookies);
      if (error) {
        return HttpResponse.json({ message: error }, { status: 401 });
      }
      const url = new URL(request.url);
      const projectId = params.projectId as string;

      if (!projectId) {
        return HttpResponse.json(
          { message: "projectId is required" },
          { status: 400 }
        );
      }

      const project = db.project.findFirst({
        where: { id: { equals: projectId } },
      });

      if (!project) {
        return HttpResponse.json(
          { message: "Project not found" },
          { status: 404 }
        );
      }
      return HttpResponse.json({ data: project });
    } catch (error: any) {
      return HttpResponse.json(
        { message: error?.message || "Server Error" },
        { status: 500 }
      );
    }
  }),

  http.get(`${env.API_URL}/projects`, async ({ cookies, request }) => {
    await networkDelay();

    try {
      const url = new URL(request.url);
      const page = Number(url.searchParams.get("page") || 1);
      const eventParam = url.searchParams.get("event");
      const pageSize = Number(url.searchParams.get("pageSize") || PAGE_SIZE);
      const shouldReturnAll = pageSize >= 1000;

      let allProjects = db.project.getAll();

      // Filter by event IDs if provided
      if (eventParam) {
        const eventIds = eventParam
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean);
        allProjects = allProjects.filter((project) =>
          eventIds.includes(String(project.eventId))
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
        { status: 500 }
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
          return HttpResponse.json(
            { message: "eventId is required" },
            { status: 400 }
          );
        }

        const page = Number(url.searchParams.get("page") || 1);
        const pageSize = Number(url.searchParams.get("pageSize") || PAGE_SIZE);
        const validPage = validatePage(page);

        // Si el usuario es ADMIN, mostrar todos los proyectos del evento
        if (user.role === "ADMIN") {
          const allProjects = db.project.getAll().filter((p) => String(p.eventId) === String(eventId));
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

        // Para usuarios USER, verificar si es jurado del evento
        const userId = (user as any)?.id ?? (user as any)?.userId;
        if (!userId) {
          return HttpResponse.json(
            { message: "userId not found on user" },
            { status: 400 }
          );
        }

        // Verificar si el usuario es jurado del evento
        if (!isUserJuryOfEvent(userId, eventId)) {
          // Si no es jurado, retornar lista vacía
          return HttpResponse.json({
            message: "User is not a jury member of this event",
          },
            { status: 403 });
        }

        // Si es jurado, mostrar solo los proyectos asignados a ese jurado
        const allProjects = db.project
          .getAll()
          .filter((p) => String(p.eventId) === String(eventId))
          .filter((p) => isUserAssignedToProject(p, userId));

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
          { status: 500 }
        );
      }
    }
  ),

  // Contract used by src/features/projects/api/get-project-user-event.ts
  http.get(
    `${env.API_URL}/events/:eventId/my-project`,
    async ({ cookies, params }) => {
      await networkDelay();
      try {
        const { user, error } = requireAuth(cookies);
        if (error || !user) {
          return HttpResponse.json({ message: error || "Unauthorized" }, { status: 401 });
        }

        const eventId = toInternalPrefixedId(String(params.eventId ?? ""), "event");
        const userId = (user as any)?.id ?? (user as any)?.userId;

        if (!eventId || !userId) {
          return HttpResponse.json(
            { message: "Missing eventId or userId" },
            { status: 400 }
          );
        }

        // Find the user's project in this event
        const project = db.project.findFirst({
          where: {
            eventId: { equals: eventId },
          },
        });

        if (!project) {
          return HttpResponse.json(
            { message: "Project not found in this event" },
            { status: 404 }
          );
        }

        // Find the event
        const event = db.event.findFirst({
          where: { id: { equals: eventId } },
        });

        if (!event) {
          return HttpResponse.json(
            { message: "Event not found" },
            { status: 404 }
          );
        }

        return HttpResponse.json({
          data: {
            project,
            event,
          },
        });
      } catch (error: any) {
        return HttpResponse.json(
          { message: error?.message || "Server Error" },
          { status: 500 }
        );
      }
    }
  ),

  http.patch(
    `${env.API_URL}/projects/:projectId/status`,
    async({ cookies, request, params }) => {
      await networkDelay();
      try {
        const { error } = requireAuth(cookies);
        if (error) {
          return HttpResponse.json({ message: error }, { status: 401 });
        }

        const projectId = params.projectId as string;
        const { state, reason } = await request.json() as UpdateProjectStatusBody;

        const allowedStates = ["PENDING","REJECTED", "APPROVED", "REQUEST_CHANGES"];

        if (!allowedStates.includes(state)) {
          return HttpResponse.json(
            {message: "Invalid state"},
            {status: 400}
          );
        }

        if ((state === "REJECTED" || state === "REQUEST_CHANGES") && (!reason || reason.trim() === "")){
          return HttpResponse.json(
            {message: "reason is required for this state."},
            {status: 400}
          );
        }

        const project = db.project.update({
          where: { id: { equals: projectId } },
          data: {
            state,
            ... (reason !== undefined && { reason }),
          },
        });

        if (!project) {
          return HttpResponse.json(
            {message: "Project not found"},
            {status: 404}
          );
        }
        await persistDb("project");
        return HttpResponse.json({
          success: true,
          message: "Project status updated",
        });

      } catch (error: any) {
        return HttpResponse.json(
          { message: error?.message || "Server Error" },
          { status: 500 }
        );
      }
    }
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
          return HttpResponse.json(
            { message: "Invalid body" },
            { status: 400 }
          );
        }

        const updateData: Partial<ProjectBody> = {};
        if (data.eventId) updateData.eventId = data.eventId;
        if (data.categoryId) {
          updateData.categoryId = data.categoryId;
          updateData.courseId = data.categoryId;
        }
        if (data.courseId) {
          updateData.categoryId = data.courseId;
          updateData.courseId = data.courseId;
        }
        if (data.name) updateData.name = data.name;
        if (data.logo) updateData.logo = data.logo;
        if (data.description !== undefined)
          updateData.description = data.description;
        if (data.state) updateData.state = data.state;
        if (data.documents) updateData.documents = data.documents;
        if (data.participants) updateData.participants = data.participants;
        if (data.jurorAssignments)
          updateData.jurorAssignments = data.jurorAssignments;
        if (data.reason !== undefined) updateData.reason = data.reason;

        const project = db.project.update({
          where: { id: { equals: projectId } },
          data: updateData,
        });

        if (!project) {
          return HttpResponse.json(
            { message: "Project not found" },
            { status: 404 }
          );
        }

        await persistDb("project");
        return HttpResponse.json({ data: project });
      } catch (error: any) {
        return HttpResponse.json(
          { message: error?.message || "Server Error" },
          { status: 500 }
        );
      }
    }
  ),

  http.delete(
    `${env.API_URL}/projects/:projectId/jurors/:memberUserId`,
    async ({ cookies, params }) => {
      await networkDelay();

      try {
        const { error } = requireAuth(cookies);
        if (error) {
          return HttpResponse.json({ message: error }, { status: 401 });
        }

        const projectId = params.projectId as string;
        const memberUserId = params.memberUserId as string;

        if (!projectId || !memberUserId) {
          return HttpResponse.json(
            { message: "projectId and memberUserId are required" },
            { status: 400 }
          );
        }

        const project = db.project.findFirst({
          where: { id: { equals: projectId } },
        });

        if (!project) {
          return HttpResponse.json(
            { message: "Project not found" },
            { status: 404 }
          );
        }

        const remainingAssignments = (project.jurorAssignments ?? []).filter(
          (assignment: any) => String(assignment?.memberUserId) !== String(memberUserId)
        );

        const updatedProject = db.project.update({
          where: { id: { equals: projectId } },
          data: {
            jurorAssignments: remainingAssignments,
          },
        });

        if (!updatedProject) {
          return HttpResponse.json(
            { message: "Project not found" },
            { status: 404 }
          );
        }

        await persistDb("project");
        return HttpResponse.json({
          success: true,
          message: "Juror removed from project",
        });
      } catch (error: any) {
        return HttpResponse.json(
          { message: error?.message || "Server Error" },
          { status: 500 }
        );
      }
    }
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
        return HttpResponse.json(
          { message: "Project not found" },
          { status: 404 }
        );
      }

      await persistDb("project");
      return HttpResponse.json({ data: project });
    } catch (error: any) {
      return HttpResponse.json(
        { message: error?.message || "Server Error" },
        { status: 500 }
      );
    }
  }),
];
