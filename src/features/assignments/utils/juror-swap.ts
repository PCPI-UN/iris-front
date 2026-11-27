import type { EventJuror } from "@/features/juries/api/get-event-juries";

export type ProjectJurorRecord = {
  id?: string | number;
  firstName?: string;
  lastName?: string;
  email?: string;
  memberUserId?: string;
  memberEventId?: string;
};

export type AssignedJuror = ProjectJurorRecord & {
  key: string;
  memberUserId: string;
  evaluated: boolean;
};

const normalizeText = (value: unknown): string =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export const formatJurorName = (juror: {
  firstName?: string;
  lastName?: string;
  email?: string;
}): string => {
  const fullName = `${juror.firstName ?? ""} ${juror.lastName ?? ""}`.trim();
  return fullName || juror.email || "Jurado sin nombre";
};

/**
 * Returns event jurors who are not currently assigned to the project,
 * filtered by search query and ordered by lowest workload first.
 */
export const getAvailableReplacementJurors = (
  eventJurors: EventJuror[],
  assignedJurors: Pick<AssignedJuror, "id" | "memberUserId" | "email">[],
  searchTerm = "",
): EventJuror[] => {
  const assignedIds = new Set<string>();
  const assignedEmails = new Set<string>();

  assignedJurors.forEach((juror) => {
    if (juror.id !== undefined && juror.id !== null && String(juror.id).trim()) {
      assignedIds.add(String(juror.id).trim());
    }
    if (juror.memberUserId && String(juror.memberUserId).trim()) {
      assignedIds.add(String(juror.memberUserId).trim());
    }
    if (juror.email && juror.email.trim()) {
      assignedEmails.add(juror.email.trim().toLowerCase());
    }
  });

  const normalizedQuery = normalizeText(searchTerm);

  return eventJurors
    .filter((candidate) => {
      const candidateId = String(candidate.id ?? "").trim();
      const candidateEmail = String(candidate.email ?? "").trim().toLowerCase();

      if (candidateId && assignedIds.has(candidateId)) return false;
      if (candidateEmail && assignedEmails.has(candidateEmail)) return false;

      if (!normalizedQuery) return true;

      const haystack = normalizeText(
        `${candidate.firstName ?? ""} ${candidate.lastName ?? ""} ${candidate.email ?? ""}`,
      );
      return haystack.includes(normalizedQuery);
    })
    .sort((left, right) => {
      const loadDiff =
        (left.assignedProjects?.length ?? 0) -
        (right.assignedProjects?.length ?? 0);
      if (loadDiff !== 0) return loadDiff;

      return formatJurorName(left).localeCompare(formatJurorName(right), "es");
    });
};

/**
 * Replaces a swapped juror in a project's local juror list so the panel
 * reflects the change immediately while React Query refetches.
 */
export const applyLocalJurorSwap = (
  currentJurors: ProjectJurorRecord[],
  fromUserId: string,
  replacement: EventJuror,
): ProjectJurorRecord[] => {
  const targetId = String(fromUserId).trim();
  const replacementRecord: ProjectJurorRecord = {
    id: replacement.id,
    memberUserId: String(replacement.id),
    firstName: replacement.firstName,
    lastName: replacement.lastName,
    email: replacement.email,
  };

  let replaced = false;
  const next = currentJurors.map((juror) => {
    const jurorId = String(juror.memberUserId ?? juror.id ?? "").trim();
    if (!replaced && jurorId === targetId) {
      replaced = true;
      return replacementRecord;
    }
    return juror;
  });

  return replaced ? next : [...next, replacementRecord];
};

