import { queryOptions, useQuery } from "@tanstack/react-query";

import { AcademicProfile, RegistrationsReport } from "../types";

import { api } from "@/lib/api-client";
import { QueryConfig } from "@/lib/react-query";

/** Every project of the profile's scope in the event, with its students and the totals */
export const getAcademicRegistrations = (
  profile: AcademicProfile,
  eventId: number,
): Promise<RegistrationsReport> =>
  api.get<RegistrationsReport>("/academic/registrations", {
    params: { profile, eventId },
  });

export const getAcademicRegistrationsQueryOptions = (
  profile: AcademicProfile,
  eventId: number,
) =>
  queryOptions({
    queryKey: ["academic", profile, "registrations", eventId],
    queryFn: () => getAcademicRegistrations(profile, eventId),
  });

type UseAcademicRegistrationsOptions = {
  profile: AcademicProfile;
  eventId?: number;
  queryConfig?: QueryConfig<typeof getAcademicRegistrationsQueryOptions>;
};

export const useAcademicRegistrations = ({
  profile,
  eventId,
  queryConfig,
}: UseAcademicRegistrationsOptions) =>
  useQuery({
    ...getAcademicRegistrationsQueryOptions(profile, eventId ?? 0),
    enabled: Boolean(eventId),
    ...queryConfig,
  });
