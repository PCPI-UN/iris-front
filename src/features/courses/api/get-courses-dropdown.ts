import { queryOptions, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import { QueryConfig } from "@/lib/react-query";
import { Course, Meta } from "@/types/api";

export const getCoursesDropdown = async (eventId?: number, page?: number): Promise<{ data: Course[]; meta: Meta }> => {
    const response = await api.get<{
        courses: Course[];
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



export const getCoursesDropdownQueryOptions = (eventId?: number) => {
  return getCategoriesDropdownQueryOptions(eventId);
};

export const getCategoriesDropdownQueryOptions = (eventId?: number) => {
  return queryOptions({
    queryKey: eventId ? ["categories", "dropdown", eventId] : ["categories", "dropdown"],
    queryFn: () => getCoursesDropdown(eventId),
  });
};

type UseCoursesDropdownOptions = {
  eventId?: number;
  queryConfig?: QueryConfig<typeof getCategoriesDropdownQueryOptions>;
};

export const useCategoriesDropdown = ({ 
  eventId, 
  queryConfig 
}: UseCoursesDropdownOptions = {}) => {
  return useQuery({
    ...getCategoriesDropdownQueryOptions(eventId),
    enabled: !!eventId,
    ...queryConfig,
  });
};

export const getCategoriesDropdown = getCoursesDropdown;
export const useCoursesDropdown = useCategoriesDropdown;
