import { queryOptions, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import { QueryConfig } from "@/lib/react-query";
import { Meta, Project } from "@/types/api";

export const getJuryProjects = async (
  { page, eventId}: { page?: number; eventId?: number } = { page: 1 }
): Promise<{ data: Project[]; meta: Meta }> => {
  const response = await api.get<{
      items: Project[];
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    }>(`/projects/assigned-projects`, { params: { page, eventId } });

  return {
    data: response.items || [],
    meta: {
      page: response.page,
      total: response.total,
      totalPages: response.totalPages,
    },
  };
};

export const getJuryProjectsQueryOptions = ({ page = 1 , eventId }: { page?: number; eventId?: number } = {}) => {
  return queryOptions({
    queryKey: ["projects", { page, eventId }],
    queryFn: () => getJuryProjects({ page, eventId }),
  });
};

type UseProjectsOptions = {
  page?: number;
  eventId?: number;
  queryConfig?: QueryConfig<typeof getJuryProjectsQueryOptions>;
};

export const useJuryProjects = ({ queryConfig, page, eventId }: UseProjectsOptions) => {
  return useQuery({
    ...getJuryProjectsQueryOptions({ page, eventId }),
    ...queryConfig,
  });
};
