import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { api } from "@/lib/api-client";
import { MutationConfig } from "@/lib/react-query";

const evaluationScoreSchema = z.object({
  criterionId: z.number().min(1),
  score: z.number().min(0),
});

export const createEvaluationInputSchema = z.object({
  projectId: z.number(),
  comments: z.string().optional(),
  scores: z
    .array(evaluationScoreSchema)
    .min(1, "Debes asignar al menos una calificación"),
});

export type CreateEvaluationInput = z.infer<typeof createEvaluationInputSchema>;

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
