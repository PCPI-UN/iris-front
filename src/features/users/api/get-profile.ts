import { queryOptions, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import { QueryConfig } from "@/lib/react-query";

export type ProfileProject = {
  id: number;
  name: string;
  eventId: number;
  courseId: number;
  state: string;
  studentCode: string;
};

/** Response of GET /profile/me (gateway). */
export type Profile = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
  roles: string[];
  // Derived by project-service from the user's participations: read only
  academic: {
    studentCode: string | null;
    career: string | null;
    semester: string | null;
    derived: true;
  };
  projects: ProfileProject[];
  totalProjects: number;
};

export const profileQueryKey = ["profile", "me"] as const;

export const getProfile = (): Promise<Profile> => {
  return api.get<Profile>("/profile/me");
};

export const getProfileQueryOptions = () => {
  return queryOptions({
    queryKey: profileQueryKey,
    queryFn: getProfile,
  });
};

type UseProfileOptions = {
  queryConfig?: QueryConfig<typeof getProfileQueryOptions>;
};

export const useProfile = ({ queryConfig }: UseProfileOptions = {}) => {
  return useQuery({
    ...getProfileQueryOptions(),
    ...queryConfig,
  });
};
