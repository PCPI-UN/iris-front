import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export type RejectPayload = {
  projectId: number;
  reason: string;
};

export type RejectResponse = {
  id: number;
  reason: string;
};

export const RejectProject = async ({ projectId, reason }: RejectPayload): Promise<RejectResponse> => {
  const res = await api.patch<RejectResponse>(`/projects/${projectId}/reject`, { 
    state: "REJECTED",
    reason: reason
  });
  return res;

  //MOCKAPI
  //const res = await api.patch<RejectResponse>(`/projects/${projectId}/status`, { 
  //  state: "REJECTED",
  //  comment: reason
  //});
};

export const useRejectProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, reason }: RejectPayload) => RejectProject({ projectId, reason }),
    onSuccess: (data, variables) => {
      // Refrescar la lista de proyectos
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
};
