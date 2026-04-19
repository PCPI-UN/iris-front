import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { api } from "@/lib/api-client";
import { withLegacyCourseIdParam } from "@/lib/compat/category-legacy";
import { MutationConfig } from "@/lib/react-query";
import { Project } from "@/types/api";

import { getProjectsQueryOptions } from "./get-projects";

export const updateProjectInputSchema = z.object({
  eventId: z.string().optional(),
  categoryId: z.string().optional(),
  name: z.string().max(255, "El nombre no puede exceder 255 caracteres").optional(),
  logo: z.string().optional(),
  description: z.string().max(3000, "La descripción no puede exceder 3000 caracteres").optional(),
  state: z.string().optional(),
  documents: z.array(z.object({
    type: z.string(),
    url: z.string(),
  })).optional(),
  participants: z.array(z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
    studentCode: z.string().optional(),
  })).optional(),
  jurorAssignments: z.array(z.object({
    memberUserId: z.string(),
  })).optional(),
});

export type UpdateProjectInput = z.infer<typeof updateProjectInputSchema>;

export const updateProject = ({
  data,
  projectId,
}: {
  data: UpdateProjectInput;
  projectId: string;
}): Promise<{ data: Project }> => {
  const payload = {
    ...data,
    ...withLegacyCourseIdParam(data.categoryId),
  };
  return api.patch(`/projects/${projectId}`, payload);
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
      queryClient.invalidateQueries({
        queryKey: ["projects"],
      });
      onSuccess?.(data, variables, ...args);
    },
    ...restConfig,
    mutationFn: updateProject,
  });
};

