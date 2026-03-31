import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';
import { Event } from '@/types/api';

export const getPublicEventDetail = async ({
  eventId,
}: {
  eventId: string;
}): Promise<{ data: Event }> => {
  try {
    const response = await api.get<{ data?: Event; event?: Event }>(
      `/events/public/${eventId}`,
      { suppressErrorNotification: true },
    );

    const event = response.data ?? response.event;
    if (!event) {
      throw new Error('Evento no encontrado');
    }

    return {
      data: event,
    };
  } catch {
    throw new Error('Evento no encontrado');
  }
};

export const getPublicEventDetailQueryOptions = (eventId: string) => {
  return queryOptions({
    queryKey: ['public-event-detail', eventId],
    queryFn: () => getPublicEventDetail({ eventId }),
  });
};

type UsePublicEventDetailOptions = {
  eventId: string;
  queryConfig?: QueryConfig<typeof getPublicEventDetailQueryOptions>;
};

export const usePublicEventDetail = ({
  eventId,
  queryConfig,
}: UsePublicEventDetailOptions) => {
  return useQuery({
    ...getPublicEventDetailQueryOptions(eventId),
    ...queryConfig,
  });
};
