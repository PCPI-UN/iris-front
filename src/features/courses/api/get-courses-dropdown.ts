import { queryOptions, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import { QueryConfig } from "@/lib/react-query";
import { Category, Meta } from "@/types/api";

export const getCategoriesDropdown = async (eventId?: number, page?: number): Promise<{ data: Category[]; meta: Meta }> => {
    const response = await api.get<{
        courses: Category[];
        nextPageToken: string;
      }>(`/events/courses/event/${eventId}`, { params: { eventId: eventId, page } });

  return {
      data: response.courses,
      meta: {
        page: page || 1,
        total: response.courses.length,
        totalPages: response.nextPageToken ? 2 : 1,
      },  };
};



export const getCategoriesDropdownQueryOptions = (eventId?: number) => {
  return queryOptions({
    queryKey: eventId ? ["categories", "dropdown", eventId] : ["categories", "dropdown"],
    queryFn: () => getCategoriesDropdown(eventId),
  });
};

type UseCategoriesDropdownOptions = {
  eventId?: number;
  queryConfig?: QueryConfig<typeof getCategoriesDropdownQueryOptions>;
};

export const useCategoriesDropdown = ({ 
  eventId, 
  queryConfig 
}: UseCategoriesDropdownOptions = {}) => {
  return useQuery({
    ...getCategoriesDropdownQueryOptions(eventId),
    enabled: !!eventId,
    ...queryConfig,
  });
};
