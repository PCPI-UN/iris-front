import type {
  ProjectImportExecuteParsedError,
  ProjectImportExecuteResponse,
  ProjectImportOutcome,
  ProjectImportPreviewResponse,
  ProjectImportRow,
  ProjectImportTotals,
} from "../types/project-import";

import { MB } from "@/features/imports/utils/excel-file";
import { ApiError } from "@/lib/api-client";

export const MAX_PROJECT_IMPORT_FILE_SIZE_BYTES = 2 * MB;
export const MAX_PROJECT_IMPORT_ROWS = 500;

const toText = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const toId = (value: unknown): number | null =>
  value !== null && value !== undefined && Number.isFinite(Number(value))
    ? Number(value)
    : null;

const toStrings = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean)
    : [];

const normalizeOutcome = (value: unknown): ProjectImportOutcome => {
  const outcome = String(value ?? "");

  if (outcome === "CREATE" || outcome === "CREATED" || outcome === "SKIP") {
    return outcome;
  }

  return "ERROR";
};

/** One row of the preview or the execute as the gateway answers it */
const normalizeRow = (raw: any): ProjectImportRow => {
  const message = toText(raw?.message);

  return {
    rowNumber: Number(raw?.rowNumber),
    outcome: normalizeOutcome(raw?.outcome),
    messages: message ? [message] : [],
    projectName: toText(raw?.projectName) ?? "",
    categoryName: toText(raw?.categoryName),
    state: toText(raw?.state),
    participantsCount: Array.isArray(raw?.participants)
      ? raw.participants.length
      : 0,
    projectId: toId(raw?.projectId),
    failedEffects: toStrings(raw?.failedEffects),
  };
};

/** The preview counts the rows to create in toCreate; the execute, the created ones in created */
const normalizeTotals = (
  rawTotals: any,
  rows: ProjectImportRow[],
): ProjectImportTotals => {
  const safeNum = (value: unknown, fallback: number) =>
    Number.isFinite(Number(value)) && Number(value) >= 0
      ? Number(value)
      : fallback;
  const count = (...outcomes: ProjectImportOutcome[]) =>
    rows.filter((row) => outcomes.includes(row.outcome)).length;

  return {
    rows: safeNum(rawTotals?.rows, rows.length),
    created: safeNum(
      rawTotals?.created ?? rawTotals?.toCreate,
      count("CREATE", "CREATED"),
    ),
    skipped: safeNum(rawTotals?.skipped, count("SKIP")),
    errors: safeNum(rawTotals?.errors, count("ERROR")),
  };
};

export function normalizeProjectImportPreview(
  raw: any,
): ProjectImportPreviewResponse {
  const rows = (Array.isArray(raw?.rows) ? raw.rows : []).map(normalizeRow);

  return {
    rows,
    totals: normalizeTotals(raw?.totals, rows),
    canConfirm: raw?.canConfirm === true,
    warnings: toStrings(raw?.eventWarnings),
  };
}

export function normalizeProjectImportExecute(
  raw: any,
): ProjectImportExecuteResponse {
  const rows = (Array.isArray(raw?.rows) ? raw.rows : []).map(normalizeRow);

  return { rows, totals: normalizeTotals(raw?.totals, rows) };
}

const PERMISSION_MESSAGE =
  "No tienes permiso (manage:projects) para cargar proyectos en este evento.";

export function getProjectImportErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 403) return PERMISSION_MESSAGE;
    if (error.status === 404) return "No encontramos el evento seleccionado.";
    if (error.status === 413) {
      return "El archivo supera el tamaño máximo permitido de 2 MB.";
    }
    if (error.message) return error.message;
  }
  if (error instanceof Error && error.message) return error.message;

  return "No se pudo procesar el archivo. Intenta de nuevo.";
}

/** execute answers 400 with the preview in details.preview when the file can no longer be confirmed */
export function parseProjectImportExecuteError(
  error: unknown,
): ProjectImportExecuteParsedError {
  if (
    error instanceof ApiError &&
    error.status === 400 &&
    error.data &&
    typeof error.data === "object"
  ) {
    const body = error.data as Record<string, unknown>;
    const message = toText(body.message) ?? error.message;
    const details =
      body.details && typeof body.details === "object"
        ? (body.details as Record<string, unknown>)
        : undefined;

    if (details?.preview && typeof details.preview === "object") {
      return {
        kind: "preview",
        message,
        preview: normalizeProjectImportPreview(details.preview),
      };
    }

    return { kind: "generic", message };
  }

  return { kind: "generic", message: getProjectImportErrorMessage(error) };
}

export const OUTCOME_META: Record<
  ProjectImportOutcome,
  { label: string; color: "success" | "default" | "danger" | "primary" }
> = {
  CREATE: { label: "Se creará", color: "primary" },
  CREATED: { label: "Creado", color: "success" },
  SKIP: { label: "Omitido", color: "default" },
  ERROR: { label: "Error", color: "danger" },
};
