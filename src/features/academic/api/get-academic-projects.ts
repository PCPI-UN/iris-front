import { queryOptions, useQuery } from "@tanstack/react-query";

import { AcademicProjectsPage, ProjectReviewState } from "../types";
import { toReviewState } from "../utils/academic-labels";

import { api } from "@/lib/api-client";
import { QueryConfig } from "@/lib/react-query";

export type AcademicProjectsFilters = {
  eventId: number;
  state?: ProjectReviewState;
  academicCourseId?: number;
  /** Text in the project name */
  q?: string;
  page?: number;
  itemsPerPage?: number;
};

export const getAcademicProjects = async ({
  eventId,
  state,
  academicCourseId,
  q,
  page = 1,
  itemsPerPage,
}: AcademicProjectsFilters): Promise<AcademicProjectsPage> => {
  const response = await api.get<Partial<AcademicProjectsPage>>(
    "/academic/projects",
    {
      params: {
        eventId,
        state,
        academicCourseId,
        q: q?.trim() || undefined,
        currentPage: page,
        itemsPerPage,
      },
    },
  );

  return {
    items: (response?.items ?? []).map((project) => ({
      ...project,
      state: toReviewState(project.state),
    })),
    total: response?.total ?? 0,
    currentPage: response?.currentPage ?? page,
    totalPages: Math.max(1, response?.totalPages ?? 1),
  };
};

export const getAcademicProjectsQueryOptions = (
  filters: AcademicProjectsFilters,
) =>
  queryOptions({
    queryKey: ["academic", "projects", filters],
    queryFn: () => getAcademicProjects(filters),
  });

type UseAcademicProjectsOptions = {
  filters: AcademicProjectsFilters;
  queryConfig?: QueryConfig<typeof getAcademicProjectsQueryOptions>;
};

export const useAcademicProjects = ({
  filters,
  queryConfig,
}: UseAcademicProjectsOptions) =>
  useQuery({ ...getAcademicProjectsQueryOptions(filters), ...queryConfig });
