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
  criterionCourse: z
    .array(
      z.object({
        courseId: z.number().min(1, "Course is required"),
      })
    )
    .optional(),
});

export type UpdateCriteriaInput = z.infer<typeof updateCriteriaInputSchema>;

export const updateCriteria = ({
  data,
  criterionId,
}: {
  data: UpdateCriteriaInput;
  criterionId: number;
}): Promise<{ data: Criterion }> => {
  return api.put(`/criterions/${criterionId}`, data);
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
        queryKey: getCriterionQueryOptions(data.data.id).queryKey,
      });
      onSuccess?.(data, variables, ...args);
    },
    ...restConfig,
    mutationFn: updateCriteria,
  });
};
