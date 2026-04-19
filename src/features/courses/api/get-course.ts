import { useQuery, queryOptions } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import { QueryConfig } from "@/lib/react-query";
import { Course } from "@/types/api";

export const getCourse = async ({
  courseId,
}: {
  courseId: number;
}): Promise<{ data: Course }> => {
  const response = await api.get<{ course: Course }>(`/events/courses/${courseId}`);
  
  return {
    data: response.course,
  };};

export const getCourseQueryOptions = (courseId: number) => {
  return queryOptions({
    queryKey: ["courses", courseId],
    queryFn: async () => {
      const result = await getCourse({ courseId });
      return result;
    },  });
};

type UseCourseOptions = {
  courseId: number;
  queryConfig?: QueryConfig<typeof getCourseQueryOptions>;
};

export const useCourse = ({ courseId, queryConfig }: UseCourseOptions) => {
  return useQuery({
    ...getCourseQueryOptions(courseId),
    ...queryConfig,
  });
};

export const getCategory = getCourse;
export const getCategoryQueryOptions = getCourseQueryOptions;
export const useCategory = useCourse;
