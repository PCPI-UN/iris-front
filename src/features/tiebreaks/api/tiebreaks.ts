import { api } from '@/lib/api-client';

export type TiebreakRecord = {
  id: number;
  projectId: number;
  eventId: number;
  categoryId: number;
  tiebreakOrder: number;
};

export type TopProjectParticipant = {
  userId?: number | string;
  projectId?: number;
  studentCode?: string;
  status?: string;
};

export type PendingParticipant = {
  pendingId?: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  studentCode?: string;
};

export type TopProject = {
  id: number;
  name: string;
  averageGrade: number;
  evaluationCount: number;
  participants: TopProjectParticipant[];
  pendingParticipants?: PendingParticipant[];
};

export type TopProjectsResponse = {
  items: TopProject[];
  courseId: number;
  eventId: number;
  disputedProjects?: TopProject[];
  tiebreaks?: TiebreakRecord[];
};

export const getTopProjects = (
  courseId: number,
  eventId: number,
  limit: number,
): Promise<TopProjectsResponse> =>
  api.get<TopProjectsResponse>(`/evaluations/courses/${courseId}/top-projects`, {
    params: { eventId, limit },
  });

export const createTiebreak = (body: {
  projectId: number;
  eventId: number;
  categoryId: number;
  tiebreakOrder: number;
}): Promise<TiebreakRecord> =>
  api.post<TiebreakRecord>('/tiebreaks', body, { suppressErrorNotification: true });

export const updateTiebreak = (
  id: number,
  body: { tiebreakOrder: number; projectId: number; categoryId: number },
): Promise<TiebreakRecord> =>
  
  api.put<TiebreakRecord>(`/tiebreaks/${id}`, body, { suppressErrorNotification: true });

export const listTiebreaks = async (params: {
  eventId: number;
  categoryId: number;
}): Promise<TiebreakRecord[]> => {
  try {
    const raw = await api.get<unknown>('/tiebreaks', {
      params: { eventId: params.eventId, categoryId: params.categoryId },
      suppressErrorNotification: true,
    });
    const candidates = [
      raw,
      (raw as any)?.data,
      (raw as any)?.items,
      (raw as any)?.data?.data,
      (raw as any)?.data?.items,
      (raw as any)?.tiebreaks,
      (raw as any)?.data?.tiebreaks,
    ];
    const found = candidates.find((c) => Array.isArray(c));
    return (found ?? []) as TiebreakRecord[];
  } catch (err) {
    throw err;
  }
};
