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
    evaluationType:
      raw?.evaluationType === "0-5" || raw?.evaluationType === "0-100"
        ? raw.evaluationType
        : raw?.evaluationSystem === "0-5" || raw?.evaluationSystem === "0-100"
          ? raw.evaluationSystem
          : undefined,
    isPubliclyJoinable:
      typeof raw?.isPubliclyJoinable === "boolean"
        ? raw.isPubliclyJoinable
        : Boolean(raw?.isPublic),
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