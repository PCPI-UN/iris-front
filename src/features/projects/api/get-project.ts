import { useQuery, queryOptions } from "@tanstack/react-query";
import { z } from "zod";

import { api } from "@/lib/api-client";
import { QueryConfig } from "@/lib/react-query";
import { Project } from "@/types/api";

export const getProjectInputSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
});

export type GetProjectInput = z.infer<typeof getProjectInputSchema>;

export const getProject = async ({
  projectId,
}: GetProjectInput): Promise<Project | null> => {
  const validatedInput = getProjectInputSchema.parse({ projectId });
  const response = await api.get<{ data?: Project } | Project | null>(
    `/projects/${validatedInput.projectId}`
  );

  if (!response) {
    return null;
  }

  const envelope = response as { data?: Project };
  if (typeof response === "object" && response !== null && "data" in envelope) {
    return envelope.data ?? null;
  }

  return response as Project;
};

export const getProjectQueryOptions = (projectId: string) => {
  return queryOptions({
    queryKey: ["projects", projectId],
    queryFn: () => getProject({ projectId }),
  });
};

type UseProjectOptions = {
  projectId: string;
  queryConfig?: QueryConfig<typeof getProjectQueryOptions>;
};

export const useProject = ({ projectId, queryConfig }: UseProjectOptions) => {
  return useQuery({
    ...getProjectQueryOptions(projectId),
    ...queryConfig,
  });
};
