import { queryOptions, useQuery } from "@tanstack/react-query";

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';
import { Event } from '@/types/api';
import { normalizeEvent } from './event-adapter';

export const getPublicPastEventDetail = async ({
  eventId,
}: {
  eventId: number;
}): Promise<{ data: Event }> => {
  const response = await api.get<{ data?: Event; event?: Event }>(
    `/events/public/past/${eventId}`,
    { suppressErrorNotification: true },
  );

  const event =
    response.event ??
    (response.data as any)?.event ??
    (response.data as any)?.data ??
    response.data;

  if (!event) {
    throw new Error("Evento pasado no encontrado");
  }

  return {
    data: normalizeEvent(event),
  };
};

export const getPublicPastEventDetailQueryOptions = (eventId: number) => {
  return queryOptions({
    queryKey: ["public-past-event-detail", eventId],
    queryFn: () => getPublicPastEventDetail({ eventId }),
  });
};

type UsePublicPastEventDetailOptions = {
  eventId: number;
  queryConfig?: QueryConfig<typeof getPublicPastEventDetailQueryOptions>;
};

export const usePublicPastEventDetail = ({
  eventId,
  queryConfig,
}: UsePublicPastEventDetailOptions) => {
  return useQuery({
    ...getPublicPastEventDetailQueryOptions(eventId),
    ...queryConfig,
  });
};
