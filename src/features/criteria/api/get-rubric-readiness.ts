import { queryOptions, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import { QueryConfig } from "@/lib/react-query";

export type RubricCategoryReadiness = {
  courseId: number;
  ready: boolean;
  criteriaCount: number;
  /** Components of the event without any criterion in this category */
  missingComponentIds: number[];
  /** Criteria of this category that are not inside a component of the event */
  criteriaWithoutComponent: number[];
  /** The category has evaluations: its criteria only accept changes of name and description */
  locked: boolean;
};

export type RubricReadiness = {
  eventId: number;
  /** Sum of the component weights of the event (fraction); it must be 1 to evaluate */
  componentsWeight: number;
  /** The event has evaluations: components cannot be created, deleted or reweighted */
  componentsLocked: boolean;
  categories: RubricCategoryReadiness[];
};

type RawRubricReadiness = Partial<
  Omit<RubricReadiness, "categories"> & {
    categories: Partial<RubricCategoryReadiness>[];
  }
>;

// The gateway leaves out false, 0 and empty lists of the gRPC answer
export const normalizeRubricReadiness = (
  raw: RawRubricReadiness,
  eventId: number,
): RubricReadiness => ({
  eventId: Number(raw.eventId ?? eventId),
  componentsWeight: Number(raw.componentsWeight ?? 0),
  componentsLocked: !!raw.componentsLocked,
  categories: (raw.categories ?? []).map((category) => ({
    courseId: Number(category.courseId ?? 0),
    ready: !!category.ready,
    criteriaCount: Number(category.criteriaCount ?? 0),
    missingComponentIds: category.missingComponentIds ?? [],
    criteriaWithoutComponent: category.criteriaWithoutComponent ?? [],
    locked: !!category.locked,
  })),
});

export const getRubricReadiness = async (
  eventId: number,
): Promise<RubricReadiness> => {
  const response = await api.get<RawRubricReadiness>(`/criterions/readiness`, {
    params: { eventId },
  });

  return normalizeRubricReadiness(response ?? {}, eventId);
};

export const rubricReadinessQueryKey = ["criterions", "readiness"] as const;

export const getRubricReadinessQueryOptions = (eventId: number) => {
  return queryOptions({
    queryKey: [...rubricReadinessQueryKey, eventId],
    queryFn: () => getRubricReadiness(eventId),
  });
};

type UseRubricReadinessOptions = {
  eventId: number;
  queryConfig?: QueryConfig<typeof getRubricReadinessQueryOptions>;
};

export const useRubricReadiness = ({
  eventId,
  queryConfig,
}: UseRubricReadinessOptions) => {
  return useQuery({
    ...getRubricReadinessQueryOptions(eventId),
    ...queryConfig,
  });
};
