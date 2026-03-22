import { Event } from "@/types/api";

export const normalizeEvent = (raw: any): Event => {
  const evaluationsOpened =
    typeof raw?.evaluationsOpened === "boolean"
      ? raw.evaluationsOpened
      : raw?.evaluationsStatus === "open";

  return {
    ...raw,
    name: raw?.name ?? raw?.title ?? "",
    title: raw?.title ?? raw?.name ?? "",
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
  } as Event;
};