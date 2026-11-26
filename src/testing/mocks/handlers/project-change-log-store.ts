export type MockChangeLogAction =
  | "STATE"
  | "INFO"
  | "CATEGORY"
  | "PARTICIPANTS"
  | "TUTORS"
  | "DOCUMENTS";

export type MockChangeLogEntry = {
  id: number;
  action: MockChangeLogAction;
  actor: { id: number; name: string | null };
  createdAt: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  reason: string | null;
};

// In memory only: the mock server forgets the change log when it restarts
export const projectChangeLog = new Map<string, MockChangeLogEntry[]>();
let nextChangeLogId = 1;

type MockActor =
  | { id?: unknown; firstName?: string; lastName?: string }
  | null
  | undefined;

/** Adds an entry at the top of the change log of the project (most recent first) */
export const recordProjectChange = (
  projectId: string,
  user: MockActor,
  action: MockChangeLogAction,
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  reason?: string | null,
) => {
  const entries = projectChangeLog.get(projectId) ?? [];

  entries.unshift({
    id: nextChangeLogId++,
    action,
    actor: {
      id: Number(user?.id) || 0,
      name: user
        ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || null
        : null,
    },
    createdAt: new Date().toISOString(),
    before,
    after,
    reason: reason?.trim() || null,
  });
  projectChangeLog.set(projectId, entries);
};
