import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { api } from "@/lib/api-client";
import { MutationConfig } from "@/lib/react-query";
import { Category } from "@/types/api";

import { getCategoryQueryOptions } from "./get-category";

export const updateCategoryInputSchema = z.object({
  id: z.number().min(1, "ID is required"),
  code: z.string().min(1, "Required"),
  description: z.string().min(1, "Required"),
  active: z.boolean(),
});

export type UpdateCategoryInput = z.infer<typeof updateCategoryInputSchema>;

export const updateCategory = ({
  data
}: {
  data: UpdateCategoryInput;
}): Promise<{ data: Category }> => {
  return api.patch(`/events/courses/update`, data);
};

type UseUpdateCategoryOptions = {
  mutationConfig?: MutationConfig<typeof updateCategory>;
};

export const useUpdateCategory = ({
  mutationConfig,
}: UseUpdateCategoryOptions = {}) => {
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: (data, variables, ...args) => {
      queryClient.invalidateQueries({
        queryKey: ["categories"],
      });
      queryClient.refetchQueries({
        queryKey: getCategoryQueryOptions(data.data.id).queryKey,
      });
      onSuccess?.(data, variables, ...args);
    },
    ...restConfig,
    mutationFn: updateCategory,
  });
};
