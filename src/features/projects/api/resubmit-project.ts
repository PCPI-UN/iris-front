import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export const resubmitProject = async ({
  projectId,
}: {
  projectId: number;
}) => {
  return api.post(`/projects/${projectId}/resubmit`);
};

export const useResubmitProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: resubmitProject,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["user-projects"],
      });

      queryClient.invalidateQueries({
        queryKey: ["projects"],
      });
    },
  });
};