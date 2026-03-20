import { Event, Meta } from "@/types/api";

type AnyResponse = Record<string, any>;

const toEvent = (raw: any): Event => {
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
    evaluationsStatus: raw?.evaluationsStatus ?? (evaluationsOpened ? "open" : "closed"),
  } as Event;
};

export const normalizeEventsResponse = (
  response: AnyResponse,
): { data: Event[]; meta: Meta } => {
  const rawEvents = response?.events ?? response?.data ?? [];
  const events = Array.isArray(rawEvents) ? rawEvents.map(toEvent) : [];

  const page = response?.meta?.currentPage ?? response?.meta?.page ?? response?.page ?? 1;
  const total = response?.meta?.total ?? response?.total ?? events.length;
  const totalPages = response?.meta?.totalPages ?? response?.totalPages ?? 1;

  return {
    data: events,
    meta: {
      page,
      total,
      totalPages,
    },
  };
};
