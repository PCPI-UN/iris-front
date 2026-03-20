import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

export type PublicEventDetail = {
  id: string;
  name: string;
  description: string;
  organization: string;
  participants: string[];
  inscriptionDeadline: string;
  awardsInfo: string;
  startDate?: string;
  endDate?: string;
};

const toParticipants = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((participant) => {
      if (typeof participant === 'string') {
        return participant;
      }

      if (
        participant &&
        typeof participant === 'object' &&
        'firstName' in participant &&
        'lastName' in participant
      ) {
        const firstName = String((participant as { firstName: unknown }).firstName ?? '');
        const lastName = String((participant as { lastName: unknown }).lastName ?? '');
        return `${firstName} ${lastName}`.trim();
      }

      if (participant && typeof participant === 'object' && 'name' in participant) {
        return String((participant as { name: unknown }).name ?? '');
      }

      if (participant && typeof participant === 'object' && 'email' in participant) {
        return String((participant as { email: unknown }).email ?? '');
      }

      return '';
    })
    .filter(Boolean);
};

const mapEventDetail = (rawEvent: any): PublicEventDetail => {
  const name = rawEvent?.name ?? rawEvent?.title ?? 'Evento';
  const description =
    rawEvent?.description ??
    'Conoce los detalles del evento, sus participantes y como unirte.';

  return {
    id: String(rawEvent?.id ?? ''),
    name,
    description,
    organization:
      rawEvent?.organization ??
      rawEvent?.company ??
      rawEvent?.organizer ??
      'Universidad del Norte',
    participants: toParticipants(rawEvent?.participants),
    inscriptionDeadline: rawEvent?.inscriptionDeadline ?? '',
    awardsInfo:
      rawEvent?.awardsInfo ??
      rawEvent?.awards ??
      'Reconocimiento institucional a los mejores proyectos de cada categoria.',
    startDate: rawEvent?.startDate,
    endDate: rawEvent?.endDate,
  };
};

export const getPublicEventDetail = async ({
  eventId,
}: {
  eventId: string;
}): Promise<{ data: PublicEventDetail }> => {
  try {
    const response = await api.get<{ data?: any; event?: any }>(
      `/events/public/${eventId}`,
    );

    return {
      data: mapEventDetail(response.data ?? response.event),
    };
  } catch {
    const fallbackResponse = await api.get<{ data?: any; event?: any }>(
      `/events/${eventId}`,
    );

    return {
      data: mapEventDetail(fallbackResponse.data ?? fallbackResponse.event),
    };
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
