import { useQuery, queryOptions } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import { QueryConfig } from "@/lib/react-query";
import { Criterion } from "@/types/api";

export const getCriterion = async ({
  criterionId,
}: {
  criterionId: number;
}): Promise<{ data: Criterion }> => {
  const response = await api.get<Criterion>(`/criterions/${criterionId}`);

  // If the response has a 'data' property, use it; otherwise wrap the response
  return {
    data: (response as any).data || response,
  };
};

export const getCriterionQueryOptions = (criterionId: number) => {
  return queryOptions({
    queryKey: ["criterions", criterionId],
    queryFn: async () => {
      const result = await getCriterion({ criterionId });
      return result;
    },
  });
};

type UseCriterionOptions = {
  criterionId: number;
  queryConfig?: QueryConfig<typeof getCriterionQueryOptions>;
};

export const useCriterion = ({
  criterionId,
  queryConfig,
}: UseCriterionOptions) => {
  return useQuery({
    ...getCriterionQueryOptions(criterionId),
    ...queryConfig,
  });
};
