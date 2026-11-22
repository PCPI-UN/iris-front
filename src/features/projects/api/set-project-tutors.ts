import { useMutation, useQueryClient } from "@tanstack/react-query";

import { TutorsPayload } from "../utils/tutors";

import { api } from "@/lib/api-client";
import { MutationConfig } from "@/lib/react-query";
import { ProjectTutor } from "@/types/api";

/** Replaces the whole list of tutors; the ones left out are unlinked */
export const setProjectTutors = async ({
  projectId,
  data,
}: {
  projectId: number | string;
  data: TutorsPayload;
}): Promise<{ tutors: ProjectTutor[] }> => {
  return api.put(`/projects/${projectId}/tutors`, data);
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
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      // The admin list and its detail modal read the project from this query
      queryClient.invalidateQueries({ queryKey: ["projects-with-jurors"] });
      onSuccess?.(data, variables, ...args);
    },
    ...restConfig,
    mutationFn: setProjectTutors,
  });
};
