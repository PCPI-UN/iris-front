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
    ? value
        .map((item) =>
          typeof item === "string" ? item : (item?.message ?? String(item)),
        )
        .map((item: string) => item.trim())
        .filter(Boolean)
    : [];

const normalizeOutcome = (value: unknown): ProjectImportOutcome => {
  const outcome = String(value ?? "").toUpperCase();

  if (outcome === "CREATE" || outcome === "CREATED" || outcome === "SKIP") {
    return outcome;
  }

  return "ERROR";
};

const countOf = (value: unknown): number => {
  if (Array.isArray(value)) return value.length;
  const num = Number(value);

  return Number.isFinite(num) && num >= 0 ? num : 0;
};

const normalizeRow = (raw: any, index: number): ProjectImportRow => {
  const project = raw?.project ?? {};
  const messages = [
    ...(toText(raw?.message) ? [toText(raw?.message) as string] : []),
    ...toStrings(raw?.messages),
    ...toStrings(raw?.errors),
    ...toStrings(raw?.warnings),
  ];

  return {
    rowNumber: Number.isFinite(Number(raw?.rowNumber))
      ? Number(raw.rowNumber)
      : index + 1,
    outcome: normalizeOutcome(raw?.outcome ?? raw?.action ?? raw?.status),
    messages: Array.from(new Set(messages)),
    projectName:
      toText(raw?.projectName) ??
      toText(raw?.name) ??
      toText(project?.name) ??
      "",
    categoryName:
      toText(raw?.categoryName) ??
      toText(raw?.category?.name) ??
      toText(raw?.category),
    nrc: toText(raw?.nrc) ?? (raw?.nrc != null ? String(raw.nrc) : null),
    state: toText(raw?.state) ?? toText(project?.state),
    participantsCount: countOf(raw?.participantsCount ?? raw?.participants),
    tutorsCount: countOf(raw?.tutorsCount ?? raw?.tutors),
    projectId: toId(raw?.projectId ?? project?.id),
    failedEffects: toStrings(raw?.failedEffects),
  };
};

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
    rows: safeNum(rawTotals?.rows ?? rawTotals?.total, rows.length),
    created: safeNum(
      rawTotals?.created ?? rawTotals?.create ?? rawTotals?.toCreate,
      count("CREATE", "CREATED"),
    ),
    skipped: safeNum(rawTotals?.skipped ?? rawTotals?.skip, count("SKIP")),
    errors: safeNum(rawTotals?.errors ?? rawTotals?.error, count("ERROR")),
  };
};

export function normalizeProjectImportPreview(
  raw: any,
): ProjectImportPreviewResponse {
  const rows = (Array.isArray(raw?.rows) ? raw.rows : []).map(normalizeRow);
  const totals = normalizeTotals(raw?.totals, rows);

  return {
    rows,
    totals,
    canConfirm:
      typeof raw?.canConfirm === "boolean"
        ? raw.canConfirm
        : totals.errors === 0 && totals.created > 0,
    warnings: toStrings(raw?.warnings ?? raw?.eventWarnings),
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

/** execute answers 400 with the preview when the file can no longer be confirmed */
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

    if (body.preview && typeof body.preview === "object") {
      return {
        kind: "preview",
        message,
        preview: normalizeProjectImportPreview(body.preview),
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
