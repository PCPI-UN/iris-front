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

export type JuryInvitationSummary = {
  total: number;
  pendingCount: number;
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

const JURY_INVITATIONS_PAGE_SIZE = 100;

export const getJuryInvitationSummary = async ({
  eventId,
}: {
  eventId: number;
}): Promise<JuryInvitationSummary> => {
  const firstPage = await getJuryInvitations({
    eventId,
    page: 1,
    limit: JURY_INVITATIONS_PAGE_SIZE,
  });

  const totalPages = firstPage.meta?.totalPages ?? 1;
  const invitations = [...firstPage.invitations];

  if (totalPages > 1) {
    const remainingPages = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, index) =>
        getJuryInvitations({
          eventId,
          page: index + 2,
          limit: JURY_INVITATIONS_PAGE_SIZE,
        })
      )
    );

    remainingPages.forEach(({ invitations: pageInvitations }) => {
      invitations.push(...pageInvitations);
    });
  }

  return {
    total: invitations.length,
    pendingCount: invitations.filter((invitation) => invitation.status === 0).length,
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

export const getJuryInvitationSummaryQueryOptions = ({
  eventId,
}: {
  eventId: number;
}) => {
  return queryOptions({
    queryKey: ["jury-invitation-summary", eventId],
    queryFn: () => getJuryInvitationSummary({ eventId }),
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

type UseJuryInvitationSummaryOptions = {
  eventId?: number;
  queryConfig?: QueryConfig<typeof getJuryInvitationSummaryQueryOptions>;
};

export const useJuryInvitationSummary = ({
  eventId,
  queryConfig,
}: UseJuryInvitationSummaryOptions = {}) => {
  return useQuery({
    ...getJuryInvitationSummaryQueryOptions({ eventId: eventId! }),
    ...queryConfig,
    enabled: !!eventId && (queryConfig?.enabled ?? true),
  });
};
