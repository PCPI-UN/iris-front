import { Event, Meta } from "@/types/api";
import { normalizeEvent } from "./event-adapter";

type AnyResponse = Record<string, any>;

const resolveEventsArray = (response: AnyResponse): unknown[] => {
  const candidates = [
    response?.events,
    response?.data?.events,
    response?.data?.data,
    response?.data,
    response?.items,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
};

const resolveMeta = (response: AnyResponse, fallbackTotal: number) => {
  const meta = response?.meta ?? response?.data?.meta ?? {};

  const page = meta?.currentPage ?? meta?.page ?? response?.page ?? response?.data?.page ?? 1;
  const total = meta?.total ?? response?.total ?? response?.data?.total ?? fallbackTotal;
  const totalPages =
    meta?.totalPages ??
    response?.totalPages ??
    response?.data?.totalPages ??
    (total > 0 ? Math.ceil(total / Math.max(meta?.itemsPerPage ?? response?.limit ?? 1, 1)) : 1);

  return {
    page,
    total,
    totalPages,
  };
};

export const normalizeEventsResponse = (
  response: AnyResponse,
): { data: Event[]; meta: Meta } => {
  const rawEvents = resolveEventsArray(response);
  const events = Array.isArray(rawEvents) ? rawEvents.map(normalizeEvent) : [];
  const meta = resolveMeta(response, events.length);

  return {
    data: events,
    meta,
  };
};
