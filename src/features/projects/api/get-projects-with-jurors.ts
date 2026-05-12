import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
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
  courseId?: number;
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
    courseId,
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
      courseId,
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
  courseId,
  q,
}: GetProjectsByEventWithJurorsParams = {}) => {
  return queryOptions({
    queryKey: [
      'projects-with-jurors',
      { currentPage, itemsPerPage, eventId, state, courseId, q },
    ],
    queryFn: () =>
      getProjectsWithJurors({
        currentPage,
        itemsPerPage,
        eventId,
        state,
        courseId,
        q,
      }),
  });
};

type UseProjectsWithJurorsOptions = {
  currentPage?: number;
  itemsPerPage?: number;
  eventId?: number;
  state?: string;
  courseId?: number;
  q?: string;
  queryConfig?: QueryConfig<typeof getProjectsWithJurorsQueryOptions>;
};

export const useProjectsWithJurors = ({
  queryConfig,
  currentPage,
  itemsPerPage,
  eventId,
  state,
  courseId,
  q,
}: UseProjectsWithJurorsOptions = {}) => {
  return useQuery({
    ...getProjectsWithJurorsQueryOptions({
      currentPage,
      itemsPerPage,
      eventId,
      state,
      courseId,
      q,
    }),
    ...queryConfig,
  });
};