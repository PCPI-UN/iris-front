import { queryOptions, useQuery } from "@tanstack/react-query";

import { AcademicEvent } from "../types";

import { api } from "@/lib/api-client";
import { QueryConfig } from "@/lib/react-query";

export const getAcademicEvents = (): Promise<AcademicEvent[]> =>
  api.get<AcademicEvent[]>("/academic/events");

export const getAcademicEventsQueryOptions = () =>
  queryOptions({
    queryKey: ["academic", "events"],
    queryFn: getAcademicEvents,
  });

type UseAcademicEventsOptions = {
  queryConfig?: QueryConfig<typeof getAcademicEventsQueryOptions>;
};

export const useAcademicEvents = ({
  queryConfig,
}: UseAcademicEventsOptions = {}) =>
  useQuery({ ...getAcademicEventsQueryOptions(), ...queryConfig });
