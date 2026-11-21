import { api } from "@/lib/api-client";

export type TopProjectParticipant = {
  userId?: number | string;
  projectId?: number;
  studentCode?: string;
  status?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  name?: string;
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
  /** Position assigned by the backend: ties (average rounded to 2 decimals) share it (1, 1, 2) */
  position: number;
  averageGrade: number;
  evaluationCount: number;
  participants: TopProjectParticipant[];
  pendingParticipants?: PendingParticipant[];
};

export type TopProjectsResponse = {
  items: TopProject[];
  courseId: number;
  eventId: number;
};

/**
 * Top projects of a category (GET /evaluations/courses/:courseId/top-projects).
 * `limit` is the number of positions: co-winners at the last position are all
 * included, so there can be more rows than `limit`. There is no tie-break.
 */
export const getTopProjects = (
  courseId: number,
  eventId: number,
  limit: number,
): Promise<TopProjectsResponse> =>
  api.get<TopProjectsResponse>(
    `/evaluations/courses/${courseId}/top-projects`,
    {
      params: { eventId, limit },
    },
  );
