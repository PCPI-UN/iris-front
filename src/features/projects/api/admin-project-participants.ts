import { useMutation, useQueryClient } from "@tanstack/react-query";

import { invalidateProjectQueries } from "./admin-change-project-state";

import { api } from "@/lib/api-client";

/** Pending participant typed in by an administrator (POST /projects/:id/admin/participants without userId) */
export type AdminPendingParticipantInput = {
  firstName: string;
  lastName?: string;
  email: string;
  studentCode: string;
  /** Number as text ("5") */
  semester: string;
  career: string;
};

export type AdminAddParticipantInput = {
  projectId: number;
  participant: AdminPendingParticipantInput;
  reason?: string;
};

export type AdminAddParticipantResponse = {
  participant: Record<string, unknown> | null;
  pendingParticipant: { pendingId: number; status: string } | null;
  /** Effects that failed after the participant was saved (NOTIFICATION) */
  failedEffects?: string[];
  /** Spanish explanation of failedEffects; null when nothing failed */
  warning: string | null;
};

/** Enrolled participants are removed by user id, pending ones by their pending id */
export type AdminRemoveParticipantInput = {
  projectId: number;
  reason?: string;
} & ({ userId: number } | { pendingId: number });

const optionalText = (value?: string) => value?.trim() || undefined;

export const adminAddParticipant = ({
  projectId,
  participant,
  reason,
}: AdminAddParticipantInput): Promise<AdminAddParticipantResponse> =>
  api.post(
    `/projects/${projectId}/admin/participants`,
    {
      firstName: participant.firstName.trim(),
      lastName: optionalText(participant.lastName),
      email: participant.email.trim(),
      studentCode: participant.studentCode.trim(),
      semester: participant.semester.trim(),
      career: participant.career.trim(),
      reason: optionalText(reason),
    },
    // The form shows the 400 and 409 of the backend itself
    { suppressErrorNotification: true },
  );

export const adminRemoveParticipant = (
  input: AdminRemoveParticipantInput,
): Promise<void> => {
  const path =
    "pendingId" in input
      ? `/projects/${input.projectId}/admin/participants/pending/${input.pendingId}`
      : `/projects/${input.projectId}/admin/participants/${input.userId}`;

  return api.delete(path, undefined, {
    params: { reason: optionalText(input.reason) },
    suppressErrorNotification: true,
  });
};

export const useAdminAddParticipant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminAddParticipant,
    onSuccess: (_data, { projectId }) =>
      invalidateProjectQueries(queryClient, projectId),
  });
};

export const useAdminRemoveParticipant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminRemoveParticipant,
    onSuccess: (_data, { projectId }) =>
      invalidateProjectQueries(queryClient, projectId),
  });
};
