import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import type { ComponentStats } from './get-event-criteria-stats';

export type ProjectEvaluationStats = {
  projectId: number;
  averageGrade: number;
  evaluationCount: number;
  evaluatorIds: number[];
  /** Average of each rubric component of the project, with the effective weights */
  components: ComponentStats[];
  /** Highest grade of the event's grading scale; absent when the event has none */
  maxScore?: number;
};

export const getProjectEvaluationStats = async (
  projectId: string,
): Promise<{ data: ProjectEvaluationStats }> => {
  const response = await api.get<ProjectEvaluationStats>(
    `/evaluations/projects/${projectId}/stats`,
  );

  return {
    data: response,
  };
};

export const getProjectEvaluationStatsQueryOptions = (projectId: string) => {
  return queryOptions({
    queryKey: ['project-evaluation-stats', projectId],
    queryFn: () => getProjectEvaluationStats(projectId),
  });
};

type UseProjectEvaluationStatsOptions = {
  projectId: string;
  queryConfig?: QueryConfig<typeof getProjectEvaluationStatsQueryOptions>;
};

export const useProjectEvaluationStats = ({
  projectId,
  queryConfig,
}: UseProjectEvaluationStatsOptions) => {
  return useQuery({
    ...getProjectEvaluationStatsQueryOptions(projectId),
    ...queryConfig,
  });
};