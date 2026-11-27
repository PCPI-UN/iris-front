import { queryOptions, useQuery } from "@tanstack/react-query";

import {
  getProjectsWithJurors,
  ProjectWithJurors,
} from "@/features/projects/api/get-projects-with-jurors";

const PAGE_SIZE = 100;

type AllProjectsWithJurorsParams = {
  eventId: number;
  state?: string;
  categoryId?: number;
};

/**
 * Fetches every page of an event's projects with their jurors. The backend's
 * `q` only matches project names, so juror-name search is done client-side
 * over the full list.
 */
export const getAllProjectsWithJurors = async ({
  eventId,
  state,
  categoryId,
}: AllProjectsWithJurorsParams): Promise<ProjectWithJurors[]> => {
  const byId = new Map<ProjectWithJurors["id"], ProjectWithJurors>();
  let currentPage = 1;
  let totalPages = 1;

  do {
    const { data, meta } = await getProjectsWithJurors({
      currentPage,
      itemsPerPage: PAGE_SIZE,
      eventId,
      state,
      categoryId,
    });

    data.forEach((project) => byId.set(project.id, project));
    totalPages = meta.totalPages ?? 1;
    currentPage++;
  } while (currentPage <= totalPages);

  return Array.from(byId.values());
};

export const getAllProjectsWithJurorsQueryOptions = (
  params: AllProjectsWithJurorsParams,
) =>
  queryOptions({
    // Shares the "projects-with-jurors" prefix so existing invalidations refresh it.
    queryKey: ["projects-with-jurors", "all", params],
    queryFn: () => getAllProjectsWithJurors(params),
  });

export const useAllProjectsWithJurors = ({
  enabled = true,
  ...params
}: AllProjectsWithJurorsParams & { enabled?: boolean }) =>
  useQuery({
    ...getAllProjectsWithJurorsQueryOptions(params),
    enabled: enabled && Boolean(params.eventId),
  });
