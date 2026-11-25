import { queryOptions, useQuery } from "@tanstack/react-query";

import { ACADEMIC_PROFILES, AcademicProfile } from "../types";

import { api } from "@/lib/api-client";
import { QueryConfig } from "@/lib/react-query";

/**
 * Academic profiles of the session (from its platform roles); empty for anyone
 * without one. A failure counts as none: the entries simply do not show.
 */
export const getAcademicProfiles = async (): Promise<AcademicProfile[]> => {
  try {
    const response = await api.get<unknown>("/academic/profiles", {
      suppressErrorNotification: true,
    });

    return Array.isArray(response)
      ? response.filter((value): value is AcademicProfile =>
          ACADEMIC_PROFILES.includes(value as AcademicProfile),
        )
      : [];
  } catch {
    return [];
  }
};

export const getAcademicProfilesQueryOptions = () =>
  queryOptions({
    queryKey: ["academic", "profiles"],
    queryFn: getAcademicProfiles,
    staleTime: 5 * 60 * 1000,
  });

type UseAcademicProfilesOptions = {
  queryConfig?: QueryConfig<typeof getAcademicProfilesQueryOptions>;
};

export const useAcademicProfiles = ({
  queryConfig,
}: UseAcademicProfilesOptions = {}) =>
  useQuery({ ...getAcademicProfilesQueryOptions(), ...queryConfig });
