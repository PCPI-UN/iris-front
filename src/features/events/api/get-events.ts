import { queryOptions, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import { QueryConfig } from "@/lib/react-query";
import { Meta, Event } from "@/types/api";

import { normalizeEventsResponse } from "./normalize-events-response";

type GetEventsParams = {
  page?: number;
  onlyActive?: boolean;
  statuses?: string[] | number[];
  q?: string;
};

export const getEvents = async (
  { page, onlyActive, statuses, q }: GetEventsParams = { page: 1 }
): Promise<{ data: Event[]; meta: Meta }> => {
  const params: Record<string, any> = { page };
  if (onlyActive !== undefined) params.onlyActive = onlyActive;
  if (statuses !== undefined) params.statuses = statuses;
  if (q !== undefined) params.q = q;

  const response = await api.get<Record<string, any>>(`/events`, {
    params,
  });

  return normalizeEventsResponse(response);
};

export const getEventsQueryOptions = ({ page = 1, onlyActive, statuses, q }: GetEventsParams = {}) => {
  return queryOptions({
    queryKey: ["events", { page, onlyActive, statuses, q }],
    queryFn: () => getEvents({ page, onlyActive, statuses, q }),
  });
};

type UseEventsOptions = {
  page?: number;
  onlyActive?: boolean;
  statuses?: string[] | number[];
  q?: string;
  queryConfig?: QueryConfig<typeof getEventsQueryOptions>;
};

export const useEvents = ({ queryConfig, page, onlyActive, statuses, q }: UseEventsOptions) => {
  return useQuery({
    ...getEventsQueryOptions({ page, onlyActive, statuses, q }),
    ...queryConfig,
  });
};
