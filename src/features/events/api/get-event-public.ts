import { queryOptions, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import { QueryConfig } from "@/lib/react-query";
import { Meta, Event } from "@/types/api";

import { normalizeEventsResponse } from "./normalize-events-response";

export const getEventsPublic = async (
  { page }: { page?: number } = { page: 1 }
): Promise<{ data: Event[]; meta: Meta }> => {
  const response = await api.get<Record<string, any>>(`/events/public`, {
    params: { page },
    suppressErrorNotification: true,
  });

  return normalizeEventsResponse(response);
};

export const getEventsQueryOptions = ({ page = 1 }: { page?: number } = {}) => {
  return queryOptions({
    queryKey: ["events", { page }],
    queryFn: () => getEventsPublic({ page }),
  });
};

type UseEventsOptions = {
  page?: number;
  queryConfig?: QueryConfig<typeof getEventsQueryOptions>;
};

export const useEventsPublic = ({ queryConfig, page }: UseEventsOptions) => {
  return useQuery({
    ...getEventsQueryOptions({ page }),
    ...queryConfig,
  });
};
