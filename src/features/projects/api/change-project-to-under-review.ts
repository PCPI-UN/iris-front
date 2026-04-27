import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api-client";

export const changeProjectToUnderReview = async ({
  projectId,
}: {
  projectId: number;
}) => {
  return api.post(`/projects/${projectId}/change-to-under-review`);
};

export const useChangeProjectToUnderReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: changeProjectToUnderReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-project"] });
      queryClient.invalidateQueries({ queryKey: ["user-projects"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
};
