import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api, ApiError } from "@/lib/api-client";
import { Project } from "@/types/api";

export type ProjectState = Project["state"];

export const PROJECT_STATES: ProjectState[] = [
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "REQUEST_CHANGES",
];

/** Same names as the state filters of the projects view */
export const PROJECT_STATE_LABELS: Record<ProjectState, string> = {
  UNDER_REVIEW: "En revisión",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
  REQUEST_CHANGES: "Cambios solicitados",
};

export type AdminChangeProjectStateInput = {
  projectId: number;
  state: ProjectState;
  reason: string;
  notify?: boolean;
  force?: boolean;
};

export type AdminChangeProjectStateResponse = {
  project: Project;
  /** Effects that failed after the change was saved (TUTOR_ACTIVATION, NOTIFICATION) */
  failedEffects: string[];
  /** Spanish explanation of failedEffects; null when nothing failed */
  warning: string | null;
};

export const PROJECT_STATE_CHANGE_BLOCKED = "PROJECT_STATE_CHANGE_BLOCKED";

/** `details` of the 409 PROJECT_STATE_CHANGE_BLOCKED */
export type StateChangeBlockedDetails = {
  hasEvaluations: boolean;
  evaluationCount: number;
  resultsPublished: boolean;
  leavesApproved: boolean;
};

export const getStateChangeBlockedDetails = (
  error: unknown,
): StateChangeBlockedDetails | null => {
  if (
    !(error instanceof ApiError) ||
    error.status !== 409 ||
    error.code !== PROJECT_STATE_CHANGE_BLOCKED
  ) {
    return null;
  }
  const details = (error.details ?? {}) as Partial<StateChangeBlockedDetails>;

  return {
    hasEvaluations: Boolean(details.hasEvaluations),
    evaluationCount: Number(details.evaluationCount ?? 0),
    resultsPublished: Boolean(details.resultsPublished),
    leavesApproved: Boolean(details.leavesApproved),
  };
};

/** 409 without code: another change saved a different state first */
export const isConcurrentStateChange = (error: unknown) =>
  error instanceof ApiError && error.status === 409 && !error.code;

export const adminChangeProjectState = ({
  projectId,
  state,
  reason,
  notify = false,
  force = false,
}: AdminChangeProjectStateInput): Promise<AdminChangeProjectStateResponse> =>
  api.patch(
    `/projects/${projectId}/admin/state`,
    { state, reason: reason.trim(), notify, force },
    // The modal explains every error itself (the 409 needs a confirmation, not a toast)
    { suppressErrorNotification: true },
  );

/** Every project list (state filters, search, jurors) and the change log of the project */
export const invalidateProjectQueries = (
  queryClient: ReturnType<typeof useQueryClient>,
  projectId: number,
) =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: ["projects"] }),
    queryClient.invalidateQueries({ queryKey: ["projects-with-jurors"] }),
    queryClient.invalidateQueries({
      queryKey: ["project-change-log", projectId],
    }),
  ]);

export const useAdminChangeProjectState = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminChangeProjectState,
    // Not awaited: the refetch can drop the project from the open list, and the
    // modal must still close and notify before that happens
    onSuccess: (_data, { projectId }) => {
      void invalidateProjectQueries(queryClient, projectId);
    },
    onError: (error, { projectId }) => {
      if (isConcurrentStateChange(error)) {
        void invalidateProjectQueries(queryClient, projectId);
      }
    },
  });
};
