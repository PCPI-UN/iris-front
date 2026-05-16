import { queryOptions, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import { QueryConfig } from "@/lib/react-query";
import { CategoryCriteriaGroup } from "@/types/api";

export const getCategoryCriteria = async ({
  categoryId,
}: {
  categoryId: string;
}): Promise<CategoryCriteriaGroup[]> => {
  const response = await api.get<{ categories: CategoryCriteriaGroup[] }>(
    `/criterions/course/${categoryId}`
  );
  return response.categories || [];
};

export const getCategoryCriterionQueryOptions = ({
  categoryId,
}: {
  categoryId: string;
}) => {
  return queryOptions({
    queryKey: ["criterions", "category", categoryId],
    queryFn: () => getCategoryCriteria({ categoryId }),
  });
};

type UseCategoryCriteriaOptions = {
  categoryId: string;
  queryConfig?: QueryConfig<typeof getCategoryCriterionQueryOptions>;
};

export const useCategoryCriteria = ({
  categoryId,
  queryConfig,
}: UseCategoryCriteriaOptions) => {
  return useQuery({
    ...getCategoryCriterionQueryOptions({ categoryId }),
    ...queryConfig,
  });
};
