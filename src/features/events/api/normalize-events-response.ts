import { Event, Meta } from "@/types/api";
import { normalizeEvent } from "./event-adapter";

type AnyResponse = Record<string, any>;

export const normalizeEventsResponse = (
  response: AnyResponse,
): { data: Event[]; meta: Meta } => {
  const rawEvents = response?.events ?? response?.data ?? [];
  const events = Array.isArray(rawEvents) ? rawEvents.map(normalizeEvent) : [];

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
