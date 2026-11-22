import { useInfiniteQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";

export type PublicWinner = {
  winnerId: number;
  projectId: number;
  /** null when the project no longer exists */
  projectName: string | null;
  /** null when the fair's ranking does not show grades */
  grade: number | null;
};

export type PublicAward = {
  awardId: number;
  title: string;
  /** Co-winners are several winners of the same award, sharing this position */
  position: number;
  coWinners: boolean;
  winners: PublicWinner[];
};

export type PublicWinnersCategory = {
  categoryId: number;
  name: string;
  awards: PublicAward[];
};

export type PublicWinnersEvent = {
  eventId: number;
  name: string;
  startDate: string;
  endDate: string;
  categories: PublicWinnersCategory[];
};

export type PublicWinnersPage = {
  events: PublicWinnersEvent[];
  meta: {
    total: number;
    itemsOnCurrentPage: number;
    itemsPerPage: number;
    currentPage: number;
    totalPages: number;
  };
};

/** Fairs per page: the backend paginates by fair (limit max 50) */
export const WINNERS_PAGE_SIZE = 3;

/**
 * Winners of every fair with published results and a public ranking, newest
 * first (GET /events/public/winners, public). Every assigned award is included.
 */
export const getPublicWinners = ({ page }: { page: number }) =>
  api.get<PublicWinnersPage>("/events/public/winners", {
    params: { page, limit: WINNERS_PAGE_SIZE },
    suppressErrorNotification: true,
  });

export const usePublicWinners = () =>
  useInfiniteQuery({
    queryKey: ["events", "public", "winners"],
    queryFn: ({ pageParam }) => getPublicWinners({ page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta && lastPage.meta.currentPage < lastPage.meta.totalPages
        ? lastPage.meta.currentPage + 1
        : undefined,
  });
