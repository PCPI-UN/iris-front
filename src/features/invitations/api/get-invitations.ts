import { queryOptions, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export type InvitationStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED";

export type Invitation = {
  id: string;
  token: string;
  email: string;
  targetType: "EVENT" | "PROJECT";
  targetId: number;
  status: number;
  expiresAt: string;
  invitedByUserId: number;
  invitedUserId: number;
  roleIds: number[];
  createdAt: string;
  roles: {
    id: number;
    name: string;
    description: string;
    scope: string;
  }[];
  event: {
    id: number;
    name: string;
    description: string;
    accessCode: string;
    isPubliclyJoinable: boolean;
    inscriptionDeadline: string;
    evaluationsOpened: boolean;
    startDate: string;
    endDate: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
    location: string;
    status: number;
  } | null;
  project: any | null;
};

export type InvitationsResponse = {
  invitations: Invitation[];
  meta: {
    total: number;
    itemsOnCurrentPage: number;
    itemsPerPage: number;
    currentPage: number;
    totalPages: number;
  };
};

type GetInvitationsOptions = {
  status?: InvitationStatus;
  page?: number;
  limit?: number;
};

export const getInvitations = async (
  options: GetInvitationsOptions = {}
): Promise<InvitationsResponse> => {
  const { status = "PENDING", page = 1, limit = 10 } = options;

  const params = new URLSearchParams({
    status,
    page: page.toString(),
    limit: limit.toString(),
  });

  return api.get(`/invitations/me?${params.toString()}`);
};

export const getInvitationsQueryOptions = (
  options: GetInvitationsOptions = {}
) => {
  return queryOptions({
    queryKey: ["invitations", options],
    queryFn: () => getInvitations(options),
  });
};

export const useInvitations = (options: GetInvitationsOptions = {}) => {
  return useQuery(getInvitationsQueryOptions(options));
};
