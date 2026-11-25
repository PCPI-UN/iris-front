import { queryOptions, useQuery } from "@tanstack/react-query";

import { RegistrationsReport } from "../types";

import { api } from "@/lib/api-client";
import { QueryConfig } from "@/lib/react-query";

/** Every project of the session's scope in the event, with its students and the totals */
export const getAcademicRegistrations = (
  eventId: number,
): Promise<RegistrationsReport> =>
  api.get<RegistrationsReport>("/academic/registrations", {
    params: { eventId },
  });

export const getAcademicRegistrationsQueryOptions = (eventId: number) =>
  queryOptions({
    queryKey: ["academic", "registrations", eventId],
    queryFn: () => getAcademicRegistrations(eventId),
  });

type UseAcademicRegistrationsOptions = {
  eventId?: number;
  queryConfig?: QueryConfig<typeof getAcademicRegistrationsQueryOptions>;
};

export const useAcademicRegistrations = ({
  eventId,
  queryConfig,
}: UseAcademicRegistrationsOptions) =>
  useQuery({
    ...getAcademicRegistrationsQueryOptions(eventId ?? 0),
    enabled: Boolean(eventId),
    ...queryConfig,
  });
