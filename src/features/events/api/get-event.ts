import { useQuery, queryOptions } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import { QueryConfig } from "@/lib/react-query";
import { Event } from "@/types/api";
import { normalizeEvent } from "./event-adapter";

export const getEvent = async ({
  eventId,
}: {
  eventId: number;
}): Promise<{ data: Event }> => {
  const response = await api.get<Record<string, any>>(`/events/${eventId}`);
  const rawEvent =
    response?.event ??
    response?.data?.event ??
    response?.data?.data ??
    response?.data;

  return {
    data: normalizeEvent(rawEvent),
  };
};

export const getEventQueryOptions = (eventId: number) => {
  return queryOptions({
    queryKey: ["events", eventId],
    queryFn: () => getEvent({ eventId }),
  });
};

type UseEventOptions = {
  eventId: number;
  queryConfig?: QueryConfig<typeof getEventQueryOptions>;
};

export const useEvent = ({ eventId, queryConfig }: UseEventOptions) => {
  return useQuery({ 
    ...getEventQueryOptions(eventId), 
    enabled: !!eventId,
    ...queryConfig 
  });
};
