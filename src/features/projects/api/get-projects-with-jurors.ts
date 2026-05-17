import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { withLegacyCourseIdParam } from '@/lib/compat/category-legacy';
import { QueryConfig } from '@/lib/react-query';
import { Meta, Project } from '@/types/api';

export type ProjectJuror = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

export type ProjectParticipantSummary = {
  userId: number;
  projectId: number;
  studentCode?: string;
};

export type ProjectPendingParticipantSummary = {
  pendingId: number;
  projectId: number;
  firstName: string;
  lastName: string;
  email: string;
  studentCode?: string;
};

export type ProjectWithJurors = Project & {
  participants?: ProjectParticipantSummary[];
  pendingParticipants?: ProjectPendingParticipantSummary[];
  jurors?: ProjectJuror[];
};

export type GetProjectsByEventWithJurorsParams = {
  currentPage?: number;
  itemsPerPage?: number;
  eventId?: number;
  state?: string;
  categoryId?: number;
  q?: string;
};

export type GetProjectsByEventWithJurorsResponse = {
  data: ProjectWithJurors[];
  meta: Meta;
};

export const getProjectsWithJurors = async (
  {
    currentPage = 1,
    itemsPerPage = 10,
    eventId,
    state,
    categoryId,
    q,
  }: GetProjectsByEventWithJurorsParams = { currentPage: 1, itemsPerPage: 10 },
): Promise<GetProjectsByEventWithJurorsResponse> => {
  const response = await api.get<{
    items: ProjectWithJurors[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }>(`/projects/by-event/${eventId}/with-jurors`, {
    params: {
      currentPage,
      itemsPerPage,
      state,
      ...withLegacyCourseIdParam(categoryId),
      q,
    },
  });

  return {
    data: response.items || [],
    meta: {
      page: response.page,
      total: response.total,
      totalPages: response.totalPages,
    },
  };
};

export const getProjectsWithJurorsQueryOptions = ({
  currentPage = 1,
  itemsPerPage = 10,
  eventId,
  state,
  categoryId,
  q,
}: GetProjectsByEventWithJurorsParams = {}) => {
  return queryOptions({
    queryKey: [
      'projects-with-jurors',
      { currentPage, itemsPerPage, eventId, state, categoryId, q },
    ],
    queryFn: () =>
      getProjectsWithJurors({
        currentPage,
        itemsPerPage,
        eventId,
        state,
        categoryId,
        q,
      }),
  });
};

type UseProjectsWithJurorsOptions = {
  currentPage?: number;
  itemsPerPage?: number;
  eventId?: number;
  state?: string;
  categoryId?: number;
  q?: string;
  queryConfig?: QueryConfig<typeof getProjectsWithJurorsQueryOptions>;
};

export const useProjectsWithJurors = ({
  queryConfig,
  currentPage,
  itemsPerPage,
  eventId,
  state,
  categoryId,
  q,
}: UseProjectsWithJurorsOptions = {}) => {
  return useQuery({
    ...getProjectsWithJurorsQueryOptions({
      currentPage,
      itemsPerPage,
      eventId,
      state,
      categoryId,
      q,
    }),
    ...queryConfig,
  });
};