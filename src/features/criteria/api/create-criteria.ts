import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { api } from "@/lib/api-client";
import { withLegacyCourseIdsParam } from "@/lib/compat/category-legacy";
import { MutationConfig } from "@/lib/react-query";
import { Criterion } from "@/types/api";

export const createCriteriaInputSchema = z.object({
  eventId: z.number().min(1, "El evento es obligatorio"),
  name: z
    .string()
    .min(1, "Este campo es obligatorio")
    .max(100, "Máximo 100 caracteres"),
  description: z.string().optional(),
  // Relative to the other criteria of the same component and category
  weight: z.number().positive("El peso debe ser mayor que 0"),

  categoryIds: z
    .array(z.number().min(1, "La categoría es obligatoria"))
    .min(1, "Debes seleccionar al menos una categoría"),
  category: z.string().optional(),
  componentId: z.number().min(1, "El componente es obligatorio"),
});

export type CreateCriteriaInput = z.infer<typeof createCriteriaInputSchema>;

export const createCriteria = ({
  data,
}: {
  data: CreateCriteriaInput;
}): Promise<{ data: Criterion }> => {
  const payload = {
    ...data,
    ...withLegacyCourseIdsParam(data.categoryIds),
  };

  return api.post("/criterions", payload);
};

type UseCreateCriteriaOptions = {
  mutationConfig?: MutationConfig<typeof createCriteria>;
};

export const useCreateCriteria = ({
  mutationConfig,
}: UseCreateCriteriaOptions = {}) => {
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: (data, variables, ...args) => {
      queryClient.invalidateQueries({
        queryKey: ["criterions"],
      });
      onSuccess?.(data, variables, ...args);
    },
    ...restConfig,
    mutationFn: createCriteria,
  });
};
