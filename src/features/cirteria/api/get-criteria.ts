import { queryOptions, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import { withLegacyCourseIdParam, normalizeCategoryIds } from "@/lib/compat/category-legacy";
import { QueryConfig } from "@/lib/react-query";
import { Criterion } from "@/types/api";

type GetCriteriaParams = {
  page?: number;
  limit?: number;
  eventId?: number;
  categoryId?: number;
};

type GetCriteriaResponse = {
  criterions: Criterion[];
  meta: {
    total: number;
    itemsOnCurrentPage: number;
    itemsPerPage: number;
    currentPage: number;
    totalPages: number;
  };
};

export const getCriteria = async ({
  page = 1,
  limit = 100,
  eventId,
  categoryId,
}: GetCriteriaParams = {}): Promise<GetCriteriaResponse> => {
  const response = await api.get<GetCriteriaResponse>(`/criterions`, {
    params: {
      page,
      limit,
      ...(eventId ? { eventId } : {}),
      ...withLegacyCourseIdParam(categoryId),
    },
  });

  const criterions = (response.criterions || []).map((criterion) => ({
    ...criterion,
    categoryIds: normalizeCategoryIds(criterion) as number[],
  }));

  return {
    criterions,
    meta: response.meta,
  };
};

export const getCriteriaQueryOptions = (params: GetCriteriaParams = {}) => {
  return queryOptions({
    queryKey: ["criterions", params],
    queryFn: () => getCriteria(params),
  });
};

type UseCriteriaOptions = GetCriteriaParams & {
  queryConfig?: QueryConfig<typeof getCriteriaQueryOptions>;
};

export const useCriteria = ({
  queryConfig,
  ...params
}: UseCriteriaOptions = {}) => {
  return useQuery({
    ...getCriteriaQueryOptions(params),
    ...queryConfig,
  });
};
