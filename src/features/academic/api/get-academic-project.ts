import { queryOptions, useQuery } from "@tanstack/react-query";

import { AcademicProject } from "../types";
import { toReviewState } from "../utils/academic-labels";

import { api } from "@/lib/api-client";
import { QueryConfig } from "@/lib/react-query";

/** A project of the session's scope; 404 when it does not exist or is outside it */
export const getAcademicProject = async (
  projectId: number,
): Promise<AcademicProject> => {
  const project = await api.get<AcademicProject>(
    `/academic/projects/${projectId}`,
    { suppressErrorNotification: true },
  );

  return { ...project, state: toReviewState(project.state) };
};

export const getAcademicProjectQueryOptions = (projectId: number) =>
  queryOptions({
    queryKey: ["academic", "project", projectId],
    queryFn: () => getAcademicProject(projectId),
  });

type UseAcademicProjectOptions = {
  projectId: number;
  queryConfig?: QueryConfig<typeof getAcademicProjectQueryOptions>;
};

export const useAcademicProject = ({
  projectId,
  queryConfig,
}: UseAcademicProjectOptions) =>
  useQuery({
    ...getAcademicProjectQueryOptions(projectId),
    enabled: Number.isInteger(projectId) && projectId > 0,
    ...queryConfig,
  });
