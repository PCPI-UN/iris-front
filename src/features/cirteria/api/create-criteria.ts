import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { api } from "@/lib/api-client";
import { MutationConfig } from "@/lib/react-query";
import { Evaluation } from "@/types/api";

import { getCriteriaQueryOptions } from "./get-criteria";

export const createCriteriaInputSchema = z.object({
  eventId: z.number().min(1, "Event is required"),
  name: z.string().min(1, "Required"),
  description: z.string().min(1, "Required"),
  weight: z
    .number()
    .min(0, "Weight must be greater than or equal to 0")
    .max(1, "Weight must be less than or equal to 1"),
  courseIds: z
    .array(z.number().min(1, "Course is required"))
    .min(1, "At least one course is required"),
});

export type CreateCriteriaInput = z.infer<typeof createCriteriaInputSchema>;

export const createCriteria = ({
  data,
}: {
  data: CreateCriteriaInput;
}): Promise<{ data: Evaluation }> => {
  return api.post("/criterions", data);
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
