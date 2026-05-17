import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { api } from "@/lib/api-client";
import { MutationConfig } from "@/lib/react-query";
import { CriterionComponent } from "@/types/api";

export const createComponentInputSchema = z.object({
  name: z.string().min(1, "Required"),
  description: z.string().optional(),
  weight: z
    .number()
    .min(0, "Weight must be greater than or equal to 0")
    .max(1, "Weight must be less than or equal to 1"),
});

export type CreateComponentInput = z.infer<typeof createComponentInputSchema>;

export const createComponent = ({
  data,
}: {
  data: CreateComponentInput;
}): Promise<CriterionComponent> => {
  return api.post("/criterions/components", data);
};

type UseCreateComponentOptions = {
  mutationConfig?: MutationConfig<typeof createComponent>;
};

export const useCreateComponent = ({
  mutationConfig,
}: UseCreateComponentOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: (data, variables, ...args) => {
      queryClient.invalidateQueries({
        queryKey: ["criterions", "components"],
      });
      onSuccess?.(data, variables, ...args);
    },
    ...restConfig,
    mutationFn: createComponent,
  });
};
