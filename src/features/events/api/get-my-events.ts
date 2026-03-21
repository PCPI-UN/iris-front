import { queryOptions, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import { QueryConfig } from "@/lib/react-query";
import { Meta, Event } from "@/types/api";

export const getMyEvents = async (
  { page }: { page?: number } = { page: 1 }
): Promise<{ data: Event[]; meta: Meta }> => {
  const response = await api.get<{
    data?: Event[];
    events?: Event[];
    meta?: Meta;
    page?: number;
    total?: number;
    totalPages?: number;
  }>(`/events`, { params: { page } });

  const events = response.data ?? response.events ?? [];
  const meta = response.meta ?? {
    page: response.page ?? page ?? 1,
    total: response.total ?? events.length,
    totalPages: response.totalPages ?? 1,
  };
  
  return {
    data: events,
    meta,
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
