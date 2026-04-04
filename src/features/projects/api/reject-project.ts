import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export type RejectPayload = {
  projectId: number;
  rejection_reason: string;
};

export type RejectResponse = {
  id: number;
  rejection_reason: string;
};

export const RejectProject = async ({ projectId, rejection_reason }: RejectPayload): Promise<RejectResponse> => {
  const res = await api.patch<RejectResponse>(`/projects/${projectId}/reject`, { 
    state: "REJECTED",
    rejection_reason: rejection_reason
  });
  return res;

  //MOCKAPI
  //const res = await api.patch<RejectResponse>(`/projects/${projectId}/status`, { 
  //  state: "REJECTED",
  //  comment: rejection_reason
  //});
};

export const useRejectProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, rejection_reason }: RejectPayload) => RejectProject({ projectId, rejection_reason }),
    onSuccess: (data, variables) => {
      // Refrescar la lista de proyectos
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
};
