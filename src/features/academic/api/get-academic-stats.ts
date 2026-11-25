import { queryOptions, useQuery } from "@tanstack/react-query";

import { AcademicProfile, AcademicStats } from "../types";

import { api } from "@/lib/api-client";
import { QueryConfig } from "@/lib/react-query";

/**
 * Average of each rubric component and criterion and spread of the final grades
 * over the evaluated projects of the profile's scope in the event.
 */
export const getAcademicStats = (
  profile: AcademicProfile,
  eventId: number,
): Promise<AcademicStats> =>
  api.get<AcademicStats>("/academic/stats", {
    params: { profile, eventId },
  });

export const getAcademicStatsQueryOptions = (
  profile: AcademicProfile,
  eventId: number,
) =>
  queryOptions({
    queryKey: ["academic", profile, "stats", eventId],
    queryFn: () => getAcademicStats(profile, eventId),
  });

type UseAcademicStatsOptions = {
  profile: AcademicProfile;
  eventId?: number;
  queryConfig?: QueryConfig<typeof getAcademicStatsQueryOptions>;
};

export const useAcademicStats = ({
  profile,
  eventId,
  queryConfig,
}: UseAcademicStatsOptions) =>
  useQuery({
    ...getAcademicStatsQueryOptions(profile, eventId ?? 0),
    enabled: Boolean(eventId),
    ...queryConfig,
  });
