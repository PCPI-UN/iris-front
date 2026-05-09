import { queryOptions, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import { QueryConfig } from "@/lib/react-query";
import { Meta, Project } from "@/types/api";

//MOCKAPI -> category
//BACK -> courseId

export type ProjectJuror = {
  id?: string | number;
  firstName?: string;
  lastName?: string;
  email?: string;
};

export type ProjectWithJurors = Project & {
  jurors?: ProjectJuror[];
};

export const getProjects = async (
  { page, eventId, state, courseId }: { page?: number; eventId?: number, state?: string, courseId?: number } = { page: 1 }
): Promise<{ data: ProjectWithJurors[]; meta: Meta }> => {
  const response = await api.get<{
    items: ProjectWithJurors[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }>(`/projects/by-event/${eventId}/with-jurors`, { params: { page, state, courseId } });
  
  return {
    data: response.items || [],
    meta: {
      page: response.page,
      total: response.total,
      totalPages: response.totalPages,
    },
  };
};


export const getProjectsQueryOptions = ({
  page = 1,
  eventId,
  state,
  courseId,
}: { page?: number; eventId?: number; state?: string, courseId?: number } = {}) => {
  return queryOptions({
    queryKey: [
      "projects",
      { page, eventId, state, courseId },
    ],
    queryFn: () => getProjects({ page, eventId, state, courseId }),
  });
};

type UseProjectsOptions = {
  page?: number;
  eventId?: number;
  state?: string;
  courseId?: number;
  queryConfig?: QueryConfig<typeof getProjectsQueryOptions>;
};

export const useProjects = ({
  queryConfig,
  page,
  eventId,
  state,
  courseId
}: UseProjectsOptions) => {
  return useQuery({
    ...getProjectsQueryOptions({ page, eventId, state, courseId }),
    ...queryConfig,
  });
};
