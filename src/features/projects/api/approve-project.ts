import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export type ApproveResponse = {
  success: boolean;
  message: string;
};

export const ApproveProject = async (params: { projectId: number; eventType?: string }): Promise<ApproveResponse> => {
  const { projectId, eventType } = params;

  //MOCKAPI
  //return api.patch(`/projects/${projectId}/approve`, {
  //  state: "APPROVED",
  //});
  
  //Back: include eventType in request body when provided
  const body = eventType ? { eventType } : undefined;
  return api.patch(`/projects/${projectId}/approve`, body);
};

export const useApproveProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { projectId: number; eventType?: string }) => ApproveProject(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
};
