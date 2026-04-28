import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api-client";

export type AssignJurorsInput = {
  userId: number;
  projectIds: number[];
};

export type AssignJurorsResponse = {
  success?: boolean;
  message?: string;
};

export const assignJurors = async (
  data: AssignJurorsInput,
): Promise<AssignJurorsResponse> => {
  return api.post("/projects/assign-jurors", data);
};

export const useAssignJurors = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: assignJurors,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
};