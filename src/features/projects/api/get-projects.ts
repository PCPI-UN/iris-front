import { queryOptions, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import { QueryConfig } from "@/lib/react-query";
import { Meta, Project } from "@/types/api";

export const getProjects = async (
  { page, eventId, state, category }: { page?: number; eventId?: number, state?: string, category?: number } = { page: 1 }
): Promise<{ data: Project[]; meta: Meta }> => {
  const response = await api.get<{
    items: Project[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }>(`/projects/by-event/${eventId}`, { params: { page, state, category } });
  
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
  category,
}: { page?: number; eventId?: number; state?: string, category?: number } = {}) => {
  return queryOptions({
    queryKey: [
      "projects",
      { page, eventId, state, category },
    ],
    queryFn: () => getProjects({ page, eventId, state, category }),
  });
};

type UseProjectsOptions = {
  page?: number;
  eventId?: number;
  state?: string;
  category?: number;
  queryConfig?: QueryConfig<typeof getProjectsQueryOptions>;
};

export const useProjects = ({
  queryConfig,
  page,
  eventId,
  state,
  category,
}: UseProjectsOptions) => {
  return useQuery({
    ...getProjectsQueryOptions({ page, eventId, state, category }),
    ...queryConfig,
  });
};
