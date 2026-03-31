import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export type RequestChanges = {
  projectId: number;
  comment: string;
};

export type RequestChangesResponse = {
  id: number;
  comment: string;
};

export const requestChangesProject = async ({ projectId, comment }: RequestChanges) => {
  return await api.patch(`/projects/${projectId}/status`, {
    state: "REQUEST_CHANGES",
    comment: comment
  });
  
};

export const useRequestChangesProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, comment }: RequestChanges) =>
      requestChangesProject({ projectId, comment }),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
};