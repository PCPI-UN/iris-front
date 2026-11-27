/**
 * Bulk upload of projects from Excel (manage:projects):
 * GET  /events/:eventId/project-imports/template
 * POST /events/:eventId/project-imports/preview  -> rows CREATE | SKIP | ERROR
 * POST /events/:eventId/project-imports/execute  -> rows CREATED | SKIP | ERROR
 */
export type ProjectImportOutcome = "CREATE" | "CREATED" | "SKIP" | "ERROR";

export interface ProjectImportRow {
  rowNumber: number;
  outcome: ProjectImportOutcome;
  /** Why the row is skipped or fails, in Spanish; empty when there is nothing to say */
  messages: string[];
  projectName: string;
  categoryName: string | null;
  /** Initial state asked in the row: APPROVED or UNDER_REVIEW */
  state: string | null;
  participantsCount: number;
  /** Id of the created project (execute) or of the existing one (SKIP) */
  projectId: number | null;
  /** Effects that failed after creating the row's project */
  failedEffects: string[];
}

export interface ProjectImportTotals {
  rows: number;
  /** CREATE in the preview, CREATED in the execute */
  created: number;
  skipped: number;
  errors: number;
}

export interface ProjectImportPreviewResponse {
  rows: ProjectImportRow[];
  totals: ProjectImportTotals;
  canConfirm: boolean;
  /** Warnings of the event (inactive, results published, deadline passed...) */
  warnings: string[];
}

export interface ProjectImportExecuteResponse {
  rows: ProjectImportRow[];
  totals: ProjectImportTotals;
}

export type ProjectImportExecuteParsedError =
  | { kind: "preview"; message: string; preview: ProjectImportPreviewResponse }
  | { kind: "generic"; message: string };
