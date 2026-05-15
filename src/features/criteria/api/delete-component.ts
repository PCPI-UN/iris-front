import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import { MutationConfig } from "@/lib/react-query";

type DeleteComponentResponse = {
  success: boolean;
  message: string;
};

export const deleteComponent = ({
  componentId,
}: {
  componentId: number;
}): Promise<DeleteComponentResponse> => {
  return api.delete(`/criterions/components/${componentId}`);
};

type UseDeleteComponentOptions = {
  mutationConfig?: MutationConfig<typeof deleteComponent>;
};

export const useDeleteComponent = ({
  mutationConfig,
}: UseDeleteComponentOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: (data, variables, ...args) => {
      queryClient.invalidateQueries({
        queryKey: ["criterions", "components"],
      });
      queryClient.invalidateQueries({
        queryKey: ["criterions"],
      });
      onSuccess?.(data, variables, ...args);
    },
    ...restConfig,
    mutationFn: deleteComponent,
  });
};
