import { useMeEvent } from "@/features/events/api/get-me-events";
import { useEventGradingScale } from "@/features/grading-scales/api/get-event-grading-scale";
import { GradingScale } from "@/features/grading-scales/utils/grading-scale";

/**
 * The event as the juror sees it (GET /me/events, every page) and its grading scale.
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

  return {
    event,
    gradingScale,
    isLoading: eventQuery.isLoading,
  };
};

/** Highest grade of the scale: the points of its top level */
export const maxGradeOf = (scale: GradingScale | null): number | undefined =>
  scale && scale.levels.length > 0
    ? Math.max(...scale.levels.map((level) => level.points))
    : undefined;
