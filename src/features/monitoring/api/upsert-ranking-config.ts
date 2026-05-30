import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';
import type { RankingConfigType } from '../types';

export type UpsertRankingConfigInput = {
  eventId: number;
  rankingConfigId?: number;
  config: RankingConfigType;
};

export type RankingConfigResponse = {
  id?: number;
  eventId?: number;
  positions?: number;
  visiblePositions?: number;
  visibleInLanding?: boolean;
  visibleScore?: boolean;
  visiblePublic?: boolean;
  gradeVisible?: boolean;
  data?: {
    id?: number;
    eventId?: number;
    positions?: number;
    visiblePositions?: number;
    visibleInLanding?: boolean;
    visibleScore?: boolean;
    visiblePublic?: boolean;
    gradeVisible?: boolean;
  };
};

export const upsertRankingConfig = async ({
  eventId,
  rankingConfigId,
  config,
}: UpsertRankingConfigInput): Promise<RankingConfigResponse> => {
  const payload = {
    eventId,
    positions: config.visiblePositions,
    visibleInLanding: config.visibleInLanding,
    visibleScore: config.visibleScore,
    visiblePublic: config.visibleInLanding,
    gradeVisible: config.visibleScore,
  };

  if (rankingConfigId) {
    return api.patch<RankingConfigResponse>(`/events/update-ranking-config/${rankingConfigId}`, payload);
  }

  return api.post<RankingConfigResponse>('/events/ranking-config', payload);
};

type UseUpsertRankingConfigOptions = {
  mutationConfig?: MutationConfig<typeof upsertRankingConfig>;
};

export const useUpsertRankingConfig = ({ mutationConfig }: UseUpsertRankingConfigOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    ...restConfig,
    onSuccess: async (data, variables, onMutateResult, context) => {
      const eventId = variables?.eventId;

      if (eventId) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['ranking-config', eventId] }),
          queryClient.invalidateQueries({ queryKey: ['events', eventId] }),
          queryClient.invalidateQueries({ queryKey: ['event-rankings'] }),
          queryClient.refetchQueries({ queryKey: ['ranking-config', eventId] }),
          queryClient.refetchQueries({ queryKey: ['events', eventId] }),
          queryClient.refetchQueries({ queryKey: ['event-rankings'] }),
        ]);
      }

      await onSuccess?.(data, variables, onMutateResult, context);
    },
    mutationFn: upsertRankingConfig,
  });
};