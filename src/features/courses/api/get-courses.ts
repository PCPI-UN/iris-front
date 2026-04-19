import { queryOptions, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import { QueryConfig } from "@/lib/react-query";
import { Meta, Course } from "@/types/api";

type GetCoursesResponse = {
  courses: Course[];
  nextPageToken?: string;
};

export const getCourses = async (
  { page, eventId }: { page?: number; eventId?: number } = { page: 1 }
): Promise<{ data: Course[]; meta: Meta }> => {
  
  const response = await api.get<GetCoursesResponse>(`/events/courses/all`, {
    params: {
      page,
      ...(eventId ? { eventId } : {})
    }
  });

  return {
    data: response.courses ?? [],
    meta: {
      page: page ?? 1,
      total: response.courses?.length ?? 0,
      totalPages: 1,
    }
  };
};

export const getCoursesQueryOptions = (
  { page = 1, eventId }: { page?: number; eventId?: number } = {}
) => {
  return queryOptions({
    queryKey: ["courses", { page, eventId: eventId ?? null }],
    queryFn: async () => {
      const result = await getCourses({ page, eventId });
      return result;
    },
    });
};

type UseCoursesOptions = {
  page?: number;
  eventId?: number;
  queryConfig?: QueryConfig<typeof getCoursesQueryOptions>;
};

export const useCourses = ({ queryConfig, page, eventId }: UseCoursesOptions) => {
  return useQuery({
    ...getCoursesQueryOptions({ page, eventId }),
    ...queryConfig,
  });
};

export const getCategories = getCourses;
export const getCategoriesQueryOptions = getCoursesQueryOptions;
export const useCategories = useCourses;
