import { queryOptions, useQuery } from "@tanstack/react-query";

import { AcademicEvent, AcademicProfile } from "../types";

import { api } from "@/lib/api-client";
import { QueryConfig } from "@/lib/react-query";

/** Events where the projects of the profile's scope take part, newest first */
export const getAcademicEvents = (
  profile: AcademicProfile,
): Promise<AcademicEvent[]> =>
  api.get<AcademicEvent[]>("/academic/events", { params: { profile } });

export const getAcademicEventsQueryOptions = (profile: AcademicProfile) =>
  queryOptions({
    queryKey: ["academic", profile, "events"],
    queryFn: () => getAcademicEvents(profile),
  });

type UseAcademicEventsOptions = {
  profile: AcademicProfile;
  queryConfig?: QueryConfig<typeof getAcademicEventsQueryOptions>;
};

export const useAcademicEvents = ({
  profile,
  queryConfig,
}: UseAcademicEventsOptions) =>
  useQuery({ ...getAcademicEventsQueryOptions(profile), ...queryConfig });
