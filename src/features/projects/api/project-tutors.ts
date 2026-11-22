import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { invalidateProjectQueries } from "./admin-change-project-state";

import { api } from "@/lib/api-client";

/** A tutor of a project: linked to a user account, or pending (typed in by name and email) */
export type ProjectTutor = {
  userId?: number | null;
  firstName: string;
  lastName?: string | null;
  pending: boolean;
  /** Only for pending tutors; linked tutors expose no email */
  email?: string | null;
};

export type PendingTutorInput = {
  firstName: string;
  lastName?: string;
  email: string;
};

export type SetProjectTutorsInput = {
  projectId: number;
  userIds: number[];
  pending: PendingTutorInput[];
  reason?: string;
};

/** Result of GET /projects/tutor-candidates: users with the Tutor or Professor role */
export type TutorCandidate = {
  id: number;
  firstName: string;
  lastName?: string | null;
};

export const TUTOR_SEARCH_MIN_LENGTH = 3;

export const searchTutorCandidates = async (
  search: string,
): Promise<TutorCandidate[]> => {
  const response = await api.get<
    TutorCandidate[] | { items?: TutorCandidate[] }
  >("/projects/tutor-candidates", { params: { search } });

  return Array.isArray(response) ? response : (response?.items ?? []);
};

export const useTutorCandidates = (search: string) => {
  const term = search.trim();

  return useQuery({
    queryKey: ["tutor-candidates", term],
    queryFn: () => searchTutorCandidates(term),
    enabled: term.length >= TUTOR_SEARCH_MIN_LENGTH,
    staleTime: 30_000,
  });
};

/** PUT /projects/:id/tutors replaces the whole list (manage:events or manage:projects) */
export const setProjectTutors = ({
  projectId,
  userIds,
  pending,
  reason,
}: SetProjectTutorsInput): Promise<{ tutors: ProjectTutor[] }> =>
  api.put(
    `/projects/${projectId}/tutors`,
    {
      userIds,
      pending: pending.map((tutor) => ({
        firstName: tutor.firstName.trim(),
        lastName: tutor.lastName?.trim() || undefined,
        email: tutor.email.trim(),
      })),
      reason: reason?.trim() || undefined,
    },
    { suppressErrorNotification: true },
  );

export const useSetProjectTutors = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: setProjectTutors,
    onSuccess: (_data, { projectId }) =>
      invalidateProjectQueries(queryClient, projectId),
  });
};
