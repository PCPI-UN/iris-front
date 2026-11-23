import { HttpResponse, http } from "msw";

import { db, persistDb } from "../db";
import { networkDelay, requireAuth } from "../utils";

import { recordProjectChange } from "./project-change-log-store";

import { env } from "@/config/env";

/**
 * Administrative corrections of a project (manage:projects), with the contract of the gateway:
 * PATCH /projects/:id/admin, participants, PUT /projects/:id/tutors, documents and
 * GET /projects/tutor-candidates. Every change is recorded in the change log of the project.
 */

type MockDocument = {
  id: number;
  projectId: number;
  type: string;
  url: string;
  state: "ACTIVE" | "INACTIVE";
};

type MockParticipant = {
  userId: number;
  studentCode?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  semester?: string;
  career?: string;
  status: string;
};

type MockPendingParticipant = {
  pendingId: number;
  projectId: number;
  firstName: string;
  lastName: string;
  email: string;
  studentCode: string;
  semester: string;
  career: string;
  status: string;
};

type MockTutor = {
  userId?: number;
  firstName: string;
  lastName?: string;
  pending: boolean;
  email?: string;
};

const unauthorized = (error: string) =>
  HttpResponse.json({ message: error }, { status: 401 });

const notFound = (message = "Proyecto no encontrado") =>
  HttpResponse.json({ statusCode: 404, message }, { status: 404 });

const badRequest = (message: string, code?: string) =>
  HttpResponse.json(
    { statusCode: 400, message, ...(code ? { code, details: {} } : {}) },
    { status: 400 },
  );

const conflict = (
  message: string,
  code: string,
  details: Record<string, unknown>,
) =>
  HttpResponse.json(
    {
      statusCode: 409,
      message,
      code,
      details,
      timestamp: new Date().toISOString(),
    },
    { status: 409 },
  );

const DOCUMENT_TYPES: Record<string, string> = {
  "1": "LOGO",
  "2": "POSTER",
  "3": "SUPPORTING_DOCUMENT",
  ASSOCIATED_DOCUMENT: "SUPPORTING_DOCUMENT",
};

/** Gives the stored project the ids the admin endpoints need (participants, pending, documents) */
const loadAdminProject = (projectId: string) => {
  const project = db.project.findFirst({
    where: { id: { equals: projectId } },
  });

  if (!project) return null;

  const participants: MockParticipant[] = (
    (project.participants ?? []) as any[]
  ).map((participant, index) => ({
    ...participant,
    userId: Number(participant.userId) || 1000 + index,
    status: participant.status ?? "JOINED",
  }));
  const pendingParticipants: MockPendingParticipant[] = (
    (project.pendingParticipants ?? []) as any[]
  ).map((participant, index) => ({
    ...participant,
    pendingId: Number(participant.pendingId) || index + 1,
    projectId: Number(projectId) || 0,
    status: participant.status ?? "PENDING",
  }));
  const documents: MockDocument[] = ((project.documents ?? []) as any[]).map(
    (document, index) => ({
      ...document,
      id: Number(document.id) || index + 1,
      projectId: Number(projectId) || 0,
      type: DOCUMENT_TYPES[String(document.type)] ?? String(document.type),
      state: document.state === "INACTIVE" ? "INACTIVE" : "ACTIVE",
    }),
  );

  return {
    project,
    participants,
    pendingParticipants,
    documents,
    tutors: (project.tutors ?? []) as MockTutor[],
  };
};

/** GET /projects/:id as the gateway answers it: ids filled in, INACTIVE documents left out */
export const toProjectReadResponse = (projectId: string) => {
  const loaded = loadAdminProject(projectId);

  if (!loaded) return null;

  return {
    ...loaded.project,
    participants: loaded.participants,
    pendingParticipants: loaded.pendingParticipants,
    documents: loaded.documents.filter(
      (document) => document.state === "ACTIVE",
    ),
    tutors: loaded.tutors,
  };
};

const saveProject = async (
  projectId: string,
  data: Record<string, unknown>,
) => {
  const updated = db.project.update({
    where: { id: { equals: projectId } },
    data,
  });

  await persistDb("project");

  return updated;
};

const participantSnapshot = (
  participant: MockParticipant | MockPendingParticipant,
) =>
  "pendingId" in participant
    ? {
        type: "PENDING",
        pendingId: participant.pendingId,
        firstName: participant.firstName,
        lastName: participant.lastName,
        email: participant.email,
        studentCode: participant.studentCode,
        semester: participant.semester,
        career: participant.career,
      }
    : {
        type: "ENROLLED",
        userId: participant.userId,
        studentCode: participant.studentCode,
        email: participant.email,
        firstName: participant.firstName,
        lastName: participant.lastName,
      };

const INFO_FIELDS = [
  "name",
  "description",
  "projectCode",
  "eventNumber",
] as const;

type AdminUpdateBody = {
  name?: string | null;
  description?: string | null;
  projectCode?: string | null;
  eventNumber?: string | null;
  courseId?: number;
  reason?: string;
  force?: boolean;
};

type AdminAddParticipantBody = {
  firstName?: string;
  lastName?: string;
  email?: string;
  studentCode?: string;
  semester?: string;
  career?: string;
  reason?: string;
};

type TutorsBody = {
  userIds?: number[];
  pending?: Array<{ firstName: string; lastName?: string; email: string }>;
  reason?: string;
};

/** Spanish message of a removal that would leave the project without anyone */
const LAST_PARTICIPANT_MESSAGE =
  "No se puede quitar al único integrante del proyecto. Agrega otro integrante antes de quitar este.";

export const projectAdminHandlers = [
  http.get(`${env.API_URL}/projects/tutor-candidates`, async ({ request }) => {
    await networkDelay();
    const search = (new URL(request.url).searchParams.get("search") ?? "")
      .trim()
      .toLowerCase();

    if (search.replace(/\s/g, "").length < 3) {
      return badRequest("La búsqueda necesita al menos 3 letras");
    }
    const words = search.split(/\s+/);
    const users = db.user
      .getAll()
      .filter((user) => {
        const name =
          `${user.firstName ?? ""} ${user.lastName ?? ""}`.toLowerCase();

        return words.every((word) => name.includes(word));
      })
      .slice(0, 10)
      .map((user) => ({
        id: Number(user.id) || user.id,
        firstName: user.firstName,
        lastName: user.lastName,
      }));

    return HttpResponse.json(users);
  }),

  http.patch(
    `${env.API_URL}/projects/:projectId/admin`,
    async ({ cookies, request, params }) => {
      await networkDelay();
      const { error, user } = requireAuth(cookies);

      if (error) return unauthorized(error);

      const projectId = params.projectId as string;
      const loaded = loadAdminProject(projectId);

      if (!loaded) return notFound();
      const { project } = loaded;
      const body = (await request.json()) as AdminUpdateBody;

      const infoChanges: Record<string, string | null> = {};

      INFO_FIELDS.forEach((field) => {
        if (
          body[field] === undefined ||
          (field === "name" && body[field] === null)
        )
          return;
        const value =
          typeof body[field] === "string" ? body[field]!.trim() : "";

        if ((project[field] ?? "") !== value)
          infoChanges[field] = value || null;
      });
      if (infoChanges.name === null) {
        return badRequest("El nombre del proyecto no puede estar vacío");
      }
      const currentCourseId = String(
        project.courseId || project.categoryId || "",
      );
      const changesCategory =
        body.courseId !== undefined &&
        String(body.courseId) !== currentCourseId;

      if (Object.keys(infoChanges).length === 0 && !changesCategory) {
        return HttpResponse.json(project);
      }

      if (infoChanges.name) {
        const taken = db.project
          .getAll()
          .some(
            (other) =>
              other.id !== project.id &&
              other.eventId === project.eventId &&
              other.name?.trim().toLowerCase() ===
                infoChanges.name!.toLowerCase(),
          );

        if (taken) {
          return conflict(
            `Ya existe otro proyecto con el nombre "${infoChanges.name}" en este evento.`,
            "PROJECT_NAME_TAKEN",
            { name: infoChanges.name },
          );
        }
      }

      if (changesCategory) {
        const course = db.course.findFirst({
          where: { id: { equals: String(body.courseId) } },
        });

        if (
          course &&
          course.eventId &&
          String(course.eventId) !== String(project.eventId)
        ) {
          return badRequest(
            "La categoría no es una categoría activa del evento del proyecto",
          );
        }
        const evaluationCount = db.evaluation.count({
          where: { projectId: { equals: projectId } },
        });

        if (evaluationCount > 0 && !body.force) {
          return conflict(
            `No se cambió la categoría porque el proyecto ya tiene ${evaluationCount} evaluaciones de jurados, calificadas con las rúbricas de la categoría actual. Confirma el cambio para aplicarlo de todas formas.`,
            "PROJECT_CATEGORY_CHANGE_BLOCKED",
            { evaluationCount },
          );
        }
      }

      const before = Object.fromEntries(
        Object.keys(infoChanges).map((field) => [
          field,
          (project as any)[field] || null,
        ]),
      );
      const updated = await saveProject(projectId, {
        ...Object.fromEntries(
          Object.entries(infoChanges).map(([field, value]) => [
            field,
            value ?? "",
          ]),
        ),
        ...(changesCategory
          ? {
              courseId: String(body.courseId),
              categoryId: String(body.courseId),
            }
          : {}),
      });

      if (Object.keys(infoChanges).length > 0) {
        recordProjectChange(
          projectId,
          user,
          "INFO",
          before,
          infoChanges,
          body.reason,
        );
      }
      if (changesCategory) {
        recordProjectChange(
          projectId,
          user,
          "CATEGORY",
          { courseId: Number(currentCourseId) || null },
          { courseId: Number(body.courseId) },
          body.reason,
        );
      }

      return HttpResponse.json(updated);
    },
  ),

  http.post(
    `${env.API_URL}/projects/:projectId/admin/participants`,
    async ({ cookies, request, params }) => {
      await networkDelay();
      const { error, user } = requireAuth(cookies);

      if (error) return unauthorized(error);

      const projectId = params.projectId as string;
      const loaded = loadAdminProject(projectId);

      if (!loaded) return notFound();
      const body = (await request.json()) as AdminAddParticipantBody;

      const email = body.email?.trim().toLowerCase() ?? "";

      if (!body.firstName?.trim())
        return badRequest("El nombre del integrante es obligatorio");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return badRequest("El formato del correo no es válido");
      }
      if (!body.studentCode?.trim())
        return badRequest("El código de estudiante es obligatorio");
      if (!/^\d+$/.test(body.semester?.trim() ?? "")) {
        return badRequest("El semestre debe ser un número");
      }
      if (!body.career?.trim()) return badRequest("La carrera es obligatoria");

      const inProject = [
        ...loaded.participants,
        ...loaded.pendingParticipants,
      ].some((participant) => participant.email?.toLowerCase() === email);

      if (inProject) {
        return conflict(
          `El estudiante ${email} ya es integrante de este proyecto.`,
          "PARTICIPANT_ALREADY_IN_PROJECT",
          { email },
        );
      }
      const otherProject = db.project
        .getAll()
        .find(
          (other) =>
            other.id !== loaded.project.id &&
            other.eventId === loaded.project.eventId &&
            other.state !== "REJECTED" &&
            [
              ...((other.participants ?? []) as any[]),
              ...((other.pendingParticipants ?? []) as any[]),
            ].some(
              (participant) =>
                String(participant.email ?? "").toLowerCase() === email,
            ),
        );

      if (otherProject) {
        return conflict(
          `El estudiante ${email} ya participa en otro proyecto activo de este evento (proyecto ${otherProject.id}). Quítalo de ese proyecto antes de agregarlo aquí.`,
          "PARTICIPANT_HAS_ACTIVE_PROJECT",
          { email, projectId: Number(otherProject.id) || otherProject.id },
        );
      }

      const pendingParticipant: MockPendingParticipant = {
        pendingId:
          Math.max(0, ...loaded.pendingParticipants.map((p) => p.pendingId)) +
          1,
        projectId: Number(projectId) || 0,
        firstName: body.firstName.trim(),
        lastName: body.lastName?.trim() ?? "",
        email,
        studentCode: body.studentCode.trim(),
        semester: body.semester!.trim(),
        career: body.career.trim(),
        status: loaded.project.state === "APPROVED" ? "INVITED" : "PENDING",
      };

      await saveProject(projectId, {
        participants: loaded.participants,
        pendingParticipants: [
          ...loaded.pendingParticipants,
          pendingParticipant,
        ],
      });
      recordProjectChange(
        projectId,
        user,
        "PARTICIPANTS",
        { participant: null },
        { participant: participantSnapshot(pendingParticipant) },
        body.reason,
      );

      return HttpResponse.json(
        {
          participant: null,
          pendingParticipant,
          failedEffects: [],
          warning: null,
        },
        { status: 201 },
      );
    },
  ),

  // Declared before ":userId" so "pending" is not read as a user id
  http.delete(
    `${env.API_URL}/projects/:projectId/admin/participants/pending/:pendingId`,
    async ({ cookies, request, params }) => {
      await networkDelay();
      const { error, user } = requireAuth(cookies);

      if (error) return unauthorized(error);

      const projectId = params.projectId as string;
      const loaded = loadAdminProject(projectId);

      if (!loaded) return notFound();
      const removed = loaded.pendingParticipants.find(
        (participant) => participant.pendingId === Number(params.pendingId),
      );

      if (!removed) return notFound("Integrante pendiente no encontrado");
      if (removed.status === "JOINED") {
        return badRequest(
          "El integrante ya se unió al proyecto: quítalo como integrante inscrito",
        );
      }
      const remaining =
        loaded.participants.length +
        loaded.pendingParticipants.filter(
          (p) => p !== removed && p.status !== "JOINED",
        ).length;

      if (remaining === 0)
        return badRequest(LAST_PARTICIPANT_MESSAGE, "LAST_PARTICIPANT");

      await saveProject(projectId, {
        participants: loaded.participants,
        pendingParticipants: loaded.pendingParticipants.filter(
          (p) => p !== removed,
        ),
      });
      recordProjectChange(
        projectId,
        user,
        "PARTICIPANTS",
        { participant: participantSnapshot(removed) },
        { participant: null },
        new URL(request.url).searchParams.get("reason"),
      );

      return new HttpResponse(null, { status: 204 });
    },
  ),

  http.delete(
    `${env.API_URL}/projects/:projectId/admin/participants/:userId`,
    async ({ cookies, request, params }) => {
      await networkDelay();
      const { error, user } = requireAuth(cookies);

      if (error) return unauthorized(error);

      const projectId = params.projectId as string;
      const loaded = loadAdminProject(projectId);

      if (!loaded) return notFound();
      const removed = loaded.participants.find(
        (participant) => participant.userId === Number(params.userId),
      );

      if (!removed)
        return notFound("El usuario no es integrante inscrito del proyecto");

      const participants = loaded.participants.filter((p) => p !== removed);
      // Their pending row in the project goes too (same student code or email)
      const pendingParticipants = loaded.pendingParticipants.filter(
        (p) =>
          p.studentCode !== removed.studentCode &&
          p.email?.toLowerCase() !== removed.email?.toLowerCase(),
      );
      const remaining =
        participants.length +
        pendingParticipants.filter((p) => p.status !== "JOINED").length;

      if (remaining === 0)
        return badRequest(LAST_PARTICIPANT_MESSAGE, "LAST_PARTICIPANT");

      await saveProject(projectId, { participants, pendingParticipants });
      recordProjectChange(
        projectId,
        user,
        "PARTICIPANTS",
        { participant: participantSnapshot(removed) },
        { participant: null },
        new URL(request.url).searchParams.get("reason"),
      );

      return new HttpResponse(null, { status: 204 });
    },
  ),

  http.put(
    `${env.API_URL}/projects/:projectId/tutors`,
    async ({ cookies, request, params }) => {
      await networkDelay();
      const { error, user } = requireAuth(cookies);

      if (error) return unauthorized(error);

      const projectId = params.projectId as string;
      const loaded = loadAdminProject(projectId);

      if (!loaded) return notFound();
      const body = (await request.json()) as TutorsBody;

      const linked: MockTutor[] = (body.userIds ?? []).map((userId) => {
        const tutorUser = db.user.findFirst({
          where: { id: { equals: String(userId) } },
        });

        return {
          userId,
          firstName: tutorUser?.firstName ?? `Usuario ${userId}`,
          lastName: tutorUser?.lastName,
          pending: false,
        };
      });
      const pending: MockTutor[] = (body.pending ?? []).map((tutor) => ({
        firstName: tutor.firstName,
        lastName: tutor.lastName,
        email: tutor.email,
        pending: true,
      }));
      const tutors = [...linked, ...pending];

      const snapshot = (items: MockTutor[]) => ({
        tutorUserIds: items.filter((t) => !t.pending).map((t) => t.userId),
        pendingTutors: items
          .filter((t) => t.pending)
          .map(({ email, firstName, lastName }) => ({
            email,
            firstName,
            lastName,
          })),
      });
      const before: Record<string, unknown> = snapshot(loaded.tutors);
      const after: Record<string, unknown> = snapshot(tutors);

      // Like the backend, only the fields that changed are recorded
      for (const field of Object.keys(before)) {
        if (JSON.stringify(before[field]) === JSON.stringify(after[field])) {
          delete before[field];
          delete after[field];
        }
      }

      await saveProject(projectId, { tutors });
      if (Object.keys(after).length > 0) {
        recordProjectChange(
          projectId,
          user,
          "TUTORS",
          before,
          after,
          body.reason,
        );
      }

      return HttpResponse.json({ tutors });
    },
  ),

  http.get(
    `${env.API_URL}/projects/:projectId/admin/documents`,
    async ({ cookies, params }) => {
      await networkDelay();
      const { error } = requireAuth(cookies);

      if (error) return unauthorized(error);

      const loaded = loadAdminProject(params.projectId as string);

      if (!loaded) return notFound();

      return HttpResponse.json({ items: [...loaded.documents].reverse() });
    },
  ),

  http.put(
    `${env.API_URL}/projects/:projectId/admin/documents/:documentId`,
    async ({ cookies, request, params }) => {
      await networkDelay();
      const { error, user } = requireAuth(cookies);

      if (error) return unauthorized(error);

      const projectId = params.projectId as string;
      const loaded = loadAdminProject(projectId);

      if (!loaded) return notFound();
      const document = loaded.documents.find(
        (d) => d.id === Number(params.documentId),
      );

      if (!document) return notFound("El documento no es de este proyecto");

      const form = await request.formData();
      const file = form.get("file");

      if (!(file instanceof File)) {
        return badRequest(
          "Adjunta el archivo nuevo del documento en el campo file",
        );
      }
      if (file.size > 5 * 1024 * 1024)
        return badRequest("El archivo no puede superar 5 MB");

      const replaced: MockDocument = {
        ...document,
        url: `https://placehold.co/400x400?text=${encodeURIComponent(file.name)}&v=${Date.now()}`,
      };

      await saveProject(projectId, {
        documents: loaded.documents.map((d) => (d === document ? replaced : d)),
      });
      recordProjectChange(
        projectId,
        user,
        "DOCUMENTS",
        { document },
        { document: replaced },
        String(form.get("reason") ?? ""),
      );

      return HttpResponse.json(replaced);
    },
  ),

  http.patch(
    `${env.API_URL}/projects/:projectId/admin/documents/:documentId/state`,
    async ({ cookies, request, params }) => {
      await networkDelay();
      const { error, user } = requireAuth(cookies);

      if (error) return unauthorized(error);

      const projectId = params.projectId as string;
      const loaded = loadAdminProject(projectId);

      if (!loaded) return notFound();
      const document = loaded.documents.find(
        (d) => d.id === Number(params.documentId),
      );

      if (!document) return notFound("El documento no es de este proyecto");

      const { state, reason } = (await request.json()) as {
        state?: string;
        reason?: string;
      };

      if (state !== "ACTIVE" && state !== "INACTIVE") {
        return badRequest("El estado del documento debe ser ACTIVE o INACTIVE");
      }
      if (document.state === state) {
        return badRequest(
          state === "ACTIVE"
            ? "El documento ya está activo"
            : "El documento ya está inactivo",
        );
      }

      const changed: MockDocument = { ...document, state };

      await saveProject(projectId, {
        documents: loaded.documents.map((d) => (d === document ? changed : d)),
      });
      recordProjectChange(
        projectId,
        user,
        "DOCUMENTS",
        { document },
        { document: changed },
        reason,
      );

      return HttpResponse.json(changed);
    },
  ),
];
