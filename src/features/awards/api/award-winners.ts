import type { AwardWinner, PaginationMeta } from "../types";

import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { AWARDS_PAGE_LIMIT } from "./constants";

import { api } from "@/lib/api-client";
import { MutationConfig, QueryConfig } from "@/lib/react-query";

type ListAwardWinnersResponse = {
  winners?: AwardWinner[];
  meta?: PaginationMeta;
};

export const getAwardWinners = async ({
  awardId,
}: {
  awardId: number;
}): Promise<AwardWinner[]> => {
  const response = await api.get<ListAwardWinnersResponse>(
    "/events/award-winners",
    { params: { awardId, page: 1, limit: AWARDS_PAGE_LIMIT } },
  );

  return response?.winners ?? [];
};

export const awardWinnersQueryKey = (awardId: number) =>
  ["award-winners", { awardId }] as const;

export const getAwardWinnersQueryOptions = (awardId: number) =>
  queryOptions({
    queryKey: awardWinnersQueryKey(awardId),
    queryFn: () => getAwardWinners({ awardId }),
  });

type UseAwardWinnersOptions = {
  awardId: number;
  queryConfig?: QueryConfig<typeof getAwardWinnersQueryOptions>;
};

export const useAwardWinners = ({
  awardId,
  queryConfig,
}: UseAwardWinnersOptions) =>
  useQuery({ ...getAwardWinnersQueryOptions(awardId), ...queryConfig });

export type AssignWinnerInput = {
  projectId: number;
  /** Average of the project in the category ranking */
  grade: number;
};

/**
 * Assigns the award to one project or, for co-winners, to several: one
 * POST /events/award-winners per project (the backend records the caller as
 * the user who assigned it).
 */
export const assignAwardWinners = async ({
  awardId,
  winners,
}: {
  awardId: number;
  winners: AssignWinnerInput[];
}): Promise<AwardWinner[]> => {
  const created: AwardWinner[] = [];

  for (const winner of winners) {
    const response = await api.post<{ winner: AwardWinner }>(
      "/events/award-winners",
      { awardId, projectId: winner.projectId, grade: winner.grade },
    );

    if (response?.winner) created.push(response.winner);
  }

  return created;
};

export const removeAwardWinner = ({
  winnerId,
}: {
  winnerId: number;
  awardId: number;
}): Promise<{ ok: boolean }> => api.delete(`/events/award-winners/${winnerId}`);

export const useAssignAwardWinners = ({
  mutationConfig,
}: { mutationConfig?: MutationConfig<typeof assignAwardWinners> } = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, onSettled, ...rest } = mutationConfig ?? {};

  return useMutation({
    ...rest,
    onSuccess: async (data, variables, ...args) => {
      await onSuccess?.(data, variables, ...args);
    },
    // Some co-winners may have been saved before a failure: refresh either way
    onSettled: async (data, error, variables, ...args) => {
      await queryClient.invalidateQueries({
        queryKey: awardWinnersQueryKey(variables.awardId),
      });
      await onSettled?.(data, error, variables, ...args);
    },
    mutationFn: assignAwardWinners,
  });
};

export const useRemoveAwardWinner = ({
  mutationConfig,
}: { mutationConfig?: MutationConfig<typeof removeAwardWinner> } = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = mutationConfig ?? {};

  return useMutation({
    ...rest,
    onSuccess: async (data, variables, ...args) => {
      await queryClient.invalidateQueries({
        queryKey: awardWinnersQueryKey(variables.awardId),
      });
      await onSuccess?.(data, variables, ...args);
    },
    mutationFn: removeAwardWinner,
  });
};
