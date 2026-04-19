import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import { Category } from "@/types/api";
import { MutationConfig } from "@/lib/react-query";

export const deleteCategory = ({ categoryId }: { categoryId: number }): Promise<{ data: Category }> => {
  return api.delete(`/events/courses/delete`, { id: categoryId });
};

type UseDeleteCategoryOptions = {
  mutationConfig?: MutationConfig<typeof deleteCategory>;
};

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
      onSuccess?.(data, variables, ...args);
    },
    ...restConfig,
    mutationFn: deleteCategory,
  });
};
