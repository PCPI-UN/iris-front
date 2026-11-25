import { queryOptions, useQuery } from "@tanstack/react-query";

import { GradesReport } from "../types";

import { api } from "@/lib/api-client";
import { QueryConfig } from "@/lib/react-query";

/**
 * Evaluation progress of the approved projects of the session's scope in the
 * event. The grade itself is not read here: it belongs to the Notas tab.
 */
export const getAcademicGrades = (eventId: number): Promise<GradesReport> =>
  api.get<GradesReport>("/academic/grades", {
    params: { eventId, format: "json" },
  });

export const getAcademicGradesQueryOptions = (eventId: number) =>
  queryOptions({
    queryKey: ["academic", "grades", eventId],
    queryFn: () => getAcademicGrades(eventId),
  });

type UseAcademicGradesOptions = {
  eventId?: number;
  queryConfig?: QueryConfig<typeof getAcademicGradesQueryOptions>;
};

export const useAcademicGrades = ({
  eventId,
  queryConfig,
}: UseAcademicGradesOptions) =>
  useQuery({
    ...getAcademicGradesQueryOptions(eventId ?? 0),
    enabled: Boolean(eventId),
    ...queryConfig,
  });
