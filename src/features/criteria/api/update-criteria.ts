import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { api } from "@/lib/api-client";
import {
  normalizeCategoryIds,
  withLegacyCourseIdsParam,
} from "@/lib/compat/category-legacy";
import { MutationConfig } from "@/lib/react-query";
import { Criterion } from "@/types/api";

import { getCriterionQueryOptions } from "./get-criterion";

export const updateCriteriaInputSchema = z.object({
  name: z
    .string()
    .min(1, "Required")
    .max(100, "Maximum 100 characters")
    .optional(),
  description: z.string().optional(),
  weight: z
    .number()
    .min(0, "Weight must be greater than or equal to 0")
    .max(1, "Weight must be less than or equal to 1")
    .optional(),
  eventId: z.number().min(1, "Event is required").optional(),

  categoryIds: z.array(z.number().min(1, "Category is required")).optional(),
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
