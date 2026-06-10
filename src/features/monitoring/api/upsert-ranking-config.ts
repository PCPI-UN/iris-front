import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';
import type { RankingConfigType } from '../types';
import { getRankingConfig } from './get-ranking-config';

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

  // Attempt to create a new ranking config. If the server responds with 409 (already exists),
  // fetch the existing config and update it instead.
  const url = `/api/events/ranking-config`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (response.ok) {
    const json = await response.json();
    return json as RankingConfigResponse;
  }

  if (response.status === 409) {
    // Try to get existing config for this event and patch it
    try {
      const existing = await getRankingConfig(eventId);
      const existingId = existing?.data?.id ?? existing?.data?.eventId ?? undefined;
      if (typeof existingId === 'number') {
        return api.patch<RankingConfigResponse>(`/events/update-ranking-config/${existingId}`, payload);
      }
    } catch (err) {
      // Fall through to throw below
    }
  }

  // For other statuses or if we couldn't recover, try to parse error message and throw
  let message = response.statusText || 'No se pudo guardar la configuración';
  try {
    const text = await response.text();
    if (text) {
      const parsed = JSON.parse(text) as { message?: string };
      message = parsed.message ?? message;
    }
  } catch {
    // ignore
  }

  throw new Error(message);
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