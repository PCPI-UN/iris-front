import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

export type RankingConfigRecord = {
  id?: number;
  rankingConfigId?: number;
  eventId?: number;
  positions?: number;
  visiblePositions?: number;
  visibleInLanding?: boolean;
  visibleScore?: boolean;
};

export type GetRankingConfigResponse = {
  data?: RankingConfigRecord | null;
  id?: number;
  eventId?: number;
  positions?: number;
  visiblePositions?: number;
  visiblePublic?: boolean;
  visibleInLanding?: boolean;
  gradeVisible?: boolean;
  visibleScore?: boolean;
  rankingEvent?: RankingConfigRecord | null;
  rankingConfig?: RankingConfigRecord | null;
  rankingConfiguration?: RankingConfigRecord | null;
};

const normalizeRankingConfig = (response: GetRankingConfigResponse | null | undefined): RankingConfigRecord | null => {
  if (!response || typeof response !== 'object') {
    return null;
  }

  const candidate =
    response.data ??
    response.rankingEvent ??
    response.rankingConfig ??
    response.rankingConfiguration ??
    response;

  if (!candidate || typeof candidate !== 'object') {
    return null;
  }

  const record = candidate as RankingConfigRecord;
  const id =
    typeof record.id === 'number'
      ? record.id
      : typeof record.rankingConfigId === 'number'
        ? record.rankingConfigId
        : undefined;
  const positions = typeof record.positions === 'number' ? record.positions : record.visiblePositions;
  const visibleInLanding =
    typeof (record as Record<string, unknown>).visibleInLanding === 'boolean'
      ? (record as Record<string, unknown>).visibleInLanding as boolean
      : typeof (record as Record<string, unknown>).visiblePublic === 'boolean'
        ? (record as Record<string, unknown>).visiblePublic as boolean
        : typeof (record as Record<string, unknown>).isPublic === 'boolean'
          ? (record as Record<string, unknown>).isPublic as boolean
          : undefined;
  const visibleScore =
    typeof (record as Record<string, unknown>).visibleScore === 'boolean'
      ? (record as Record<string, unknown>).visibleScore as boolean
      : typeof (record as Record<string, unknown>).gradeVisible === 'boolean'
        ? (record as Record<string, unknown>).gradeVisible as boolean
        : undefined;

  if (
    id === undefined &&
    positions === undefined &&
    visibleInLanding === undefined &&
    visibleScore === undefined
  ) {
    return null;
  }

  return {
    id,
    rankingConfigId: id,
    eventId: typeof record.eventId === 'number' ? record.eventId : undefined,
    positions,
    visiblePositions: positions,
    visibleInLanding,
    visibleScore,
  };
};

export const getRankingConfig = async (eventId?: number): Promise<{ data: RankingConfigRecord | null }> => {
  if (!eventId) {
    return { data: null };
  }

  // Primary backend contract: @Public() GET /events/ranking-config/by-event/:eventId
  try {
    const response = await api.get<GetRankingConfigResponse>(
      `/events/ranking-config/by-event/${eventId}`,
      { suppressErrorNotification: true },
    );
    const normalized = normalizeRankingConfig(response);
    if (normalized) {
      return { data: normalized };
    }
  } catch {
    // Fall back to legacy/mock route only when by-event is unavailable
  }

  try {
    const response = await api.get<GetRankingConfigResponse>(
      `/events/ranking-config/${eventId}`,
      { suppressErrorNotification: true },
    );
    const normalized = normalizeRankingConfig(response);
    // Guard against legacy /ranking-config/:id returning another event's config
    if (normalized && normalized.eventId !== undefined && normalized.eventId !== eventId) {
      return { data: null };
    }
    return { data: normalized };
  } catch {
    return { data: null };
  }
};

export const getRankingConfigQueryOptions = (eventId?: number) => {
  return queryOptions({
    queryKey: ['ranking-config', eventId],
    queryFn: () => getRankingConfig(eventId),
    enabled: Boolean(eventId),
  });
};

type UseRankingConfigOptions = {
  eventId?: number;
  queryConfig?: QueryConfig<typeof getRankingConfigQueryOptions>;
};

export const useRankingConfig = ({ eventId, queryConfig }: UseRankingConfigOptions = {}) => {
  return useQuery({
    ...getRankingConfigQueryOptions(eventId),
    ...queryConfig,
  });
};