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
      queryClient.invalidateQueries({ queryKey: ["projects-with-jurors"] });
      queryClient.invalidateQueries({ queryKey: ["event-juries"] });
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
      queryClient.invalidateQueries({ queryKey: ["projects-with-jurors"] });
      queryClient.invalidateQueries({ queryKey: ["event-juries"] });
    },
  });
};

export const reassignJurorInputSchema = z
  .object({
    projectId: z.coerce
      .number()
      .int()
      .min(1, "El ID del proyecto es obligatorio"),
    fromUserId: z.coerce
      .number()
      .int()
      .min(1, "El ID del jurado actual es obligatorio"),
    toUserId: z.coerce
      .number()
      .int()
      .min(1, "El ID del nuevo jurado es obligatorio"),
  })
  .refine((data) => data.fromUserId !== data.toUserId, {
    message: "Debes seleccionar un jurado diferente al actual",
    path: ["toUserId"],
  });

export type ReassignJurorInput = {
  projectId: number | string;
  fromUserId: number | string;
  toUserId: number | string;
};

export type ReassignJurorResponse = {
  ok?: boolean;
  changed?: boolean;
  message?: string;
};

/**
 * Replaces an assigned juror with another available juror on a project
 * (PATCH /projects/reassign-juror).
 */
export const reassignJuror = (
  input: ReassignJurorInput,
): Promise<ReassignJurorResponse> => {
  const validatedInput = reassignJurorInputSchema.parse(input);
  return api.patch("/projects/reassign-juror", validatedInput);
};

export const useReassignJuror = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reassignJuror,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["projects-with-jurors"] });
      queryClient.invalidateQueries({ queryKey: ["event-juries"] });
    },
  });
};
