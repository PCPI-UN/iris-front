import { queryOptions, useQuery } from "@tanstack/react-query";

import { AcademicProfile, GradesReport } from "../types";

import { api } from "@/lib/api-client";
import { QueryConfig } from "@/lib/react-query";

/**
 * Evaluation progress of the approved projects of the profile's scope in the
 * event. The grade itself is not read here: it belongs to the Notas tab.
 */
export const getAcademicGrades = (
  profile: AcademicProfile,
  eventId: number,
): Promise<GradesReport> =>
  api.get<GradesReport>("/academic/grades", {
    params: { profile, eventId, format: "json" },
  });

export const getAcademicGradesQueryOptions = (
  profile: AcademicProfile,
  eventId: number,
) =>
  queryOptions({
    queryKey: ["academic", profile, "grades", eventId],
    queryFn: () => getAcademicGrades(profile, eventId),
  });

type UseAcademicGradesOptions = {
  profile: AcademicProfile;
  eventId?: number;
  queryConfig?: QueryConfig<typeof getAcademicGradesQueryOptions>;
};

export const useAcademicGrades = ({
  profile,
  eventId,
  queryConfig,
}: UseAcademicGradesOptions) =>
  useQuery({
    ...getAcademicGradesQueryOptions(profile, eventId ?? 0),
    enabled: Boolean(eventId),
    ...queryConfig,
  });
