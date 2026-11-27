import { HttpResponse, http } from "msw";

import { networkDelay, requireAuth } from "../utils";

import { env } from "@/config/env";

/**
 * Admin creation of projects while the backend reaches dev:
 * POST /projects/admin and /events/:eventId/project-imports/{template,preview,execute}.
 * Shapes follow the gateway answers (Swagger of POST /projects/admin and of the
 * project-imports controller).
 */

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const MOCK_XLSX_BYTES = new Uint8Array([
  0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00,
]);

const canManageProjects = (user: any): boolean => {
  const perms: string[] = Array.isArray(user?.platformPermissions)
    ? user.platformPermissions
    : [];

  return perms.includes("manage:projects") || perms.includes("*");
};

const authorize = (cookies: Record<string, string>) => {
  const { user, error } = requireAuth(cookies);

  if (error || !user) {
    return HttpResponse.json({ message: "No autorizado" }, { status: 401 });
  }
  if (!canManageProjects(user)) {
    return HttpResponse.json(
      { message: "Forbidden resource" },
      { status: 403 },
    );
  }

  return null;
};

let nextProjectId = 9000;

const participants = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    email: `estudiante${index + 1}@unal.edu.co`,
    status: index === 0 ? "HAS_ACCOUNT" : "NO_ACCOUNT",
  }));

const buildPreview = () => ({
  rows: [
    {
      rowNumber: 2,
      outcome: "CREATE",
      message: "",
      projectName: "Robot clasificador de residuos",
      categoryName: "Ingeniería",
      state: "APPROVED",
      participants: participants(3),
    },
    {
      rowNumber: 3,
      outcome: "CREATE",
      message: "",
      projectName: "App de tutorías",
      categoryName: "Software",
      state: "UNDER_REVIEW",
      participants: participants(2),
    },
    {
      rowNumber: 4,
      outcome: "SKIP",
      message: "Ya existe un proyecto con ese nombre en el evento.",
      projectName: "Sistema de riego",
      categoryName: "Ingeniería",
      state: "APPROVED",
      participants: participants(2),
      projectId: 101,
    },
  ],
  totals: {
    rows: 3,
    toCreate: 2,
    skipped: 1,
    errors: 0,
    participants: 5,
    withoutAccount: 3,
  },
  eventWarnings: [
    "La fecha límite de inscripción ya pasó; no bloquea la carga.",
  ],
  canConfirm: true,
});

export const projectImportsHandlers = [
  http.post(`${env.API_URL}/projects/admin`, async ({ cookies, request }) => {
    await networkDelay();
    const denied = authorize(cookies);

    if (denied) return denied;

    const form = await request.formData();
    const name = String(form.get("name") ?? "").trim() || "Proyecto";
    const state = String(form.get("state") ?? "APPROVED");

    if (/duplicado/i.test(name)) {
      return HttpResponse.json(
        {
          statusCode: 409,
          code: "PROJECT_NAME_TAKEN",
          message: "Project name already exists in this event",
        },
        { status: 409 },
      );
    }

    const failedEffects =
      /falla/i.test(name) && form.getAll("files").length > 0
        ? ["DOCUMENTS"]
        : [];

    return HttpResponse.json(
      {
        project: {
          id: nextProjectId++,
          name,
          state,
          eventId: Number(form.get("eventId")),
        },
        participants: [],
        failedEffects,
        warning: failedEffects.length
          ? "El proyecto se creó, pero no se pudieron subir los documentos."
          : null,
      },
      { status: 201 },
    );
  }),

  http.get(
    `${env.API_URL}/events/:eventId/project-imports/template`,
    async ({ cookies, params }) => {
      await networkDelay();
      const denied = authorize(cookies);

      if (denied) return denied;

      return HttpResponse.arrayBuffer(MOCK_XLSX_BYTES.buffer, {
        status: 200,
        headers: {
          "Content-Type": XLSX_MIME,
          "Content-Disposition": `attachment; filename="plantilla_proyectos_evento_${String(params.eventId)}.xlsx"`,
        },
      });
    },
  ),

  http.post(
    `${env.API_URL}/events/:eventId/project-imports/preview`,
    async ({ cookies }) => {
      await networkDelay();
      const denied = authorize(cookies);

      if (denied) return denied;

      return HttpResponse.json(buildPreview());
    },
  ),

  http.post(
    `${env.API_URL}/events/:eventId/project-imports/execute`,
    async ({ cookies }) => {
      await networkDelay();
      const denied = authorize(cookies);

      if (denied) return denied;
      const preview = buildPreview();

      return HttpResponse.json({
        rows: preview.rows.map((row) =>
          row.outcome === "CREATE"
            ? { ...row, outcome: "CREATED", projectId: nextProjectId++ }
            : row,
        ),
        totals: {
          created: preview.totals.toCreate,
          skipped: preview.totals.skipped,
          errors: preview.totals.errors,
          emailsSent: 0,
          failedEffects: 0,
        },
      });
    },
  ),
];
