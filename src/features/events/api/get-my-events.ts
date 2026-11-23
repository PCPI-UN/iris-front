import { queryOptions, useQuery } from "@tanstack/react-query";

import { normalizeEventsResponse } from "./normalize-events-response";

import { api } from "@/lib/api-client";
import { QueryConfig } from "@/lib/react-query";
import { Meta, Event } from "@/types/api";

/** Largest page GET /events/my-events accepts */
export const MY_EVENTS_MAX_LIMIT = 50;

export const getMyEvents = async (
  { page, limit }: { page?: number; limit?: number } = { page: 1 },
): Promise<{ data: Event[]; meta: Meta }> => {
  const response = await api.get<Record<string, any>>(`/events/my-events`, {
    params: { page, limit },
  });

  return normalizeEventsResponse(response);
};

export const getMyEventsQueryOptions = ({
  page = 1,
  limit,
}: { page?: number; limit?: number } = {}) => {
  return queryOptions({
    queryKey: ["events", "my-events", { page, limit }],
    queryFn: () => getMyEvents({ page, limit }),
  });
};

type UseMyEventsOptions = {
  page?: number;
  limit?: number;
  queryConfig?: QueryConfig<typeof getMyEventsQueryOptions>;
};

export const useMyEvents = ({
  queryConfig,
  page,
  limit,
}: UseMyEventsOptions) => {
  return useQuery({
    ...getMyEventsQueryOptions({ page, limit }),
    ...queryConfig,
  });
};

/**
 * The session's membership in one event (with its role), or null when the user
 * has no role in it. There is no endpoint for a single event, so it walks the
 * pages of GET /events/my-events until it finds it.
 */
export const findMyEvent = async (eventId: string): Promise<Event | null> => {
  let page = 1;
  let totalPages = 1;

  do {
    const { data, meta } = await getMyEvents({
      page,
      limit: MY_EVENTS_MAX_LIMIT,
    });
    const event = data.find((item) => String(item.id) === eventId);

    if (event) return event;
    totalPages = meta?.totalPages ?? 1;
    page += 1;
  } while (page <= totalPages);

  return null;
};

export const useMyEvent = (eventId: string) => {
  return useQuery({
    queryKey: ["events", "my-events", "event", eventId],
    queryFn: () => findMyEvent(eventId),
  });
};
