import { ApiError } from "@/lib/api-client";

import type {
  JurorImportExecuteParsedError,
  JurorImportExecuteResponse,
  JurorImportOutcome,
  JurorImportPreviewResponse,
  JurorImportRow,
  JurorImportTotals,
} from "../types/juror-import";

import {
  formatBytes,
  MB,
  parseValidEventId,
  sanitizeDownloadFileName,
  sanitizeSpreadsheetCell,
  validateExcelFile as validateSharedExcelFile,
  validateExcelFileMeta as validateSharedExcelFileMeta,
  XLSX_MIME_TYPE,
} from "@/features/imports/utils/excel-file";

// The generic Excel helpers live in features/imports (shared with the project
// import); re-exported so the juror import keeps the same API and messages.
export {
  formatBytes,
  parseValidEventId,
  sanitizeDownloadFileName,
  sanitizeSpreadsheetCell,
  XLSX_MIME_TYPE,
};

export const MAX_JUROR_IMPORT_FILE_SIZE_BYTES = 10 * MB; // 10 MB

/** Synchronous checks for file extension, MIME type, and size bounds */
export function validateExcelFileMeta(file: File | null | undefined): string | null {
  return validateSharedExcelFileMeta(file, MAX_JUROR_IMPORT_FILE_SIZE_BYTES);
}

/** Verifies OOXML ZIP magic bytes (PK) so renamed HTML/scripts are rejected client-side */
export function validateExcelFile(file: File | null | undefined): Promise<string | null> {
  return validateSharedExcelFile(file, MAX_JUROR_IMPORT_FILE_SIZE_BYTES);
}

export function isRowWarning(row: Pick<JurorImportRow, "outcome" | "message" | "warning" | "warnings">): boolean {
  if (row.outcome === "ERROR") return false;
  if (row.warning === true) return true;
  if (Array.isArray(row.warnings) && row.warnings.length > 0) return true;
  const msg = String(row.message ?? "").trim();
  return msg.length > 0 && /tutor|aviso|advertencia/i.test(msg);
}

const normalizeOutcome = (raw: unknown): JurorImportOutcome => {
  const upper = String(raw ?? "").toUpperCase();
  if (upper === "ASSIGN" || upper === "SKIP" || upper === "ERROR") {
    return upper;
  }
  if (upper === "WARNING") {
    return "ASSIGN";
  }
  return "ERROR";
};

const normalizeRow = (raw: any, index: number): JurorImportRow => {
  const rawOutcome = String(raw?.outcome ?? "").toUpperCase();
  const warnings = Array.isArray(raw?.warnings)
    ? raw.warnings.map((w: unknown) => String(w))
    : undefined;

  return {
    rowNumber: Number.isFinite(Number(raw?.rowNumber)) ? Number(raw.rowNumber) : index + 1,
    jurorSlot: raw?.jurorSlot ?? "—",
    outcome: normalizeOutcome(rawOutcome),
    userStatus: String(raw?.userStatus ?? "UNKNOWN"),
    message: typeof raw?.message === "string" ? raw.message : "",
    email: typeof raw?.email === "string" ? raw.email : "",
    projectId:
      raw?.projectId !== null && raw?.projectId !== undefined && Number.isFinite(Number(raw.projectId))
        ? Number(raw.projectId)
        : null,
    projectName: typeof raw?.projectName === "string" ? raw.projectName : null,
    userId:
      raw?.userId !== null && raw?.userId !== undefined && Number.isFinite(Number(raw.userId))
        ? Number(raw.userId)
        : null,
    warning: Boolean(raw?.warning) || rawOutcome === "WARNING" || (warnings?.length ?? 0) > 0,
    warnings,
  };
};

const normalizeTotals = (rawTotals: any, rows: JurorImportRow[]): JurorImportTotals => {
  const countByOutcome = (target: JurorImportOutcome) =>
    rows.filter((r) => r.outcome === target).length;

  const uniqueEmails = new Set(
    rows.map((r) => r.email.trim().toLowerCase()).filter(Boolean),
  );

  const safeNum = (val: unknown, fallback: number) =>
    Number.isFinite(Number(val)) && Number(val) >= 0 ? Number(val) : fallback;

  const assigned = safeNum(
    rawTotals?.assigned ?? rawTotals?.toAssign,
    countByOutcome("ASSIGN"),
  );
  const skipped = safeNum(rawTotals?.skipped, countByOutcome("SKIP"));
  const errors = safeNum(rawTotals?.errors, countByOutcome("ERROR"));
  const warnings = safeNum(
    rawTotals?.warnings,
    rows.filter((r) => isRowWarning(r)).length,
  );

  return {
    rows: safeNum(rawTotals?.rows, rows.length),
    assigned,
    skipped,
    errors,
    warnings,
    jurors: safeNum(rawTotals?.jurors, uniqueEmails.size),
    invitationsSent: safeNum(
      rawTotals?.invitationsSent ?? rawTotals?.invitationsToSend,
      0,
    ),
    invitationsReused: safeNum(rawTotals?.invitationsReused, 0),
    newUsers: safeNum(rawTotals?.newUsers, 0),
  };
};

export function normalizePreviewResponse(raw: any): JurorImportPreviewResponse {
  const rawRows = Array.isArray(raw?.rows) ? raw.rows : [];
  const rows = rawRows.map(normalizeRow);
  const totals = normalizeTotals(raw?.totals, rows);
  const explicitCanConfirm =
    typeof raw?.canConfirm === "boolean"
      ? raw.canConfirm
      : typeof raw?.canExecute === "boolean"
        ? raw.canExecute
        : undefined;

  const canConfirm =
    explicitCanConfirm !== undefined
      ? explicitCanConfirm
      : totals.errors === 0 && totals.assigned > 0;

  return {
    rows,
    totals,
    canConfirm,
    warnings: Array.isArray(raw?.warnings)
      ? raw.warnings.map((w: unknown) => String(w))
      : undefined,
  };
}

export function normalizeExecuteResponse(raw: any): JurorImportExecuteResponse {
  const rawRows = Array.isArray(raw?.rows) ? raw.rows : [];
  const rows = rawRows.map(normalizeRow);
  const totals = normalizeTotals(raw?.totals, rows);

  return {
    rows,
    totals,
  };
}

export function parseExecuteError(error: unknown): JurorImportExecuteParsedError {
  if (error instanceof ApiError && error.status === 400 && error.data && typeof error.data === "object") {
    const body = error.data as Record<string, unknown>;
    const message =
      typeof body.message === "string" && body.message.trim()
        ? body.message
        : error.message;

    if (body.preview && typeof body.preview === "object") {
      return {
        kind: "preview",
        message,
        preview: normalizePreviewResponse(body.preview),
      };
    }

    if (Array.isArray(body.invitedJurors)) {
      return {
        kind: "invitedJurors",
        message,
        invitedJurors: body.invitedJurors
          .map((item) => String(item).trim())
          .filter(Boolean),
      };
    }

    return { kind: "generic", message };
  }

  if (error instanceof ApiError) {
    if (error.status === 403) {
      return {
        kind: "generic",
        message: "No tienes permiso (manage:events) para ejecutar importaciones de jurados en este evento.",
      };
    }
    if (error.status === 404) {
      return {
        kind: "generic",
        message: "No encontramos el evento seleccionado.",
      };
    }
    return {
      kind: "generic",
      message: error.message || "No se pudo completar la ejecución de la importación.",
    };
  }

  return {
    kind: "generic",
    message:
      error instanceof Error
        ? error.message
        : "Ocurrió un error inesperado al ejecutar la importación.",
  };
}

export function getPreviewErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      return "No tienes permiso (manage:events) para importar jurados en este evento.";
    }
    if (error.status === 404) {
      return "No encontramos el evento seleccionado.";
    }
    if (error.message) return error.message;
  }
  return error instanceof Error
    ? error.message
    : "No se pudo validar el archivo Excel. Verifica el formato e intenta de nuevo.";
}

export function getTemplateDownloadErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      return "No tienes permiso (manage:events) para descargar la plantilla de este evento.";
    }
    if (error.status === 404) {
      return "No encontramos el evento para generar la plantilla.";
    }
    if (error.message) return error.message;
  }
  return "No se pudo descargar la plantilla de jurados. Intenta de nuevo.";
}

const USER_STATUS_LABELS: Record<string, { label: string; color: "success" | "primary" | "warning" | "default" | "secondary" }> = {
  ACTIVE: { label: "Ya en evento", color: "success" },
  EXISTING: { label: "Usuario existente", color: "primary" },
  EVENT_MEMBER: { label: "Ya en evento", color: "success" },
  EXISTS: { label: "Usuario existente", color: "primary" },
  NEW: { label: "Usuario nuevo", color: "secondary" },
  NEW_USER: { label: "Usuario nuevo", color: "secondary" },
  CREATED: { label: "Usuario creado", color: "secondary" },
  PENDING: { label: "Invitación pendiente", color: "warning" },
  INVITED: { label: "Invitado", color: "warning" },
  INVITATION_PENDING: { label: "Invitación pendiente", color: "warning" },
  WILL_INVITE: { label: "Se invitará", color: "warning" },
  REUSED: { label: "Invitación reutilizada", color: "warning" },
  UNKNOWN: { label: "Sin identificar", color: "default" },
};

export function getUserStatusMeta(status: string): {
  label: string;
  color: "success" | "primary" | "warning" | "default" | "secondary";
} {
  const key = String(status ?? "").trim().toUpperCase();
  if (USER_STATUS_LABELS[key]) {
    return USER_STATUS_LABELS[key];
  }
  return {
    label: status || "—",
    color: "default",
  };
}

export function getOutcomeMeta(
  row: Pick<JurorImportRow, "outcome" | "message" | "warning" | "warnings">,
  mode: "preview" | "execute",
): {
  label: string;
  color: "success" | "warning" | "danger" | "default";
} {
  if (row.outcome === "ERROR") {
    return {
      label: mode === "preview" ? "Error" : "Error (no asignado)",
      color: "danger",
    };
  }
  if (row.outcome === "SKIP") {
    return {
      label: mode === "preview" ? "Ya asignado (omitido)" : "Omitido",
      color: "default",
    };
  }
  if (isRowWarning(row)) {
    return {
      label: mode === "preview" ? "Se asignará (con aviso)" : "Asignado (con aviso)",
      color: "warning",
    };
  }
  return {
    label: mode === "preview" ? "Se asignará" : "Asignado",
    color: "success",
  };
}

export function buildSummaryCsv(
  rows: JurorImportRow[],
  mode: "preview" | "execute",
): string {
  const headers = [
    "Fila",
    "ID Proyecto",
    "Proyecto",
    "Ranura Jurado",
    "Correo electrónico",
    "Estado de usuario",
    "Resultado",
    "Mensaje",
  ];
  const lines = [
    headers.map(sanitizeSpreadsheetCell).join(","),
    ...rows.map((row) =>
      [
        row.rowNumber,
        row.projectId ?? "",
        row.projectName ?? "",
        row.jurorSlot,
        row.email,
        getUserStatusMeta(row.userStatus).label,
        getOutcomeMeta(row, mode).label,
        row.message,
      ]
        .map(sanitizeSpreadsheetCell)
        .join(","),
    ),
  ];
  // UTF-8 BOM so Excel opens Spanish accents properly
  return `\uFEFF${lines.join("\r\n")}`;
}
