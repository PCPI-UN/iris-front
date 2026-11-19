import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { api } from "@/lib/api-client";
import { MutationConfig } from "@/lib/react-query";
import { JuryInvitation } from "@/types/api";

export const createJuryInvitationInputSchema = z.object({
  email: z
    .string()
    .min(1, "Este campo es obligatorio")
    .email("Correo electrónico inválido"),
  firstName: z.string().min(1, "El nombre es obligatorio"),
  lastName: z.string().min(1, "El apellido es obligatorio"),
  eventId: z.number().min(1, "El evento es obligatorio"),
  eventType: z.enum(["Exposition", "Competition"]),
});

export type CreateJuryInvitationInput = z.infer<
  typeof createJuryInvitationInputSchema
>;

type CreateJuryInvitationResponse = {
  message: string;
  data: JuryInvitation;
};

export const createJuryInvitation = ({
  data,
}: {
  data: CreateJuryInvitationInput;
}): Promise<CreateJuryInvitationResponse> => {
  const { eventId, ...invitationData } = data;

  return api.post(`/invitations/events/${eventId}/jurors`, invitationData);
};

type UseCreateJuryInvitationOptions = {
  mutationConfig?: MutationConfig<typeof createJuryInvitation>;
};

export const useCreateJuryInvitation = ({
  mutationConfig,
}: UseCreateJuryInvitationOptions = {}) => {
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
    mutationFn: createJuryInvitation,
  });
};
