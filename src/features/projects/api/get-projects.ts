import { queryOptions, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import { QueryConfig } from "@/lib/react-query";
import { Meta, Project } from "@/types/api";

export const getProjects = async (
  { page, eventId, state }: { page?: number; eventId?: number, state?: string } = { page: 1 }
): Promise<{ data: Project[]; meta: Meta }> => {
  const response = await api.get<{
    items: Project[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }>(`/projects/by-event/${eventId}`, { params: { page, state } });
  
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
}: { page?: number; eventId?: number; state?: string } = {}) => {
  return queryOptions({
    queryKey: [
      "projects",
      { page, eventId, state },
    ],
    queryFn: () => getProjects({ page, eventId, state }),
  });
};

type UseProjectsOptions = {
  page?: number;
  eventId?: number;
  state?: string;
  queryConfig?: QueryConfig<typeof getProjectsQueryOptions>;
};

export const useProjects = ({
  queryConfig,
  page,
  eventId,
  state,
}: UseProjectsOptions) => {
  return useQuery({
    ...getProjectsQueryOptions({ page, eventId, state }),
    ...queryConfig,
  });
};
