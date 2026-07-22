import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

type RankingItemRecord = Record<string, unknown>;

export type EventRankingRow = {
  position: number;
  projectId?: number;
  projectCode?: string;
  projectName: string;
  category?: string;
  categoryId?: number;
  evaluationCount: number;
  averageGrade?: number;
  participants: string[];
};

export type GetEventRankingsParams = {
  eventId?: number;
  categoryId?: number;
  state?: string;
};

export type GetEventRankingsResponse = {
  data: EventRankingRow[];
};

const asRecord = (value: unknown): RankingItemRecord => {
  return value !== null && typeof value === 'object' ? (value as RankingItemRecord) : {};
};

const asNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const asString = (value: unknown): string | undefined => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return undefined;
};

const asStringList = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (typeof item === 'string') {
        return item.trim();
      }

      const record = asRecord(item);
      const firstName = asString(record.firstName) ?? '';
      const lastName = asString(record.lastName) ?? '';
      const fullName = `${firstName} ${lastName}`.trim();

      if (fullName) return fullName;

      return (
        asString(record.name) ??
        asString(record.fullName) ??
        asString(record.email) ??
        asString(record.studentCode) ??
        ''
      );
    })
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .filter((item) => !/^\d{6,}$/.test(item))
};

const extractItems = (response: unknown): unknown[] => {
  if (Array.isArray(response)) return response;

  const record = asRecord(response);
  const candidateKeys = ['items', 'data', 'rows', 'results', 'ranking', 'report'];

  for (const key of candidateKeys) {
    const candidate = record[key];
    if (Array.isArray(candidate)) return candidate;
    if (candidate && typeof candidate === 'object') {
      const nested = asRecord(candidate);
      for (const nestedKey of candidateKeys) {
        const nestedCandidate = nested[nestedKey];
        if (Array.isArray(nestedCandidate)) return nestedCandidate;
      }
    }
  }

  return [];
};

const firstNonEmptyList = (...lists: string[][]) => {
  return lists.find((list) => list.length > 0) ?? [];
};

const normalizeRankingRow = (item: unknown, index: number): EventRankingRow => {
  const record = asRecord(item);
  const project = asRecord(record.project ?? record.projectInfo ?? record.projectData ?? record.projectSummary);
  const nestedCategory = asRecord(record.category ?? project.category);
  const participants = firstNonEmptyList(
    asStringList(record.participantNames),
    asStringList(record.participants ?? record.members ?? record.integrants ?? record.teamMembers),
    asStringList(project.participants ?? project.members ?? project.integrants ?? project.teamMembers),
  );

  return {
    position:
      asNumber(record.position ?? record.rank ?? record.place ?? record.order ?? index + 1) ??
      index + 1,
    projectId: asNumber(record.projectId ?? project.id),
    projectCode:
      asString(record.projectCode ?? record.code ?? project.projectCode ?? project.code ?? project.eventNumber),
    projectName:
      asString(record.projectName ?? record.name ?? project.name ?? project.title) ?? 'Proyecto',
    category:
      asString(record.category ?? record.categoryName ?? record.course ?? record.courseName) ??
      asString(nestedCategory.name ?? nestedCategory.code ?? nestedCategory.description) ??
      undefined,
    categoryId:
      asNumber(record.categoryId ?? record.category_id ?? project.categoryId ?? project.courseId) ??
      undefined,
    evaluationCount:
      asNumber(record.evaluationCount ?? record.evaluationsCount ?? record.count ?? record.totalEvaluations) ??
      0,
    averageGrade:
      asNumber(record.averageGrade ?? record.averageScore ?? record.score ?? record.average ?? record.totalScore),
    participants,
  };
};

export const getEventRankings = async ({ eventId, categoryId, state }: GetEventRankingsParams): Promise<GetEventRankingsResponse> => {
  if (!eventId) {
    return { data: [] };
  }

  const response = await api.get<unknown>(`/events/${eventId}/rankings`, {
    params: {
      format: 'json',
      categoryId,
      category_id: categoryId,
      state,
    },
  });

  return {
    data: extractItems(response)
      .map((item, index) => normalizeRankingRow(item, index))
      .sort((left, right) => left.position - right.position),
  };
};

export const getEventRankingsQueryOptions = ({
  eventId,
  categoryId,
  state,
}: GetEventRankingsParams = {}) => {
  return queryOptions({
    queryKey: ['event-rankings', { eventId, categoryId, state }],
    queryFn: () => getEventRankings({ eventId, categoryId, state }),
  });
};

type UseEventRankingsOptions = {
  eventId?: number;
  categoryId?: number;
  state?: string;
  queryConfig?: QueryConfig<typeof getEventRankingsQueryOptions>;
};

export const useEventRankings = ({ eventId, categoryId, state, queryConfig }: UseEventRankingsOptions = {}) => {
  return useQuery({
    ...getEventRankingsQueryOptions({ eventId, categoryId, state }),
    ...queryConfig,
  });
};

export const getPublicEventRankings = async ({ eventId, categoryId, state }: GetEventRankingsParams): Promise<GetEventRankingsResponse> => {
  if (!eventId) {
    return { data: [] };
  }

  const response = await api.get<unknown>(`/events/${eventId}/rankings/public`, {
    params: {
      format: 'json',
      categoryId,
      category_id: categoryId,
      state,
    },
  });

  return {
    data: extractItems(response)
      .map((item, index) => normalizeRankingRow(item, index))
      .sort((left, right) => left.position - right.position),
  };
};

export const getPublicEventRankingsQueryOptions = ({
  eventId,
  categoryId,
  state,
}: GetEventRankingsParams = {}) => {
  return queryOptions({
    queryKey: ['public-event-rankings', { eventId, categoryId, state }],
    queryFn: () => getPublicEventRankings({ eventId, categoryId, state }),
  });
};

type UsePublicEventRankingsOptions = {
  eventId?: number;
  categoryId?: number;
  state?: string;
  queryConfig?: QueryConfig<typeof getPublicEventRankingsQueryOptions>;
};

export const usePublicEventRankings = ({ eventId, categoryId, state, queryConfig }: UsePublicEventRankingsOptions = {}) => {
  return useQuery({
    ...getPublicEventRankingsQueryOptions({ eventId, categoryId, state }),
    ...queryConfig,
  });
};

const parseContentDispositionFileName = (headerValue: string | null) => {
  if (!headerValue) return null;

  const utf8Match = headerValue.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return utf8Match[1];
    }
  }

  const basicMatch = headerValue.match(/filename="?([^";]+)"?/i);
  return basicMatch?.[1] ?? null;
};

export const downloadEventRankingsReport = async ({ eventId, categoryId, state }: GetEventRankingsParams) => {
  if (!eventId) {
    throw new Error('Se requiere un evento para descargar el ranking');
  }

  const params = new URLSearchParams({ format: 'excel' });

  if (categoryId !== undefined && categoryId !== null) {
    params.set('categoryId', String(categoryId));
    params.set('category_id', String(categoryId));
  }

  if (state) {
    params.set('state', state);
  }

  const response = await fetch(`/api/events/${eventId}/rankings?${params.toString()}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/octet-stream, application/json',
    },
  });

  if (!response.ok) {
    let message = response.statusText || 'No se pudo descargar el reporte';

    try {
      const text = await response.text();
      if (text) {
        const parsed = JSON.parse(text) as { message?: string };
        message = parsed.message ?? message;
      }
    } catch {
      // Keep the default message when the body is not JSON.
    }

    throw new Error(message);
  }

  return {
    blob: await response.blob(),
    fileName:
      parseContentDispositionFileName(response.headers.get('content-disposition')) ??
      `event-rankings-${eventId}.xlsx`,
  };
};