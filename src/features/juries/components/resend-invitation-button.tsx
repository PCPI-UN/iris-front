"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/components/ui/notifications";
import { useResendInvitation } from "../api/resend-invitation";
import type { JuryInvitation } from "@/types/api";
import { useQueryClient } from "@tanstack/react-query";

type ResendInvitationButtonProps = {
  invitation: JuryInvitation;
};

export const ResendInvitationButton = ({
  invitation,
}: ResendInvitationButtonProps) => {
  const { addNotification } = useNotifications();
  const queryClient = useQueryClient();

  const resendInvitationMutation = useResendInvitation({
    mutationConfig: {
      onSuccess: async () => {
        addNotification({
          type: "success",
          title: "Invitación reenviada",
          message: `Se ha reenviado la invitación a ${invitation.email}`,
        });
        await queryClient.invalidateQueries({ queryKey: ["jury-invitations"] });
      },
      onError: (error) => {
        addNotification({
          type: "error",
          title: "Error al reenviar invitación",
          message: error.message,
        });
      },
    },
  });

  const handleResend = () => {
    resendInvitationMutation.mutate({ invitationId: invitation.id });
  };

  return (
    <Button
      size="sm"
      variant="light"
      color="primary"
      onPress={handleResend}
      isIconOnly
      isLoading={resendInvitationMutation.isPending}
      disabled={resendInvitationMutation.isPending}
      title="Reenviar invitación"
    >
      <RefreshCw size={16} />
    </Button>
  );
};
