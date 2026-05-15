import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { api } from "@/lib/api-client";
import { MutationConfig } from "@/lib/react-query";
import { CriterionComponent } from "@/types/api";

export const updateComponentInputSchema = z.object({
  name: z.string().min(1, "Required").optional(),
  weight: z
    .number()
    .min(0.01, "Weight must be greater than 0")
    .max(1, "Weight must be less than or equal to 1")
    .optional(),
});

export type UpdateComponentInput = z.infer<typeof updateComponentInputSchema>;

export const updateComponent = ({
  componentId,
  data,
}: {
  componentId: number;
  data: UpdateComponentInput;
}): Promise<CriterionComponent> => {
  return api.put(`/criterions/components/${componentId}`, data);
};

type UseUpdateComponentOptions = {
  mutationConfig?: MutationConfig<typeof updateComponent>;
};

export const useUpdateComponent = ({
  mutationConfig,
}: UseUpdateComponentOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: (data, variables, ...args) => {
      queryClient.invalidateQueries({
        queryKey: ["criterions", "components"],
      });
      queryClient.invalidateQueries({
        queryKey: ["criterions"],
      });
      onSuccess?.(data, variables, ...args);
    },
    ...restConfig,
    mutationFn: updateComponent,
  });
};
