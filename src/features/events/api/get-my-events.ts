import { queryOptions, useQuery } from "@tanstack/react-query";

import { normalizeEventsResponse } from "./normalize-events-response";

import { api } from "@/lib/api-client";
import { QueryConfig } from "@/lib/react-query";
import { Meta, Event } from "@/types/api";

export const getMyEvents = async (
  { page, limit }: { page?: number; limit?: number } = { page: 1 },
): Promise<{ data: Event[]; meta: Meta }> => {
  const response = await api.get<Record<string, any>>(`/events/my-events`, {
    params: { page, limit },
  });

  return normalizeEventsResponse(response);
};

export const getMyEventsQueryOptions = ({
  page = 1,
  limit,
}: { page?: number; limit?: number } = {}) => {
  return queryOptions({
    queryKey: ["events", "my-events", { page, limit }],
    queryFn: () => getMyEvents({ page, limit }),
  });
};

type UseMyEventsOptions = {
  page?: number;
  limit?: number;
  queryConfig?: QueryConfig<typeof getMyEventsQueryOptions>;
};

export const useMyEvents = ({
  queryConfig,
  page,
  limit,
}: UseMyEventsOptions) => {
  return useQuery({
    ...getMyEventsQueryOptions({ page, limit }),
    ...queryConfig,
  });
};
