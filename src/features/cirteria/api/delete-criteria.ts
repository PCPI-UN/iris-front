import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import { Criterion } from "@/types/api";
import { MutationConfig } from "@/lib/react-query";

import { getCriteriaQueryOptions } from "./get-criteria";

export const deleteCriteria = ({
  criterionId,
}: {
  criterionId: number;
}): Promise<{ data: Criterion }> => {
  return api.delete(`/criterions/${criterionId}`);
};

type UseDeleteCriteriaOptions = {
  mutationConfig?: MutationConfig<typeof deleteCriteria>;
};

export const useDeleteCriteria = ({
  mutationConfig,
}: UseDeleteCriteriaOptions = {}) => {
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
    mutationFn: deleteCriteria,
  });
};
