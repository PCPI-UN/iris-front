import { queryOptions, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

export type EventArItem = {
  id: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  latitude: number;
  longitude: number;
};

export const getEventsForAR = async (): Promise<EventArItem[]> => {
  const response = await api.get<{ events: EventArItem[] } | EventArItem[]>(
    '/events/ar',
  );
  // Handle both wrapped { events: [...] } and bare array responses
  return Array.isArray(response) ? response : response.events;
};

export const getEventsForARQueryOptions = () =>
  queryOptions({
    queryKey: ['events', 'ar'],
    queryFn: getEventsForAR,
    staleTime: 60_000, // 1 minute — AR data doesn't need to be real-time
  });

type UseEventsForAROptions = {
  queryConfig?: QueryConfig<typeof getEventsForARQueryOptions>;
};

export const useEventsForAR = ({ queryConfig }: UseEventsForAROptions = {}) =>
  useQuery({
    ...getEventsForARQueryOptions(),
    ...queryConfig,
  });