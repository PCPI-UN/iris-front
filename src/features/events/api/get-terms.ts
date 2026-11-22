import { queryOptions, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import { QueryConfig } from "@/lib/react-query";
import { Term } from "@/types/api";

/** Term code as the university writes it: 2026 + "10" is 202610 */
export const formatTermCode = (term: Pick<Term, "year" | "period">) =>
  `${term.year}${term.period}`;

/** Academic terms an event can be created or edited with, newest first */
export const getTerms = async (): Promise<Term[]> => {
  const response = await api.get<Term[] | { data?: Term[]; terms?: Term[] }>(`/terms`);
  const terms = Array.isArray(response) ? response : (response?.terms ?? response?.data ?? []);

  return Array.isArray(terms) ? terms : [];
};

export const getTermsQueryOptions = () => {
  return queryOptions({
    queryKey: ["terms"],
    queryFn: () => getTerms(),
  });
};

type UseTermsOptions = {
  queryConfig?: QueryConfig<typeof getTermsQueryOptions>;
};

export const useTerms = ({ queryConfig }: UseTermsOptions = {}) => {
  return useQuery({
    ...getTermsQueryOptions(),
    ...queryConfig,
  });
};
