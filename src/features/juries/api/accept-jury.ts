import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { api } from "@/lib/api-client";
import { MutationConfig } from "@/lib/react-query";

export const acceptInvitationInputSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  studentCode: z.string().optional(),
  microsoftToken: z.string().optional(),
});

export type AcceptInvitationInput = z.infer<typeof acceptInvitationInputSchema>;

type AcceptInvitationResponse = {
  message: string;
};

export const acceptInvitation = ({
  data,
}: {
  data: AcceptInvitationInput;
}): Promise<AcceptInvitationResponse> => {
  return api.post(`/invitations/accept`, data);
};

type UseAcceptInvitationOptions = {
  mutationConfig?: MutationConfig<typeof acceptInvitation>;
};

export const useAcceptInvitation = ({
  mutationConfig,
}: UseAcceptInvitationOptions = {}) => {
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
    mutationFn: acceptInvitation,
  });
};
