import { paths } from '@/config/paths';
import { api } from '@/lib/api-client';
import { getProject } from '@/features/projects/api/get-project-user-event';

type JoinUser = {
  id?: string | number | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
};

type MyEvent = {
  id?: number | string;
  name?: string;
  [key: string]: any;
};

type MyEventsResponse = {
  events?: MyEvent[];
  data?: MyEvent[];
  meta?: {
    total?: number;
    itemsOnCurrentPage?: number;
    itemsPerPage?: number;
    currentPage?: number;
    totalPages?: number;
  };
  totalPages?: number;
};

const normalizeId = (value: unknown): string => String(value ?? '').trim();

const extractEvents = (response: MyEventsResponse): MyEvent[] => {
  const rawEvents = response?.events ?? response?.data ?? [];
  return Array.isArray(rawEvents) ? rawEvents : [];
};

const extractTotalPages = (response: MyEventsResponse): number => {
  const totalPages = response?.meta?.totalPages ?? response?.totalPages ?? 1;
  return Number.isFinite(totalPages) && totalPages > 0 ? totalPages : 1;
};

const wait = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const extractEventIdFromSlug = (
  value: string | number,
): { eventId: string; eventSlug: string | null } => {
  const normalizedValue = String(value ?? '').trim();
  const slugMatch = normalizedValue.match(/^(.*?)-(\d+)$/);

  if (slugMatch) {
    return {
      eventId: slugMatch[2],
      eventSlug: slugMatch[1],
    };
  }

  return {
    eventId: normalizedValue,
    eventSlug: null,
  };
};

const buildProjectHref = (
  eventId: string | number,
  eventName?: string | null,
) => {
  const { eventId: normalizedEventId, eventSlug } = extractEventIdFromSlug(eventId);

  if (eventName?.trim()) {
    return paths.public.project.getHref({
      id: normalizedEventId,
      name: eventName,
    });
  }

  if (eventSlug) {
    return paths.public.project.getHref({
      id: normalizedEventId,
      name: eventSlug,
    });
  }

  return paths.public.project.getHref(normalizedEventId);
};

export const getUserProjectStateInEvent = async (
  eventId: string | number,
): Promise<string | null> => {
  try {
    const { project } = await getProject({ eventId: String(eventId) });

    return typeof project?.state === 'string'
      ? project.state.trim().toUpperCase()
      : null;
  } catch {
    return null;
  }
};

export const isUserRegisteredInEvent = async (
  eventId: string | number,
): Promise<boolean> => {
  const maxAttempts = 2;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const targetEventId = normalizeId(eventId);
      let currentPage = 1;
      let totalPages = 1;

      do {
        const response = await api.get<MyEventsResponse>(`/events/my-events`, {
          params: { page: currentPage },
          suppressErrorNotification: true,
        });

        const parsedResponse =
          response && typeof response === 'object' ? response : {};
        const events = extractEvents(parsedResponse as MyEventsResponse);

        const hasEvent = events.some(
          (event) => normalizeId(event?.id) === targetEventId,
        );

        if (hasEvent) {
          return true;
        }

        totalPages = extractTotalPages(parsedResponse as MyEventsResponse);
        currentPage += 1;
      } while (currentPage <= totalPages);

      return false;
    } catch (error) {
      lastError = error as Error;
      // If not the last attempt, wait before retrying
      if (attempt < maxAttempts) {
        await wait(250);
      }
    }
  }

  // All attempts failed, log the last error and return false
  if (lastError) {
    console.error('Failed to check event registration after retries:', lastError);
  }
  return false;
};

export const resolveJoinTarget = async ({
  eventId,
  eventName,
  user,
}: {
  eventId: string | number;
  eventName?: string | null;
  user?: JoinUser | null;
}): Promise<string> => {
  const { eventId: normalizedEventId } = extractEventIdFromSlug(eventId);
  const joinHref = buildProjectHref(eventId, eventName);

  if (!user?.id) {
    return paths.auth.login.getHref(joinHref);
  }

  try {
    const projectState = await getUserProjectStateInEvent(normalizedEventId);

    if (projectState) {
      return projectState === 'REJECTED'
        ? joinHref
        : paths.app.dashboard.getHref();
    }

    const isAlreadyRegistered = await isUserRegisteredInEvent(normalizedEventId);

    if (isAlreadyRegistered) {
      return paths.app.dashboard.getHref();
    }
  } catch {
    return joinHref;
  }

  return joinHref;
};
