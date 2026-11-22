import { queryOptions, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import { QueryConfig } from "@/lib/react-query";

import { isSearchLongEnough, TutorCandidate } from "../utils/tutors";

/** Users with the Tutor or Professor role matching the name; public, like the submission form */
export const getTutorCandidates = async (
  search: string,
): Promise<TutorCandidate[]> => {
  const response = await api.get<
    | TutorCandidate[]
    | { data?: TutorCandidate[]; candidates?: TutorCandidate[] }
  >(`/projects/tutor-candidates`, {
    params: { search: search.trim() },
    suppressErrorNotification: true,
  });

  const candidates = Array.isArray(response)
    ? response
    : (response?.candidates ?? response?.data ?? []);

  return Array.isArray(candidates) ? candidates : [];
};

export const getTutorCandidatesQueryOptions = (search: string) => {
  return queryOptions({
    queryKey: ["tutor-candidates", search.trim().toLowerCase()],
    queryFn: () => getTutorCandidates(search),
  });
};

type UseTutorCandidatesOptions = {
  search: string;
  queryConfig?: QueryConfig<typeof getTutorCandidatesQueryOptions>;
};

export const useTutorCandidates = ({
  search,
  queryConfig,
}: UseTutorCandidatesOptions) => {
  return useQuery({
    ...getTutorCandidatesQueryOptions(search),
    enabled: isSearchLongEnough(search),
    ...queryConfig,
  });
};
