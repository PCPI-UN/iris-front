import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

type AcceptInvitationInput = {
  token: string;
};

export const acceptInvitation = async (
  data: AcceptInvitationInput
): Promise<void> => {
  return api.post("/invitations/accept", data);
};

export const useAcceptInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: acceptInvitation,
    onSuccess: () => {
      // Invalidar las queries de invitaciones para refrescar la lista
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      // Invalidar las queries de eventos del usuario para que aparezca el evento aceptado en el dashboard
      queryClient.invalidateQueries({ queryKey: ["events", "my-events"] });
    },
  });
};
