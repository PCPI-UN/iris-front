import { Event } from "@/types/api";

const normalizeRoleName = (
  value?: string
): "Juror" | "Participant" | undefined => {
  if (!value) return undefined;
  const normalized = value.toLowerCase();
  if (normalized === "juror" || normalized === "jury") return "Juror";
  if (normalized === "participant" || normalized === "student") {
    return "Participant";
  }
  return undefined;
};

export const normalizeEvent = (raw: any): Event => {
  const evaluationsOpened =
    typeof raw?.evaluationsOpened === "boolean"
      ? raw.evaluationsOpened
      : raw?.evaluationsStatus === "open";

  const roleName = normalizeRoleName(
    raw?.role?.name ?? raw?.userEventRole ?? raw?.eventRole
  );

  return {
    ...raw,
    name: raw?.name ?? raw?.title ?? "",
    title: raw?.title ?? raw?.name ?? "",
    eventType:
      raw?.eventType === "Expo" || raw?.eventType === "Competencia"
        ? raw.eventType
        : raw?.eventType === "Exhibition"
          ? "Expo"
          : raw?.eventType === "Competition"
            ? "Competencia"
            : raw?.eventType,
    isPubliclyJoinable:
      typeof raw?.isPubliclyJoinable === "boolean"
        ? raw.isPubliclyJoinable
        : Boolean(raw?.isPublic),
    locationDetails: raw?.locationDetails ?? raw?.locationDetail,
    locationDetail: raw?.locationDetail ?? raw?.locationDetails,
    inscriptionCost:
      typeof raw?.inscriptionCost === "number" ? raw.inscriptionCost : raw?.cost,
    cost: typeof raw?.cost === "number" ? raw.cost : raw?.inscriptionCost,
    organizers: raw?.organizers ?? raw?.organizations ?? [],
    organizations: raw?.organizations ?? raw?.organizers ?? [],
    isPublic:
      typeof raw?.isPublic === "boolean"
        ? raw.isPublic
        : Boolean(raw?.isPubliclyJoinable),
    evaluationsOpened,
    evaluationsStatus:
      raw?.evaluationsStatus ?? (evaluationsOpened ? "open" : "closed"),
    role: roleName
      ? {
          ...(raw?.role ?? {}),
          name: roleName,
        }
      : raw?.role,
  } as Event;
};