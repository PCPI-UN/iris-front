import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

export type ProjectEvaluationCategoryStat = {
  category: string;
  averageScore: number;
  weight: number;
};

export type ProjectEvaluationStats = {
  projectId: number;
  averageGrade: number;
  evaluationCount: number;
  categoryStats: ProjectEvaluationCategoryStat[];
  evaluatorIds: number[];
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