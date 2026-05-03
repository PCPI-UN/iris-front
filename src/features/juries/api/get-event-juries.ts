import { queryOptions, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import { QueryConfig } from "@/lib/react-query";
import { InvitationsMeta } from "@/types/api";

export type EventJuror = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  assignedProjects?: Array<{ id: number; evaluated: boolean }>;
};

type GetEventJuriesParams = {
  eventId: string | number;
  page?: number;
  limit?: number;
};

type GetEventJuriesResponse = {
  jurors?: EventJuror[];
  data?: EventJuror[];
  meta?: InvitationsMeta;
};

export const getEventJuries = async ({
  eventId,
  page = 1,
  limit = 100,
}: GetEventJuriesParams): Promise<GetEventJuriesResponse> => {
  const response = await api.get<GetEventJuriesResponse>(
    `/events/${eventId}/jurors`
  );

  return {
    data: response.jurors,
    meta: response.meta ?? {
      total: response.jurors?.length ?? 0,
      itemsOnCurrentPage: response.jurors?.length ?? 0,
      itemsPerPage: limit,
      currentPage: page,
      totalPages: 1,
    },
  };
};

export const getEventJuriesQueryOptions = ({
  eventId,
  page = 1,
  limit = 100,
}: GetEventJuriesParams) => {
  return queryOptions({
    queryKey: ["event-juries", eventId, page, limit],
    queryFn: () => getEventJuries({ eventId, page, limit }),
    enabled: eventId !== undefined && eventId !== null && eventId !== "",
  });
};

type UseEventJuriesOptions = {
  eventId?: string | number;
  page?: number;
  limit?: number;
  queryConfig?: QueryConfig<typeof getEventJuriesQueryOptions>;
};

export const useEventJuries = ({
  eventId,
  page = 1,
  limit = 100,
  queryConfig,
}: UseEventJuriesOptions) => {
  return useQuery({
    ...getEventJuriesQueryOptions({ eventId: eventId!, page, limit }),
    ...queryConfig,
    enabled:
      eventId !== undefined && eventId !== null && eventId !== "" &&
      (queryConfig?.enabled ?? true),
  });
};