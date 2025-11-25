import { queryOptions, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import { QueryConfig } from "@/lib/react-query";

import { JuryInvitation, InvitationsMeta } from "@/types/api";

type GetJuryInvitationsParams = {
  eventId: number;
  page?: number;
  limit?: number;
};

type GetJuryInvitationsResponse = {
  invitations: JuryInvitation[];
  meta: InvitationsMeta;
};

export const getJuryInvitations = async ({
  eventId,
  page = 1,
  limit = 10,
}: GetJuryInvitationsParams): Promise<GetJuryInvitationsResponse> => {
  const response = await api.get<GetJuryInvitationsResponse>(
    `/invitations/events/${eventId}`,
    {
      params: { roleId: 4, page, limit },
    }
  );

  return {
    invitations: response.invitations || [],
    meta: response.meta,
  };
};

export const getJuryInvitationsQueryOptions = ({
  eventId,
  page = 1,
  limit = 10,
}: GetJuryInvitationsParams) => {
  return queryOptions({
    queryKey: ["jury-invitations", eventId, page, limit],
    queryFn: () => getJuryInvitations({ eventId, page, limit }),
    enabled: !!eventId,
  });
};

type UseJuryInvitationsOptions = {
  eventId?: number;
  page?: number;
  limit?: number;
  queryConfig?: QueryConfig<typeof getJuryInvitationsQueryOptions>;
};

export const useJuryInvitations = ({
  eventId,
  page = 1,
  limit = 10,
  queryConfig,
}: UseJuryInvitationsOptions) => {
  return useQuery({
    ...getJuryInvitationsQueryOptions({ eventId: eventId!, page, limit }),
    ...queryConfig,
    enabled: !!eventId && (queryConfig?.enabled ?? true),
  });
};
