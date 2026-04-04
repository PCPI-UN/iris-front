import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export type RequestChanges = {
  projectId: number;
  rejection_reason: string;
};

export type RequestChangesResponse = {
  id: number;
  rejection_reason: string;
};

export const requestChangesProject = async ({ projectId, rejection_reason }: RequestChanges) => {
  return await api.patch(`/projects/${projectId}/request-changes`, {
    state: "REQUEST_CHANGES",
    rejection_reason: rejection_reason
  });
  
};

export const useRequestChangesProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, rejection_reason }: RequestChanges) =>
      requestChangesProject({ projectId, rejection_reason }),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
};