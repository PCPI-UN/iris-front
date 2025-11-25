// create-project.ts
import { api } from "@/lib/api-client";
import { Project } from "@/types/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MutationConfig } from "@/lib/react-query";
import { getProjectsQueryOptions } from "./get-projects";
import { z } from "zod";

// Schema de entrada
export const createProjectInputSchema = z.object({
  name: z.string().min(2).max(255),
  description: z.string().max(3000),
  eventId: z.string().min(1),
  courseId: z.string().min(1),
  participants: z.string().min(1), // JSON string
  documents: z.string().min(1),    // JSON string
  //files: z.array(z.instanceof(File)).min(1),
});

export type CreateProjectInput = z.infer<typeof createProjectInputSchema>;

// Función para enviar al backend usando FormData
export const createProject = ({ data }: { data: FormData }): Promise<Project> => {
  return api.post(`/projects`, data);
};

// Hook para la mutación
type UseCreateProjectOptions = {
  mutationConfig?: MutationConfig<typeof createProject>;
};

export const useCreateProject = ({ mutationConfig }: UseCreateProjectOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: createProject,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: getProjectsQueryOptions().queryKey });
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
