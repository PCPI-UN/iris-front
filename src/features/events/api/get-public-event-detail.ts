import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

export type PublicEventDetail = {
  id: string;
  name: string;
  description: string;
  organization: string;
  company?: string;
  participants: string[];
  inscriptionDeadline: string;
  awardsInfo: string;
  sponsorInfo?: string;
  startDate?: string;
  endDate?: string;
  location?: {
    name: string;
    institution: string;
    address?: string;
  };
  eventType?: string;
  cost?: string;
  sponsors?: Array<{
    name: string;
    logoSrc: string;
    url?: string;
  }>;
  prizes?: Array<{
    position: number;
    title: string;
    amount: number;
    currency: string;
  }>;
  requirements?: {
    teamSize: string;
    minDisciplines?: number;
    disciplines?: string[];
    minAttendance?: number;
    description: string;
  };
};

const toParticipants = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const participants = value as unknown[];

  return participants
    .map((participant: unknown) => {
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

  type Prize = NonNullable<PublicEventDetail['prizes']>[number];
  const prizeConfigItems: unknown[] = Array.isArray(rawEvent?.prizeConfig?.items)
    ? rawEvent.prizeConfig.items
    : [];
  const rawPrizes: unknown[] = Array.isArray(rawEvent?.prizes)
    ? rawEvent.prizes
    : prizeConfigItems.map((item: any) => ({
        position: item?.position,
        amount: item?.amount,
        currency: rawEvent?.prizeConfig?.currency ?? 'COP',
        title:
          item?.title ??
          (Number(item?.position) === 1
            ? 'Primer puesto'
            : Number(item?.position) === 2
              ? 'Segundo puesto'
              : `Puesto ${item?.position}`),
      }));
  const prizes: Prize[] = rawPrizes
    .map((prize): Prize => {
      const value = prize as Partial<Prize>;
      return {
        position: Number(value.position ?? 0),
        title: String(value.title ?? ''),
        amount: Number(value.amount ?? 0),
        currency: String(value.currency ?? 'COP'),
      };
    })
    .filter(
      (prize) => prize.position > 0 && Boolean(prize.title) && prize.amount > 0,
    );

  const requirements = rawEvent?.requirements
    ? {
        teamSize: String(rawEvent.requirements.teamSize ?? ''),
        minDisciplines:
          rawEvent.requirements.minDisciplines != null
            ? Number(rawEvent.requirements.minDisciplines)
            : undefined,
        disciplines: Array.isArray(rawEvent.requirements.disciplines)
          ? rawEvent.requirements.disciplines.map((d: unknown) => String(d))
          : undefined,
        minAttendance:
          rawEvent.requirements.minAttendance != null
            ? Number(rawEvent.requirements.minAttendance)
            : undefined,
        description: String(rawEvent.requirements.description ?? ''),
      }
    : undefined;

  const location = rawEvent?.location
    ? {
        name: String(rawEvent.location.name ?? rawEvent.location.venue ?? ''),
        institution: String(rawEvent.location.institution ?? ''),
        address:
          (rawEvent.location.address ?? rawEvent.location.city) != null
            ? String(rawEvent.location.address ?? rawEvent.location.city)
            : undefined,
      }
    : undefined;

  type Sponsor = NonNullable<PublicEventDetail['sponsors']>[number];
  const rawSponsors: unknown[] = Array.isArray(rawEvent?.sponsors) ? rawEvent.sponsors : [];
  const sponsors: Sponsor[] = rawSponsors
    .map((item): Sponsor => {
      const value = item as Partial<Sponsor>;
      return {
        name: String(value.name ?? ''),
        logoSrc: String(value.logoSrc ?? ''),
        url: value.url ? String(value.url) : undefined,
      };
    })
    .filter((sponsor) => Boolean(sponsor.name) && Boolean(sponsor.logoSrc));

  return {
    id: String(rawEvent?.id ?? ''),
    name,
    description,
    organization:
      rawEvent?.organization ??
      rawEvent?.company ??
      rawEvent?.organizer ??
      'Universidad del Norte',
    company: rawEvent?.company ? String(rawEvent.company) : undefined,
    participants: toParticipants(rawEvent?.participants),
    inscriptionDeadline: rawEvent?.inscriptionDeadline ?? '',
    awardsInfo:
      rawEvent?.awardsInfo ??
      rawEvent?.awards ??
      'Reconocimiento institucional a los mejores proyectos de cada categoria.',
    sponsorInfo: rawEvent?.sponsorInfo ?? undefined,
    startDate: rawEvent?.startDate,
    endDate: rawEvent?.endDate,
    location,
    eventType: rawEvent?.eventType ? String(rawEvent.eventType) : undefined,
    cost: rawEvent?.cost ? String(rawEvent.cost) : undefined,
    sponsors: sponsors.length ? sponsors : undefined,
    prizes: prizes.length ? prizes : undefined,
    requirements:
      requirements && (requirements.teamSize || requirements.description)
        ? requirements
        : undefined,
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
