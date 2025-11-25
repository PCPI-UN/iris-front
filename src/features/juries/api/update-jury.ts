import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { api } from "@/lib/api-client";
import { MutationConfig } from "@/lib/react-query";
import { Jury } from "@/types/api";

export const updateJuryInputSchema = z.object({
  email: z.string().min(1, "Required").email("Invalid email address").optional(),
  eventIds: z.array(z.string()).min(1, "At least one event is required").optional(),
  projectIds: z.array(z.string()).optional(),
  invitationStatus: z.enum(["pending", "accepted", "declined"]).optional(),
});

export type UpdateJuryInput = z.infer<typeof updateJuryInputSchema>;

export const updateJury = ({
  juryId,
  data,
}: {
  juryId: string;
  data: UpdateJuryInput;
}): Promise<{ data: Jury }> => {
  return api.patch(`/juries/${juryId}`, data);
};

type UseUpdateJuryOptions = {
  mutationConfig?: MutationConfig<typeof updateJury>;
};

export const useUpdateJury = ({
  mutationConfig,
}: UseUpdateJuryOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: (data, variables, ...args) => {
      queryClient.invalidateQueries({
        queryKey: ["juries"],
      });
      onSuccess?.(data, variables, ...args);
    },
    ...restConfig,
    mutationFn: updateJury,
  });
};

