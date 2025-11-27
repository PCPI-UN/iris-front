import { queryOptions, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import { QueryConfig } from "@/lib/react-query";
import { Meta, Project } from "@/types/api";

export const getJuryProjects = async (
  { page, jurorId, eventId}: { page?: number; jurorId?: string; eventId?: number } = { page: 1 }
): Promise<{ data: Project[]; meta: Meta }> => {
  const response = await api.get<{
      items: Project[];
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    }>(`/projects/assigned-projects`, { params: { page, jurorId, eventId } });

  return {
    data: response.items || [],
    meta: {
      page: response.page,
      total: response.total,
      totalPages: response.totalPages,
    },
  };
};

export const getJuryProjectsQueryOptions = ({ page = 1, jurorId , eventId }: { page?: number; jurorId?: string; eventId?: number } = {}) => {
  return queryOptions({
    queryKey: ["projects", { page, jurorId, eventId }],
    queryFn: () => getJuryProjects({ page, jurorId, eventId }),
  });
};

type UseProjectsOptions = {
  page?: number;
  jurorId?: string;
  eventId?: number;
  queryConfig?: QueryConfig<typeof getJuryProjectsQueryOptions>;
};

export const useJuryProjects = ({ queryConfig, page, jurorId, eventId }: UseProjectsOptions) => {
  return useQuery({
    ...getJuryProjectsQueryOptions({ page, jurorId, eventId }),
    ...queryConfig,
  });
};
