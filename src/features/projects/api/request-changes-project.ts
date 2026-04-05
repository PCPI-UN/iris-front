import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export type RequestChanges = {
  projectId: number;
  reason: string;
};

export type RequestChangesResponse = {
  id: number;
  reason: string;
};

export const requestChangesProject = async ({ projectId, reason }: RequestChanges) => {
  return await api.patch(`/projects/${projectId}/request-changes`, {
    state: "REQUEST_CHANGES",
    reason: reason
  });
  
  //MOCKAPI
  //return await api.patch(`/projects/${projectId}/status`, {
  //  state: "REQUEST_CHANGES",
  //  reason: reason
  //});
  
};

export const useRequestChangesProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, reason }: RequestChanges) =>
      requestChangesProject({ projectId, reason }),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
};