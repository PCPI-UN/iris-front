import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { api } from "@/lib/api-client";
import { MutationConfig } from "@/lib/react-query";
import { CriterionComponent } from "@/types/api";

export const updateComponentInputSchema = z.object({
  name: z.string().min(1, "Este campo es obligatorio").optional(),
  eventId: z
    .number()
    .int()
    .positive("El ID del evento es obligatorio")
    .optional(),
  description: z.string().optional(),
  weight: z
    .number()
    .min(0, "La ponderación debe ser mayor o igual a 0")
    .max(1, "La ponderación debe ser menor o igual a 1")
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
