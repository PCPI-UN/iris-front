import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { api } from "@/lib/api-client";
import { withLegacyCourseIdParam } from "@/lib/compat/category-legacy";
import { MutationConfig } from "@/lib/react-query";
import { Project } from "@/types/api";

export const updateProjectInputSchema = z.object({
  eventNumber: z.string().nullable().optional(),
  courseId: z.coerce.number().int().optional(),
  name: z.string().max(255, "El nombre no puede exceder 255 caracteres").optional(),
  description: z
    .string()
    .max(3000, "La descripción no puede exceder 3000 caracteres")
    .nullable()
    .optional(),
  state: z
    .enum(["PENDING", "APPROVED", "REJECTED", "REQUEST_CHANGES"])
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
  return api.patch(`/projects/${projectId}/info`, data);
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

