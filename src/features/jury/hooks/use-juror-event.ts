import { useQuery } from "@tanstack/react-query";

import { useMeEvent } from "@/features/events/api/get-me-events";
import { formatTermCode } from "@/features/events/api/get-terms";
import { useEventGradingScale } from "@/features/grading-scales/api/get-event-grading-scale";
import { GradingScale } from "@/features/grading-scales/utils/grading-scale";
import { api } from "@/lib/api-client";
import type { Term } from "@/types/api";

/**
 * The event as the juror sees it (GET /me/events, every page), its grading scale,
 * and its formatted academic term code (<year><period>, e.g. 202630) when available.
 * When the event does not bring the scale it is asked for with GET /events/:id.
 */
export const useJurorEvent = (eventId: number | string | undefined) => {
  const id = eventId === undefined || eventId === null ? "" : String(eventId);
  const eventQuery = useMeEvent(id);
  const event = eventQuery.data ?? undefined;

  const scaleQuery = useEventGradingScale({
    eventId: Number(id),
    queryConfig: {
      enabled: Number(id) > 0 && eventQuery.isSuccess && !event?.gradingScale,
    },
  });
  const gradingScale: GradingScale | null =
    event?.gradingScale ?? scaleQuery.data ?? null;

  const termId =
    typeof event?.termId === "number" && event.termId > 0
      ? event.termId
      : undefined;
  const termsQuery = useQuery({
    queryKey: ["terms"],
    queryFn: async (): Promise<Term[]> => {
      const response = await api.get<
        Term[] | { data?: Term[]; terms?: Term[] }
      >("/terms", { suppressErrorNotification: true });
      const terms = Array.isArray(response)
        ? response
        : (response?.terms ?? response?.data ?? []);

      return Array.isArray(terms) ? terms : [];
    },
    enabled: termId !== undefined,
    retry: false,
  });
  const matchedTerm =
    termId !== undefined
      ? termsQuery.data?.find((candidate) => candidate.id === termId)
      : undefined;
  const termCode = matchedTerm ? formatTermCode(matchedTerm) : undefined;

  return {
    event,
    gradingScale,
    termCode,
    isLoading: eventQuery.isLoading,
  };
};

/** Highest grade of the scale: the points of its top level */
export const maxGradeOf = (scale: GradingScale | null): number | undefined =>
  scale && scale.levels.length > 0
    ? Math.max(...scale.levels.map((level) => level.points))
    : undefined;
