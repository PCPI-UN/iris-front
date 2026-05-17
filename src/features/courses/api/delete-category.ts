import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import { MutationConfig } from "@/lib/react-query";

export const deleteCategory = ({ categoryId }: { categoryId: number }): Promise<{ ok: boolean }> => {
  return api.delete(`/events/courses/${categoryId}`);
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
      // Update ALL categories list queries by filtering out the deleted category
      queryClient.setQueriesData(
        {
          predicate: (query) =>
            Array.isArray(query.queryKey) &&
            query.queryKey[0] === "categories" &&
            typeof query.queryKey[1] === "object",
        },
        (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            data: (oldData.data || []).filter(
              (category: any) => category.id !== variables.categoryId
            ),
          };
        }
      );

      // Also remove the detail query
      queryClient.removeQueries({
        queryKey: ["categories", variables.categoryId],
        exact: true,
      });

      onSuccess?.(data, variables, ...args);
    },
    ...restConfig,
    mutationFn: deleteCategory,
  });
};
