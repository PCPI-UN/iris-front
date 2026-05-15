import { queryOptions, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import { QueryConfig } from "@/lib/react-query";
import { CriterionComponent } from "@/types/api";

type GetComponentsResponse = {
  components: CriterionComponent[];
};

export const getComponents = async (): Promise<GetComponentsResponse> => {
  const response = await api.get<
    | CriterionComponent[]
    | GetComponentsResponse
    | { data?: GetComponentsResponse | CriterionComponent[] }
  >("/criterions/components");

  const responseData =
    typeof response === "object" && response !== null && "data" in (response as any)
      ? (response as any).data
      : response;

  const components = Array.isArray(responseData)
    ? responseData
    : Array.isArray((responseData as any)?.components)
      ? (responseData as any).components
      : [];

  return {
    components,
  };
};

export const getComponentsQueryOptions = () => {
  return queryOptions({
    queryKey: ["criterions", "components"],
    queryFn: getComponents,
  });
};

type UseComponentsOptions = {
  queryConfig?: QueryConfig<typeof getComponentsQueryOptions>;
};

export const useComponents = ({ queryConfig }: UseComponentsOptions = {}) => {
  return useQuery({
    ...getComponentsQueryOptions(),
    ...queryConfig,
  });
};
