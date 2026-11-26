import { queryOptions, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import { QueryConfig } from "@/lib/react-query";

import { GradingScale, normalizeGradingScales } from "../utils/grading-scale";

/** Catálogo de escalas: primero las del sistema, después las creadas por usuarios. */
export const getGradingScales = async (): Promise<GradingScale[]> => {
  const response = await api.get<unknown>("/grading-scales");
  return normalizeGradingScales(response);
};

export const getGradingScalesQueryOptions = () => {
  return queryOptions({
    queryKey: ["grading-scales"],
    queryFn: () => getGradingScales(),
  });
};

type UseGradingScalesOptions = {
  queryConfig?: QueryConfig<typeof getGradingScalesQueryOptions>;
};

export const useGradingScales = ({ queryConfig }: UseGradingScalesOptions = {}) => {
  return useQuery({
    ...getGradingScalesQueryOptions(),
    ...queryConfig,
  });
};
