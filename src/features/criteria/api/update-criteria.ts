import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { getCriterionQueryOptions } from "./get-criterion";

import { api } from "@/lib/api-client";
import {
  normalizeCategoryIds,
  withLegacyCourseIdsParam,
} from "@/lib/compat/category-legacy";
import { MutationConfig } from "@/lib/react-query";
import { Criterion } from "@/types/api";

export const updateCriteriaInputSchema = z.object({
  name: z
    .string()
    .min(1, "Este campo es obligatorio")
    .max(100, "Máximo 100 caracteres")
    .optional(),
  description: z.string().optional(),
  // Relative to the other criteria of the same component and category
  weight: z.number().positive("El peso debe ser mayor que 0").optional(),
  eventId: z.number().min(1, "El evento es obligatorio").optional(),

  categoryIds: z
    .array(z.number().min(1, "La categoría es obligatoria"))
    .optional(),
  category: z.string().optional(),
  componentId: z.number().min(1).nullable().optional(),
});

export type UpdateCriteriaInput = z.infer<typeof updateCriteriaInputSchema>;

export const updateCriteria = async ({
  data,
  criterionId,
}: {
  data: UpdateCriteriaInput;
  criterionId: number;
}): Promise<{ data: Criterion }> => {
  const payload = {
    ...data,
    ...withLegacyCourseIdsParam(data.categoryIds),
  };
  const response = await api.put<Criterion>(
    `/criterions/${criterionId}`,
    payload,
  );
  const criterion = ((response as any).data || response) as Criterion;

  return {
    data: {
      ...criterion,
      categoryIds: normalizeCategoryIds(criterion) as number[],
    },
  };
};

type UseUpdateCriteriaOptions = {
  mutationConfig?: MutationConfig<typeof updateCriteria>;
};

export const useUpdateCriteria = ({
  mutationConfig,
}: UseUpdateCriteriaOptions = {}) => {
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: (data, variables, ...args) => {
      queryClient.invalidateQueries({
        queryKey: ["criterions"],
      });
      queryClient.refetchQueries({
        queryKey: getCriterionQueryOptions(variables.criterionId).queryKey,
      });
      onSuccess?.(data, variables, ...args);
    },
    ...restConfig,
    mutationFn: updateCriteria,
  });
};
