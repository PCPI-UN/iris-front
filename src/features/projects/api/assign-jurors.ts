import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { api } from "@/lib/api-client";

export type AssignJurorsInput = {
  userId: number;
  projectIds: number[];
};

export type AssignJurorsResponse = {
  success?: boolean;
  message?: string;
};

export const assignJurors = async (
  data: AssignJurorsInput,
): Promise<AssignJurorsResponse> => {
  return api.post("/projects/assign-jurors", data);
};

export const useAssignJurors = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: assignJurors,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
};

export const deleteJurorInputSchema = z.object({
  projectId: z.string().min(1, "El ID del proyecto es obligatorio"),
  memberUserId: z.string().min(1, "El ID del jurado es obligatorio"),
});

export type DeleteJurorInput = z.infer<typeof deleteJurorInputSchema>;

export const deleteJuror = ({
  projectId,
  memberUserId,
}: DeleteJurorInput): Promise<{ success?: boolean; message?: string }> => {
  const validatedInput = deleteJurorInputSchema.parse({
    projectId,
    memberUserId,
  });

  return api.delete(
    `/projects/${validatedInput.projectId}/jurors/${validatedInput.memberUserId}`,
  );
};

export const useDeleteJuror = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteJuror,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["event-juries"] });
    },
  });
};
