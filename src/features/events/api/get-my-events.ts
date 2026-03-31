import { queryOptions, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import { QueryConfig } from "@/lib/react-query";
import { Meta, Event } from "@/types/api";

export const getMyEvents = async (
  { page }: { page?: number } = { page: 1 }
): Promise<{ data: Event[]; meta: Meta }> => {
  const response = await api.get<{
    events: Event[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }>(`/events/my-events`, { params: { page } });
  
  return {
    data: response.events || [],
    meta: {
      page: response.page,
      total: response.total,
      totalPages: response.totalPages,
    },
  };
};

export const getMyEventsQueryOptions = ({ page = 1 }: { page?: number } = {}) => {
  return queryOptions({
    queryKey: ["events", { page }],
    queryFn: () => getMyEvents({ page }),
  });
};

type UseMyEventsOptions = {
  page?: number;
  queryConfig?: QueryConfig<typeof getMyEventsQueryOptions>;
};

export const useMyEvents = ({ queryConfig, page }: UseMyEventsOptions) => {
  return useQuery({
    ...getMyEventsQueryOptions({ page }),
    ...queryConfig,
  });
};
