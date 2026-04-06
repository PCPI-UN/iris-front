import { Event } from "@/types/api";

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const normalizeEventId = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) {
      return numeric;
    }

    // Support mock IDs like "event-001" while keeping numeric ID contract in UI.
    const match = value.match(/(\d+)$/);
    if (match) {
      return Number(match[1]);
    }
  }

  return 0;
};

const normalizeTimestamp = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return Date.now();
};

const normalizeEventDate = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }

  const normalized = value.trim();

  if (!normalized) {
    return "";
  }

  const dateOnly = normalized.slice(0, 10);
  if (DATE_ONLY_PATTERN.test(dateOnly)) {
    return dateOnly;
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return normalized;
  }

  const pad = (segment: number) => String(segment).padStart(2, "0");

  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`;
};

export const normalizeEvent = (raw: any): Event => {
  const evaluationsOpened =
    typeof raw?.evaluationsOpened === "boolean"
      ? raw.evaluationsOpened
      : raw?.evaluationsStatus === "open";

  const roleName =
    raw?.role?.name === "Juror" || raw?.userEventRole === "JURY" || raw?.eventRole === "JURY"
      ? "Juror"
      : raw?.role?.name === "Participant" || raw?.userEventRole === "Participant" || raw?.eventRole === "Participant"
        ? "Participant"
        : undefined;

  const active = typeof raw?.active === "boolean" ? raw.active : raw?.status === 1;
  const inscriptionCost =
    typeof raw?.inscriptionCost === "number"
      ? raw.inscriptionCost
      : typeof raw?.cost === "number"
        ? raw.cost
        : undefined;
  const locationDetails = raw?.locationDetails ?? raw?.locationDetail;
  const organizers = raw?.organizers ?? raw?.organizations ?? [];
  const collaborators = raw?.collaborators ?? [];
  const awards = raw?.awards ?? [];
  const categories = raw?.categories ?? [];
  const role = roleName
    ? {
        ...(typeof raw?.role === "object" && raw?.role !== null ? raw.role : {}),
        name: roleName,
      }
    : undefined;

  return {
    id: normalizeEventId(raw?.id),
    name: raw?.name ?? "",
    description: raw?.description ?? "",
    startDate: normalizeEventDate(raw?.startDate),
    endDate: normalizeEventDate(raw?.endDate),
    inscriptionDeadline: normalizeEventDate(raw?.inscriptionDeadline),
    accessCode: raw?.accessCode ?? "",
    isPubliclyJoinable:
      typeof raw?.isPubliclyJoinable === "boolean"
        ? raw.isPubliclyJoinable
        : Boolean(raw?.isPublic),
    evaluationsOpened,
    statusName: raw?.statusName ?? (active ? "ACTIVE" : "INACTIVE"),
    location: raw?.location,
    locationDetails,
    eventType: raw?.eventType,
    inscriptionCost,
    inscriptionRequirements: raw?.inscriptionRequirements,
    aboutOurAllies: raw?.aboutOurAllies,
    evaluationType: raw?.evaluationType,
    minimumTeamSize: raw?.minimumTeamSize,
    specificInscriptionDetails: raw?.specificInscriptionDetails,
    categories,
    organizers,
    collaborators,
    awards,
    status: raw?.status,
    active,
    role,
    createdAt: normalizeTimestamp(raw?.createdAt),
    updatedAt: normalizeTimestamp(raw?.updatedAt ?? raw?.createdAt),
  } as Event;
};