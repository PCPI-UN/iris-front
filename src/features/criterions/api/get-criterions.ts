import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

export type Criterion = {
  id: number;
  eventId: number;
  name: string;
  description: string;
  weight: number;
  active: boolean;
  courseIds: number[];
  category: string;
};

export type GetCriterionsResponse = {
  criterions: Criterion[];
  meta: {
    total: number;
    itemsOnCurrentPage: number;
    itemsPerPage: number;
    currentPage: number;
    totalPages: number;
  };
};

export const getCriterions = async (
  eventId?: number,
): Promise<GetCriterionsResponse> => {
  const params = new URLSearchParams();
  if (eventId) {
    params.append('eventId', String(eventId));
  }
  params.append('limit', '1000'); // Get all criterions

  const response = await api.get<GetCriterionsResponse>(
    `/criterions?${params.toString()}`,
  );

  return response;
};

export const getCriterionsQueryOptions = (eventId?: number) => {
  return queryOptions({
    queryKey: ['criterions', eventId],
    queryFn: () => getCriterions(eventId),
  });
};

type UseCriterionsOptions = {
  eventId?: number;
  queryConfig?: QueryConfig<typeof getCriterionsQueryOptions>;
};

export const useCriterions = ({ eventId, queryConfig }: UseCriterionsOptions) => {
  return useQuery({
    ...getCriterionsQueryOptions(eventId),
    ...queryConfig,
  });
};
