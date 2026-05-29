import { api } from '@/lib/api-client';

export type TiebreakRecord = {
  id: number;
  projectId: number;
  eventId: number;
  categoryId: number;
  tiebreakOrder: number;
};

export type TopProjectParticipant = {
  firstName?: string;
  lastName?: string;
  studentCode?: string;
  email?: string;
  name?: string;
  userId?: number | string;
};

export type TopProject = {
  id: number;
  name: string;
  averageGrade: number;
  evaluationCount: number;
  participants: TopProjectParticipant[];
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

export const createTiebreak = async (body: {
  projectId: number;
  eventId: number;
  categoryId: number;
  tiebreakOrder: number;
}): Promise<{ ok: boolean; status: number; data: TiebreakRecord | null }> => {
  const response = await fetch('/api/tiebreaks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  const text = await response.text();
  const data = text ? (JSON.parse(text) as TiebreakRecord) : null;
  return { ok: response.ok, status: response.status, data };
};

export const updateTiebreak = (
  id: number,
  body: { tiebreakOrder: number; projectId: number; categoryId: number },
): Promise<TiebreakRecord> => api.put<TiebreakRecord>(`/tiebreaks/${id}`, body);

export const listTiebreaks = async (params: {
  eventId: number;
  categoryId: number;
}): Promise<TiebreakRecord[]> => {
  const result = await api.get<TiebreakRecord[] | { data: TiebreakRecord[] }>(
    '/tiebreaks',
    { params },
  );
  return Array.isArray(result) ? result : ((result as { data: TiebreakRecord[] }).data ?? []);
};
