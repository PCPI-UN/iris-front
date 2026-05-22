import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export type RejectPayload = {
  projectId: number;
  reason: string;
  eventType: string;
};

export type RejectResponse = {
  id: number;
  reason: string;
};

export const RejectProject = async ({ projectId, reason, eventType }: RejectPayload): Promise<RejectResponse> => {
  const res = await api.patch<RejectResponse>(`/projects/${projectId}/reject`, { 
    state: "REJECTED",
    reason,
    eventType,
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
    mutationFn: ({ projectId, reason, eventType }: RejectPayload) => RejectProject({ projectId, reason, eventType }),
    onSuccess: (data, variables) => {
      // Refrescar la lista de proyectos
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
};
