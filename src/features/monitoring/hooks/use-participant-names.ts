import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";

import { ParticipantName } from "../utils/participant-labels";

import { api } from "@/lib/api-client";

/** Names barely change: one lookup per user every 10 minutes is enough */
const NAME_STALE_TIME_MS = 10 * 60 * 1000;

const getUserName = (userId: number) =>
  api.get<ParticipantName>(`/users/${userId}`, {
    // A missing name falls back to the student code, without an error toast
    suppressErrorNotification: true,
  });

/**
 * Names of the given users through GET /users/:id (read:users). Used for the
 * enrolled participants the with-jurors listing sends without a name; only
 * for the rows on screen, so the number of requests stays small.
 */
export const useParticipantNames = (userIds: number[]) => {
  const results = useQueries({
    queries: userIds.map((userId) => ({
      queryKey: ["user-name", userId],
      queryFn: () => getUserName(userId),
      staleTime: NAME_STALE_TIME_MS,
      retry: false,
    })),
  });

  const dataKey = results.map((result) => result.dataUpdatedAt).join(",");

  return useMemo(() => {
    const names = new Map<number, ParticipantName>();

    results.forEach((result, index) => {
      if (result.data) names.set(userIds[index], result.data);
    });

    return names;
    // `results` is a new array each render; dataKey tells when the data changed
  }, [dataKey, userIds.join(",")]);
};
