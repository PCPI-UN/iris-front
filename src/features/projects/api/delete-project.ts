import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { api } from "@/lib/api-client";
import { Project } from "@/types/api";
import { MutationConfig } from "@/lib/react-query";

export const deleteProjectInputSchema = z.object({
  projectId: z.string().min(1, "El ID del proyecto es obligatorio"),
});

export type DeleteProjectInput = z.infer<typeof deleteProjectInputSchema>;

export const deleteProject = ({
  projectId,
}: DeleteProjectInput): Promise<{ data: Project }> => {
  const validatedInput = deleteProjectInputSchema.parse({ projectId });

  return api.delete(`/projects/${validatedInput.projectId}`);
};

type UseDeleteProjectOptions = {
  mutationConfig?: MutationConfig<typeof deleteProject>;
};

export const useDeleteProject = ({
  mutationConfig,
}: UseDeleteProjectOptions = {}) => {
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: (data, variables, ...args) => {
      queryClient.invalidateQueries({
        queryKey: ["projects"],
      });
      onSuccess?.(data, variables, ...args);
    },
    ...restConfig,
    mutationFn: deleteProject,
  });
};
