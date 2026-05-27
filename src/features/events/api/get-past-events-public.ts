import { queryOptions, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import { QueryConfig } from "@/lib/react-query";
import { Meta, Event } from "@/types/api";

import { normalizeEventsResponse } from "./normalize-events-response";

export const getPastEventsPublic = async (
  { page }: { page?: number } = { page: 1 }
): Promise<{ data: Event[]; meta: Meta }> => {
  const response = await api.get<Record<string, any>>(
    "/events/public/past",
    {
      params: { page },
      suppressErrorNotification: true,
    }
  );

  return normalizeEventsResponse(response);
};

export const getPastEventsQueryOptions = ({ page = 1 }: { page?: number } = {}) => {
  return queryOptions({
    queryKey: ["events", "past-public", { page }],
    queryFn: () => getPastEventsPublic({ page }),
  });
};

type UsePastEventsPublicOptions = {
  page?: number;
  queryConfig?: QueryConfig<typeof getPastEventsQueryOptions>;
};

export const usePastEventsPublic = ({ queryConfig, page }: UsePastEventsPublicOptions) => {
  return useQuery({
    ...getPastEventsQueryOptions({ page }),
    ...queryConfig,
  });
};

