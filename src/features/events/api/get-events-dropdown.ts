import { queryOptions, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import { QueryConfig } from "@/lib/react-query";
import { Event } from "@/types/api";
import { normalizeEvent } from "./event-adapter";

const extractEvents = (response: Record<string, any>): Event[] => {
  const rawEvents =
    response?.events ??
    response?.items ??
    response?.data?.events ??
    response?.data?.items ??
    response?.data?.data ??
    response?.data ??
    [];

  return Array.isArray(rawEvents) ? rawEvents.map(normalizeEvent) : [];
};

export const getEventsDropdown = async (): Promise<{ data: Event[] }> => {
  const response = await api.get<Record<string, any>>(`/events`, {
    params: { page: 1, limit: 100, onlyActive: true },
  });

  return {
    data: extractEvents(response),
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
