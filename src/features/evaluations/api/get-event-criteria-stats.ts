import { queryOptions, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import { QueryConfig } from "@/lib/react-query";

export type CriterionStats = {
  id: number;
  name: string;
  /** Effective weight of the criterion in the grade (fraction, 0-1) */
  weight: number;
  average: number;
};

export type ComponentStats = {
  /** Absent for the criteria without component */
  id?: number;
  name: string;
  /** Sum of the effective weights of its criteria (fraction, 0-1) */
  weight: number;
  /** Weighted score of the component, averaged per project and then across projects */
  average: number;
  /** Projects with at least one evaluation of this component */
  projectCount: number;
  criteria: CriterionStats[];
};

export type EventCriteriaStats = {
  /** Highest grade of the event's grading scale; absent when the event has none */
  maxScore?: number;
  components: ComponentStats[];
};

/**
 * Average score per rubric component over the projects of an event
 * (GET /evaluations/events/:eventId/stats). The backend applies the stored
 * effective weights; with `categoryId`, only the projects of that category count.
 */
export const getEventCriteriaStats = (
  eventId: number,
  categoryId?: number,
): Promise<EventCriteriaStats> =>
  api.get<EventCriteriaStats>(`/evaluations/events/${eventId}/stats`, {
    params: categoryId !== undefined ? { categoryId } : undefined,
  });

export const getEventCriteriaStatsQueryOptions = (
  eventId: number,
  categoryId?: number,
) => {
  return queryOptions({
    queryKey: ["event-criteria-stats", eventId, categoryId ?? null],
    queryFn: () => getEventCriteriaStats(eventId, categoryId),
  });
};

type UseEventCriteriaStatsOptions = {
  eventId: number;
  categoryId?: number;
  queryConfig?: QueryConfig<typeof getEventCriteriaStatsQueryOptions>;
};

export const useEventCriteriaStats = ({
  eventId,
  categoryId,
  queryConfig,
}: UseEventCriteriaStatsOptions) => {
  return useQuery({
    ...getEventCriteriaStatsQueryOptions(eventId, categoryId),
    ...queryConfig,
  });
};
