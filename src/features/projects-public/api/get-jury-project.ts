import { queryOptions, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import { QueryConfig } from "@/lib/react-query";
import { Project } from "@/types/api";

/** The juror's submitted evaluation; `score` is the level (1-4) picked for each criterion */
export type JuryEvaluation = {
  id: number;
  grade: number;
  comments?: string;
  date?: string;
  scores: { criterionId: number; score: number; weight?: number }[];
};

export type JuryAssignedProject = Project & {
  evaluated: boolean;
  evaluation?: JuryEvaluation;
  projectCode?: string;
};

type AssignedProjectsPage = {
  items?: JuryAssignedProject[];
  page: number;
  pageSize: number;
  total: number;
};

export const ASSIGNED_PROJECTS_PAGE_SIZE = 50;
/** Stops the loop if the backend keeps answering with less than `total` */
const MAX_PAGES = 20;

/**
 * Every project assigned to the juror in the event. The endpoint is paginated
 * (20 per page by default), so it keeps asking until it has `total` projects.
 */
export const getJuryAssignedProjects = async (
  eventId: number,
): Promise<JuryAssignedProject[]> => {
  const projects: JuryAssignedProject[] = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    const response = await api.get<AssignedProjectsPage>(
      `/projects/assigned-projects`,
      { params: { eventId, page, pageSize: ASSIGNED_PROJECTS_PAGE_SIZE } },
    );
    const items = response.items ?? [];

    projects.push(...items);

    if (items.length === 0 || projects.length >= response.total) break;
  }

  return projects;
};

// Starts with "projects": sending an evaluation invalidates it (`useCreateEvaluation`)
export const getJuryAssignedProjectsQueryOptions = (eventId: number) => {
  return queryOptions({
    queryKey: ["projects", "jury-assigned", eventId],
    queryFn: () => getJuryAssignedProjects(eventId),
  });
};

type UseJuryAssignedProjectsOptions = {
  eventId: number;
  queryConfig?: QueryConfig<typeof getJuryAssignedProjectsQueryOptions>;
};

export const useJuryAssignedProjects = ({
  eventId,
  queryConfig,
}: UseJuryAssignedProjectsOptions) => {
  return useQuery({
    ...getJuryAssignedProjectsQueryOptions(eventId),
    enabled: Number.isFinite(eventId) && eventId > 0,
    ...queryConfig,
  });
};
