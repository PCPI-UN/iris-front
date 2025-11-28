import { api } from "@/lib/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MutationConfig } from "@/lib/react-query";
import { z } from "zod";

const evaluationScoreSchema = z.object({
  criterionId: z.number().min(1),  
  score: z.number().min(0),         
});


export const createEvaluationInputSchema = z.object({
  projectId: z.number(),          
  comments: z.string().optional(),
  scores: z
    .array(evaluationScoreSchema)
    .min(1, "At least one score is required"),
});

export type CreateEvaluationInput = z.infer<
  typeof createEvaluationInputSchema
>;

export const createEvaluation = ({
  data,
}: {
  data: CreateEvaluationInput;
}): Promise<any> => {
  return api.post(`/evaluations/projects/evaluate`, data);
};

type UseCreateEvaluationOptions = {
  mutationConfig?: MutationConfig<typeof createEvaluation>;
};

export const useCreateEvaluation = ({
  mutationConfig,
}: UseCreateEvaluationOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: createEvaluation,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: ["projects"],
      });

      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
