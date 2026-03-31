import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export type ApproveResponse = {
  success: boolean;
  message: string;
};

export const ApproveProject = async (projectId: number): Promise<ApproveResponse> => {
  return api.patch(`/projects/${projectId}/status`, {
    state: "APPROVED",
  });
};

export const useApproveProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: number) => ApproveProject(projectId),
    onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
};
