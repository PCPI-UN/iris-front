import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export type RequestChangesPayload = {
  projectId: number;
  comment: string;
};

export type RequestChangesResponse = {
  id: number;
  comment: string;
};

export const requestChangesProject = async ({
  projectId,
  comment,
}: RequestChangesPayload): Promise<RequestChangesResponse> => {
  const res = await api.patch<RequestChangesResponse>(
    `/projects/${projectId}/request-changes`,
    { comment }
  );
  return res;
};

export const useRequestChangesProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, comment }: RequestChangesPayload) =>
      requestChangesProject({ projectId, comment }),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
};