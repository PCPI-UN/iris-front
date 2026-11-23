import { useMutation, useQueryClient } from "@tanstack/react-query";

import { TutorsPayload } from "../utils/tutors";

import { invalidateProjectQueries } from "./admin-change-project-state";

import { api } from "@/lib/api-client";
import { MutationConfig } from "@/lib/react-query";
import { ProjectTutor } from "@/types/api";

/**
 * Replaces the whole list of tutors; the ones left out are unlinked. Takes manage:events or
 * manage:projects; the optional reason goes to the change log of the project.
 */
export const setProjectTutors = async ({
  projectId,
  data,
  reason,
}: {
  projectId: number | string;
  data: TutorsPayload;
  reason?: string;
}): Promise<{ tutors: ProjectTutor[] }> => {
  return api.put(
    `/projects/${projectId}/tutors`,
    { ...data, ...(reason?.trim() ? { reason: reason.trim() } : {}) },
    // Both forms that save tutors show the error themselves
    { suppressErrorNotification: true },
  );
};

type UseSetProjectTutorsOptions = {
  mutationConfig?: MutationConfig<typeof setProjectTutors>;
};

export const useSetProjectTutors = ({
  mutationConfig,
}: UseSetProjectTutorsOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: (data, variables, ...args) => {
      // Project lists (the admin list and its detail modal read projects-with-jurors),
      // the project itself and its change log
      void invalidateProjectQueries(queryClient, Number(variables.projectId));
      onSuccess?.(data, variables, ...args);
    },
    ...restConfig,
    mutationFn: setProjectTutors,
  });
};
