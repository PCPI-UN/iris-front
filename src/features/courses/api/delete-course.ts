import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import { Course } from "@/types/api";
import { MutationConfig } from "@/lib/react-query";

export const deleteCategory = ({ categoryId }: { categoryId: number }): Promise<{ data: Course }> => {
  return api.delete(`/events/courses/delete`, { id: categoryId });
};

type UseDeleteCourseOptions = {
  mutationConfig?: MutationConfig<typeof deleteCategory>;
};

type UseDeleteCategoryOptions = UseDeleteCourseOptions;

export const useDeleteCategory = ({
  mutationConfig,
}: UseDeleteCategoryOptions = {}) => {
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: (data, variables, ...args) => {
      queryClient.invalidateQueries({
        queryKey: ["categories"],
      });
      queryClient.invalidateQueries({
        queryKey: ["courses"],
      });
      onSuccess?.(data, variables, ...args);
    },
    ...restConfig,
    mutationFn: deleteCategory,
  });
};
