import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';
import { Event } from '@/types/api';

export const getPublicEventDetail = async ({
  eventId,
}: {
  eventId: string;
}): Promise<{ data: Event }> => {
  const toFallbackEventId = (rawEventId: string) => {
    if (/^event-\d+$/i.test(rawEventId)) return rawEventId.toLowerCase();
    if (/^\d+$/.test(rawEventId)) return `event-${rawEventId.padStart(3, '0')}`;
    return rawEventId;
  };

  const fetchEvent = async (targetEventId: string) => {
    const response = await api.get<{ data?: Event; event?: Event }>(
      `/events/public/${targetEventId}`,
      { suppressErrorNotification: true },
    );

    const event = response.data ?? response.event;
    if (!event) {
      throw new Error('Evento no encontrado');
    }

    return {
      data: event,
    };
  };

  try {
    return await fetchEvent(eventId);
  } catch {
    const fallbackEventId = toFallbackEventId(eventId);
    if (fallbackEventId !== eventId) {
      try {
        return await fetchEvent(fallbackEventId);
      } catch {
        // Keep unified error message for UI.
      }
    }

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
