import { queryOptions, useQuery } from "@tanstack/react-query";

import { AcademicProfile, AcademicProjectDetail } from "../types";
import { toReviewState } from "../utils/academic-labels";

import { api } from "@/lib/api-client";
import { QueryConfig } from "@/lib/react-query";

/** A project of the profile's scope with its evaluation; 404 when it does not exist or is outside it */
export const getAcademicProject = async (
  profile: AcademicProfile,
  projectId: number,
): Promise<AcademicProjectDetail> => {
  const project = await api.get<AcademicProjectDetail>(
    `/academic/projects/${projectId}`,
    { params: { profile }, suppressErrorNotification: true },
  );

  return { ...project, state: toReviewState(project.state) };
};

export const getAcademicProjectQueryOptions = (
  profile: AcademicProfile,
  projectId: number,
) =>
  queryOptions({
    queryKey: ["academic", profile, "project", projectId],
    queryFn: () => getAcademicProject(profile, projectId),
  });

type UseAcademicProjectOptions = {
  profile: AcademicProfile;
  projectId: number;
  queryConfig?: QueryConfig<typeof getAcademicProjectQueryOptions>;
};

export const useAcademicProject = ({
  profile,
  projectId,
  queryConfig,
}: UseAcademicProjectOptions) =>
  useQuery({
    ...getAcademicProjectQueryOptions(profile, projectId),
    enabled: Number.isInteger(projectId) && projectId > 0,
    ...queryConfig,
  });
