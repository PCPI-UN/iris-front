import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { api } from "@/lib/api-client";
import { MutationConfig } from "@/lib/react-query";
import { Project } from "@/types/api";

export const updateProjectInputSchema = z.object({
  eventId: z.string().optional(),
  categoryId: z.string().optional(),
  projectCode: z.string().max(255, "El código no puede exceder 255 caracteres").optional(),
  name: z.string().max(255, "El nombre no puede exceder 255 caracteres").optional(),
  logo: z.string().optional(),
  description: z.string().max(3000, "La descripción no puede exceder 3000 caracteres").optional(),
  state: z.string().optional(),
  documents: z
    .array(
      z.object({
        type: z.string(),
        url: z.string(),
      })
    )
    .optional(),
  participants: z
    .array(
      z.object({
        firstName: z.string(),
        lastName: z.string(),
        email: z.string(),
        studentCode: z.string().optional(),
      })
    )
    .optional(),
  jurorAssignments: z
    .array(
      z.object({
        memberUserId: z.string(),
      })
    )
    .optional(),
});

export type UpdateProjectInput = z.infer<typeof updateProjectInputSchema>;

export const updateProject = ({
  data,
  projectId,
}: {
  data: UpdateProjectInput;
  projectId: string;
}): Promise<{ data: Project }> => {
  const { projectCode, ...projectInfo } = data;

  return api
    .patch<{ data: Project }>(`/projects/${projectId}/info`, projectInfo)
    .then(async (response) => {
      if (projectCode !== undefined) {
        await api.patch(`/projects/${projectId}/code`, { projectCode });
      }

      return response;
    });
};

type UseUpdateProjectOptions = {
  mutationConfig?: MutationConfig<typeof updateProject>;
};

export const useUpdateProject = ({
  mutationConfig,
}: UseUpdateProjectOptions = {}) => {
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: (data, variables, ...args) => {
      // Invalidate project lists and the current user's project query so UI updates in-place
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["my-project"], exact: false });
      onSuccess?.(data, variables, ...args);
    },
    ...restConfig,
    mutationFn: updateProject,
  });
};

