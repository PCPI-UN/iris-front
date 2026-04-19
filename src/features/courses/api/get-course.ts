import { useQuery, queryOptions } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import { QueryConfig } from "@/lib/react-query";
import { Course } from "@/types/api";

export const getCategory = async ({
  categoryId,
}: {
  categoryId: number;
}): Promise<{ data: Course }> => {
  const response = await api.get<{ course: Course }>(`/events/courses/${categoryId}`);
  
  return {
    data: response.course,
  };};

export const getCategoryQueryOptions = (categoryId: number) => {
  return queryOptions({
    queryKey: ["categories", categoryId],
    queryFn: async () => {
      const result = await getCategory({ categoryId });
      return result;
    },  });
};

type UseCategoryOptions = {
  categoryId: number;
  queryConfig?: QueryConfig<typeof getCategoryQueryOptions>;
};

export const useCategory = ({ categoryId, queryConfig }: UseCategoryOptions) => {
  return useQuery({
    ...getCategoryQueryOptions(categoryId),
    ...queryConfig,
  });
};
