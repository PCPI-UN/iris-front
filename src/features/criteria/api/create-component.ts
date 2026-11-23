import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { api } from "@/lib/api-client";
import { MutationConfig } from "@/lib/react-query";
import { CriterionComponent } from "@/types/api";

export const createComponentInputSchema = z.object({
  name: z.string().min(1, "Este campo es obligatorio"),
  eventId: z.number().int().positive("El ID del evento es obligatorio"),
  description: z.string().optional(),
  weight: z
    .number()
    .gt(0, "La ponderación debe ser mayor que 0")
    .max(1, "La ponderación debe ser menor o igual a 1"),
});

export type CreateComponentInput = z.infer<typeof createComponentInputSchema>;

export const createComponent = ({
  data,
}: {
  data: CreateComponentInput;
}): Promise<CriterionComponent> => {
  // The form shows the error itself
  return api.post("/criterions/components", data, {
    suppressErrorNotification: true,
  });
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
