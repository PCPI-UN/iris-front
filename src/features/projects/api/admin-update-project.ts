import { useMutation, useQueryClient } from "@tanstack/react-query";

import { invalidateProjectQueries } from "./admin-change-project-state";

import { api, ApiError } from "@/lib/api-client";
import { Project } from "@/types/api";

/** Fields of PATCH /projects/:id/admin; only the ones sent are changed */
export type AdminProjectChanges = {
  name?: string;
  /** null clears it */
  description?: string | null;
  /** null clears it */
  projectCode?: string | null;
  /** null clears it */
  eventNumber?: string | null;
  /** A category (course) of the project's event */
  courseId?: number;
};

export type AdminUpdateProjectInput = {
  projectId: number;
  changes: AdminProjectChanges;
  reason?: string;
  force?: boolean;
};

export const PROJECT_NAME_TAKEN = "PROJECT_NAME_TAKEN";
export const PROJECT_CATEGORY_CHANGE_BLOCKED =
  "PROJECT_CATEGORY_CHANGE_BLOCKED";
export const PROJECT_CHANGED_MEANWHILE = "PROJECT_CHANGED_MEANWHILE";

const isConflict = (error: unknown, code: string): error is ApiError =>
  error instanceof ApiError && error.status === 409 && error.code === code;

/** 409 PROJECT_NAME_TAKEN: another project of the event has the name */
export const isProjectNameTaken = (error: unknown): error is ApiError =>
  isConflict(error, PROJECT_NAME_TAKEN);

/** 409 PROJECT_CHANGED_MEANWHILE: another edit changed the same fields first */
export const isProjectChangedMeanwhile = (error: unknown): error is ApiError =>
  isConflict(error, PROJECT_CHANGED_MEANWHILE);

/**
 * 409 PROJECT_CATEGORY_CHANGE_BLOCKED: the project has juror evaluations, so the
 * category change needs a confirmation (force). Null for any other error.
 */
export const getCategoryChangeBlockedDetails = (
  error: unknown,
): { evaluationCount: number } | null => {
  if (!isConflict(error, PROJECT_CATEGORY_CHANGE_BLOCKED)) return null;
  const details = (error.details ?? {}) as { evaluationCount?: unknown };

  return { evaluationCount: Number(details.evaluationCount ?? 0) };
};

export const adminUpdateProject = ({
  projectId,
  changes,
  reason,
  force = false,
}: AdminUpdateProjectInput): Promise<Project> =>
  api.patch(
    `/projects/${projectId}/admin`,
    {
      ...changes,
      ...(reason?.trim() ? { reason: reason.trim() } : {}),
      ...(force ? { force: true } : {}),
    },
    // The form shows the errors itself (name in its field, category as a confirmation)
    { suppressErrorNotification: true },
  );

export const useAdminUpdateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminUpdateProject,
    onSuccess: (_data, { projectId }) =>
      invalidateProjectQueries(queryClient, projectId),
    onError: (error, { projectId }) => {
      if (isProjectChangedMeanwhile(error)) {
        void invalidateProjectQueries(queryClient, projectId);
      }
    },
  });
};
