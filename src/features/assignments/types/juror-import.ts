export type JurorImportOutcome = "ASSIGN" | "SKIP" | "ERROR";

export type JurorImportUserStatus =
  | "ACTIVE"
  | "EXISTING"
  | "EVENT_MEMBER"
  | "NEW"
  | "NEW_USER"
  | "CREATED"
  | "PENDING"
  | "INVITED"
  | "INVITATION_PENDING"
  | "REUSED"
  | "WILL_INVITE"
  | string;

export interface JurorImportRow {
  rowNumber: number;
  jurorSlot: number | string;
  outcome: JurorImportOutcome;
  userStatus: JurorImportUserStatus;
  message: string;
  email: string;
  projectId: number | null;
  projectName: string | null;
  userId: number | null;
  /** Optional explicit warning flag if backend includes it alongside message */
  warning?: boolean;
  warnings?: string[];
}

export interface JurorImportTotals {
  rows: number;
  assigned: number;
  skipped: number;
  errors: number;
  warnings: number;
  jurors: number;
  invitationsSent: number;
  invitationsReused: number;
  newUsers: number;
}

export interface JurorImportPreviewResponse {
  rows: JurorImportRow[];
  totals: JurorImportTotals;
  canConfirm: boolean;
  warnings?: string[];
}

export interface JurorImportExecuteResponse {
  rows: JurorImportRow[];
  totals: JurorImportTotals;
}

export interface JurorImportExecutePreviewError {
  kind: "preview";
  message: string;
  preview: JurorImportPreviewResponse;
}

export interface JurorImportExecuteInvitedError {
  kind: "invitedJurors";
  message: string;
  invitedJurors: string[];
}

export interface JurorImportExecuteGenericError {
  kind: "generic";
  message: string;
}

export type JurorImportExecuteParsedError =
  | JurorImportExecutePreviewError
  | JurorImportExecuteInvitedError
  | JurorImportExecuteGenericError;

