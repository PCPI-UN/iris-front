import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { getCategoryQueryOptions } from "./get-category";

import { api } from "@/lib/api-client";
import { MutationConfig } from "@/lib/react-query";

export const updateCategoryInputSchema = z.object({
  id: z.number().min(1, "El ID es obligatorio"),
  code: z.string().min(1, "Este campo es obligatorio"),
  description: z.string().min(1, "Este campo es obligatorio"),
  active: z.boolean(),
});

export type UpdateCategoryInput = z.infer<typeof updateCategoryInputSchema>;

export const updateCategory = ({
  data,
}: {
  data: UpdateCategoryInput;
}): Promise<{ ok: boolean; message: string }> => {
  return api.patch(`/events/courses/${data.id}`, data);
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
        queryKey: getCategoryQueryOptions(variables.data.id).queryKey,
      });
      onSuccess?.(data, variables, ...args);
    },
    ...restConfig,
    mutationFn: updateCategory,
  });
};
