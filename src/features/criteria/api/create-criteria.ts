import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { api } from "@/lib/api-client";
import { withLegacyCourseIdsParam } from "@/lib/compat/category-legacy";
import { MutationConfig } from "@/lib/react-query";
import { Criterion } from "@/types/api";

export const createCriteriaInputSchema = z.object({
  eventId: z.number().min(1, "Event is required"),
  name: z.string().min(1, "Required").max(100, "Maximum 100 characters"),
  description: z.string().optional(),
  weight: z
    .number()
    .min(0, "Weight must be greater than or equal to 0")
    .max(1, "Weight must be less than or equal to 1"),

  categoryIds: z
    .array(z.number().min(1, "Category is required"))
    .min(1, "At least one category is required"),
  category: z.string().optional(),
  componentId: z.number().min(1).optional(),
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
