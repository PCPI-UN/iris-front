import { paths } from '@/config/paths';
import { api } from '@/lib/api-client';

type JoinUser = {
  id?: string | number | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
};

type JoinParticipant = {
  firstName?: unknown;
  lastName?: unknown;
  name?: unknown;
  email?: unknown;
};

const normalize = (value?: string | null) =>
  String(value ?? '')
    .trim()
    .toLowerCase();

const toParticipants = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((participant) => {
      if (typeof participant === 'string') {
        return participant;
      }

      if (participant && typeof participant === 'object') {
        const participantData = participant as JoinParticipant;

        const fullName = `${String(participantData.firstName ?? '')} ${String(participantData.lastName ?? '')}`.trim();

        return (
          fullName ||
          String(participantData.name ?? '').trim() ||
          String(participantData.email ?? '').trim()
        );
      }

      return '';
    })
    .filter(Boolean);
};

const getEventParticipants = async (eventId: string): Promise<string[]> => {
  try {
    const response = await api.get<unknown>(`/events/public/${eventId}`, {
      suppressErrorNotification: true,
    });
    const eventData =
      response && typeof response === 'object' && response !== null
        ? (response as { data?: unknown; event?: unknown }).data ??
          (response as { data?: unknown; event?: unknown }).event ??
          response
        : response;

    return toParticipants(
      eventData && typeof eventData === 'object'
        ? (eventData as { participants?: unknown }).participants
        : undefined,
    );
  } catch {
    const response = await api.get<unknown>(`/events/${eventId}`, {
      suppressErrorNotification: true,
    });
    const eventData =
      response && typeof response === 'object' && response !== null
        ? (response as { data?: unknown; event?: unknown }).data ??
          (response as { data?: unknown; event?: unknown }).event ??
          response
        : response;

    return toParticipants(
      eventData && typeof eventData === 'object'
        ? (eventData as { participants?: unknown }).participants
        : undefined,
    );
  }
};

export const resolveJoinTarget = async ({
  eventId,
  user,
  participants: providedParticipants,
}: {
  eventId: string | number;
  user?: JoinUser | null;
  participants?: unknown;
}): Promise<string> => {
  const normalizedEventId = String(eventId);
  const joinHref = paths.public.project.getHref(normalizedEventId);

  if (!user?.id) {
    return paths.auth.login.getHref(joinHref);
  }

  try {
    const participants =
      providedParticipants === undefined
        ? await getEventParticipants(normalizedEventId)
        : toParticipants(providedParticipants);
    const fullName = normalize(`${user.firstName} ${user.lastName}`);
    const email = normalize(user.email);

    const isAlreadyRegistered = participants.some((participant) => {
      const normalizedParticipant = normalize(participant);
      return normalizedParticipant === fullName || normalizedParticipant === email;
    });

    if (isAlreadyRegistered) {
      return paths.app.dashboard.getHref();
    }
  } catch {
    return joinHref;
  }

  return joinHref;
};
