import { HttpResponse, http } from "msw";

import { env } from "@/config/env";
import { db } from "../db";
import { networkDelay, requireAuth } from "../utils";

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** Minimal valid OOXML header bytes for mock template downloads */
const MOCK_XLSX_BYTES = new Uint8Array([
  0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00,
]);

const hasManageEventsPermission = (user: any): boolean => {
  const perms: string[] = Array.isArray(user?.platformPermissions)
    ? user.platformPermissions
    : [];
  return perms.includes("manage:events") || perms.includes("*");
};

const toInternalEventId = (raw: string): string =>
  /^\d+$/.test(raw) ? `event-${raw.padStart(3, "0")}` : raw;

const findEvent = (rawEventId: string) => {
  const internalId = toInternalEventId(rawEventId);
  return db.event.findFirst({
    where: {
      id: { equals: internalId },
    },
  });
};

const extractAndValidateExcelFromFormData = async (request: Request) => {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return {
      error: "El campo 'file' con el archivo Excel (.xlsx) es obligatorio.",
      file: null,
    };
  }

  if (!file.name.toLowerCase().endsWith(".xlsx") || file.size < 4) {
    return {
      error: "El archivo proporcionado no es un libro de Excel (.xlsx) válido.",
      file: null,
    };
  }

  const header = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  const isZip =
    header[0] === 0x50 &&
    header[1] === 0x4b &&
    header[2] === 0x03 &&
    header[3] === 0x04;

  if (!isZip) {
    return {
      error: "Firma binaria inválida: el archivo no corresponde a un .xlsx.",
      file: null,
    };
  }

  return { error: null, file };
};

const buildMockPreview = (eventId: number) => {
  const rows = [
    {
      rowNumber: 2,
      jurorSlot: 1,
      outcome: "ASSIGN",
      userStatus: "ACTIVE",
      message: "",
      email: "jurado.activo@uninorte.edu.co",
      projectId: 101,
      projectName: "Sistema de Detección Temprana",
      userId: 12,
    },
    {
      rowNumber: 2,
      jurorSlot: 2,
      outcome: "ASSIGN",
      userStatus: "NEW",
      message: "es tutor de este proyecto",
      email: "tutor.jurado@uninorte.edu.co",
      projectId: 101,
      projectName: "Sistema de Detección Temprana",
      userId: null,
    },
    {
      rowNumber: 3,
      jurorSlot: 1,
      outcome: "SKIP",
      userStatus: "ACTIVE",
      message: "El jurado ya estaba asignado a este proyecto.",
      email: "jurado.repetido@uninorte.edu.co",
      projectId: 102,
      projectName: "Optimizador Logístico Portuario",
      userId: 15,
    },
    {
      rowNumber: 4,
      jurorSlot: 1,
      outcome: "ASSIGN",
      userStatus: "PENDING",
      message: "Tiene invitación pendiente para este evento.",
      email: "jurado.pendiente@uninorte.edu.co",
      projectId: 103,
      projectName: `Proyecto Evento #${eventId}`,
      userId: 19,
    },
  ];

  return {
    rows,
    totals: {
      rows: rows.length,
      assigned: 3,
      skipped: 1,
      errors: 0,
      warnings: 1,
      jurors: 4,
      invitationsSent: 1,
      invitationsReused: 1,
      newUsers: 1,
    },
    canConfirm: true,
  };
};

export const jurorImportsHandlers = [
  http.get(
    `${env.API_URL}/events/:eventId/juror-imports/template`,
    async ({ cookies, params }) => {
      await networkDelay();
      const { user, error } = requireAuth(cookies);
      if (error || !user) {
        return HttpResponse.json(
          { message: error ?? "No autorizado" },
          { status: 401 },
        );
      }
      if (!hasManageEventsPermission(user)) {
        return HttpResponse.json(
          { message: "No tienes permiso para descargar la plantilla." },
          { status: 403 },
        );
      }

      const rawEventId = String(params.eventId ?? "");
      const event = findEvent(rawEventId);
      if (!event && !/^\d+$/.test(rawEventId)) {
        return HttpResponse.json(
          { message: "Evento no encontrado" },
          { status: 404 },
        );
      }

      return HttpResponse.arrayBuffer(MOCK_XLSX_BYTES.buffer, {
        status: 200,
        headers: {
          "Content-Type": XLSX_MIME,
          "Content-Disposition": `attachment; filename="plantilla_jurados_evento_${rawEventId}.xlsx"`,
        },
      });
    },
  ),

  http.post(
    `${env.API_URL}/events/:eventId/juror-imports/preview`,
    async ({ cookies, params, request }) => {
      await networkDelay();
      const { user, error } = requireAuth(cookies);
      if (error || !user) {
        return HttpResponse.json(
          { message: error ?? "No autorizado" },
          { status: 401 },
        );
      }
      if (!hasManageEventsPermission(user)) {
        return HttpResponse.json(
          { message: "No tienes permiso para previsualizar importaciones." },
          { status: 403 },
        );
      }

      const eventId = Number(params.eventId);
      if (!Number.isInteger(eventId) || eventId <= 0) {
        return HttpResponse.json(
          { message: "ID de evento inválido" },
          { status: 400 },
        );
      }

      const { error: fileError } = await extractAndValidateExcelFromFormData(request);
      if (fileError) {
        return HttpResponse.json({ message: fileError }, { status: 400 });
      }

      return HttpResponse.json(buildMockPreview(eventId), { status: 200 });
    },
  ),

  http.post(
    `${env.API_URL}/events/:eventId/juror-imports/execute`,
    async ({ cookies, params, request }) => {
      await networkDelay();
      const { user, error } = requireAuth(cookies);
      if (error || !user) {
        return HttpResponse.json(
          { message: error ?? "No autorizado" },
          { status: 401 },
        );
      }
      if (!hasManageEventsPermission(user)) {
        return HttpResponse.json(
          { message: "No tienes permiso para ejecutar importaciones." },
          { status: 403 },
        );
      }

      const eventId = Number(params.eventId);
      if (!Number.isInteger(eventId) || eventId <= 0) {
        return HttpResponse.json(
          { message: "ID de evento inválido" },
          { status: 400 },
        );
      }

      const { error: fileError } = await extractAndValidateExcelFromFormData(request);
      if (fileError) {
        return HttpResponse.json({ message: fileError }, { status: 400 });
      }

      const preview = buildMockPreview(eventId);
      const executedRows = preview.rows.map((row) => ({
        ...row,
        message:
          row.userStatus === "NEW"
            ? "Asignado y se envió invitación; debe aceptar la invitación para evaluar (aviso: es tutor de este proyecto)."
            : row.outcome === "SKIP"
              ? "Ya estaba asignado al proyecto."
              : "Asignado correctamente al proyecto.",
      }));

      return HttpResponse.json(
        {
          rows: executedRows,
          totals: preview.totals,
        },
        { status: 200 },
      );
    },
  ),
];

