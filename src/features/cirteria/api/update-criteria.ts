import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { api } from "@/lib/api-client";
import { MutationConfig } from "@/lib/react-query";
import { Criterion } from "@/types/api";

import { getCriterionQueryOptions } from "./get-criterion";

export const updateCriteriaInputSchema = z.object({
  name: z.string().min(1, "Required").optional(),
  description: z.string().min(1, "Required").optional(),
  weight: z
    .number()
    .min(0, "Weight must be greater than or equal to 0")
    .optional(),
  eventId: z.number().min(1, "Event is required").optional(),
  courseIds: z.array(z.number().min(1, "Course is required")).optional(),
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
  const response = await api.put<Criterion>(`/criterions/${criterionId}`, data);

  // If the response has a 'data' property, use it; otherwise wrap the response
  return {
    data: (response as any).data || response,
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
