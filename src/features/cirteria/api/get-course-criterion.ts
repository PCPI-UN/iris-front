import { queryOptions, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import { QueryConfig } from "@/lib/react-query";
import { CourseCategory } from "@/types/api";

export const getCourseCriteria = async ({
  courseId,
}: {
  courseId: string;
}): Promise<CourseCategory[]> => {
  const response = await api.get<{ categories: CourseCategory[] }>(
    `/criterions/course/${courseId}`
  );
  return response.categories || [];
};


export const getCourseCriterionQueryOptions = ({
  courseId,
}: {
  courseId: string;
}) => {
  return queryOptions({
    queryKey: ["criterions", "course", courseId],
    queryFn: () => getCourseCriteria({ courseId }),
  });
};

type UseCourseCriteriaOptions = {
  courseId: string;
  queryConfig?: QueryConfig<typeof getCourseCriterionQueryOptions>;
};

export const useCourseCriteria = ({
  courseId,
  queryConfig,
}: UseCourseCriteriaOptions) => {
  return useQuery({
    ...getCourseCriterionQueryOptions({ courseId }),
    ...queryConfig,
  });
};
