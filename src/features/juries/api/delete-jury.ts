import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import { MutationConfig } from "@/lib/react-query";
import { Jury } from "@/types/api";

export const deleteJury = ({
  juryId,
}: {
  juryId: string;
}): Promise<{ data: Jury }> => {
  return api.delete(`/juries/${juryId}`);
};

type UseDeleteJuryOptions = {
  mutationConfig?: MutationConfig<typeof deleteJury>;
};

export const useDeleteJury = ({
  mutationConfig,
}: UseDeleteJuryOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: (data, variables, ...args) => {
      queryClient.invalidateQueries({
        queryKey: ["juries"],
      });
      onSuccess?.(data, variables, ...args);
    },
    ...restConfig,
    mutationFn: deleteJury,
  });
};

