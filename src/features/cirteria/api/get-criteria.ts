import { queryOptions, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import { QueryConfig } from "@/lib/react-query";
import { Criterion } from "@/types/api";

type GetCriteriaParams = {
  page?: number;
  limit?: number;
  eventId?: number;
  courseId?: number;
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
  courseId,
}: GetCriteriaParams = {}): Promise<GetCriteriaResponse> => {
  const response = await api.get<GetCriteriaResponse>(`/criterions`, {
    params: {
      page,
      limit,
      ...(eventId ? { eventId } : {}),
      ...(courseId ? { courseId } : {}),
    },
  });

  return {
    criterions: response.criterions || [],
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
