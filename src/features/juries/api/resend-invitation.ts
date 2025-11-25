import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import { MutationConfig } from "@/lib/react-query";

type ResendInvitationResponse = {
  message: string;
};

export const resendInvitation = ({
  invitationId,
}: {
  invitationId: string;
}): Promise<ResendInvitationResponse> => {
  return api.post(`/invitations/${invitationId}/resend`);
};

type UseResendInvitationOptions = {
  mutationConfig?: MutationConfig<typeof resendInvitation>;
};

export const useResendInvitation = ({
  mutationConfig,
}: UseResendInvitationOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: (data, variables, ...args) => {
      queryClient.invalidateQueries({
        queryKey: ["jury-invitations"],
      });
      onSuccess?.(data, variables, ...args);
    },
    ...restConfig,
    mutationFn: resendInvitation,
  });
};
