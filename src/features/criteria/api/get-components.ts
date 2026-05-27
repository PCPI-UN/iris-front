import { queryOptions, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import { QueryConfig } from "@/lib/react-query";
import { CriterionComponent } from "@/types/api";

type GetComponentsResponse = {
  components: CriterionComponent[];
};

export const getComponents = async (eventId?: number): Promise<GetComponentsResponse> => {
  const queryParams = eventId ? `?eventId=${eventId}` : "";
  const response = await api.get<
    | CriterionComponent[]
    | GetComponentsResponse
    | { data?: GetComponentsResponse | CriterionComponent[] }
  >(`/criterions/components${queryParams}`);

  const responseData =
    typeof response === "object" && response !== null && "data" in (response as any)
      ? (response as any).data
      : response;

  let components = Array.isArray(responseData)
    ? responseData
    : Array.isArray((responseData as any)?.components)
      ? (responseData as any).components
      : [];

  // Filter components by eventId on the client side if provided
  if (eventId) {
    components = components.filter(
      (c: CriterionComponent) => c.eventId === eventId || c.eventId === undefined || c.eventId === null
    );
  }

  return {
    components,
  };
};

export const getComponentsQueryOptions = (eventId?: number) => {
  return queryOptions({
    queryKey: ["criterions", "components", eventId],
    queryFn: () => getComponents(eventId),
  });
};

type UseComponentsOptions = {
  eventId?: number;
  queryConfig?: QueryConfig<typeof getComponentsQueryOptions>;
};

export const useComponents = ({ eventId, queryConfig }: UseComponentsOptions = {}) => {
  return useQuery({
    ...getComponentsQueryOptions(eventId),
    ...queryConfig,
  });
};
