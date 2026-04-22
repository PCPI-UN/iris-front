import { queryOptions, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import { QueryConfig } from "@/lib/react-query";
import { Event } from "@/types/api";
import { normalizeEvent } from "./event-adapter";

export const getEventsDropdown = async (): Promise<{ data: Event[] }> => {
  const response = await api.get<Record<string, any>>(`/events/dropdown`, {
    params: { page: 1, limit: 100, onlyActive: true },
  });

  const rawEvents =
    response?.events ??
    response?.data?.events ??
    response?.data?.data ??
    response?.data ??
    [];
  const data = Array.isArray(rawEvents) ? rawEvents.map(normalizeEvent) : [];

  return {
    data,
  };
};

export const getEventsDropdownQueryOptions = () => {
  return queryOptions({
    queryKey: ["events", "dropdown"],
    queryFn: () => getEventsDropdown(),
  });
};

type UseEventsDropdownOptions = {
  queryConfig?: QueryConfig<typeof getEventsDropdownQueryOptions>;
};

export const useEventsDropdown = ({
  queryConfig,
}: UseEventsDropdownOptions = {}) => {
  return useQuery({
    ...getEventsDropdownQueryOptions(),
    ...queryConfig,
  });
};
