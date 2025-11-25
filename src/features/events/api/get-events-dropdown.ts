import { queryOptions, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import { QueryConfig } from "@/lib/react-query";
import { Event } from "@/types/api";

export const getEventsDropdown = async (): Promise<{ data: Event[] }> => {
  const response = await api.get<{ events: Event[]; meta: any }>(`/events`, {
    params: { page: 1, limit: 100, onlyActive: true },
  });

  return {
    data: response.events || [],
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
