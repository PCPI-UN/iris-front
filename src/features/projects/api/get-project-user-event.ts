import { useQuery, queryOptions } from "@tanstack/react-query";
import { z } from "zod";

import { api } from "@/lib/api-client";
import { QueryConfig } from "@/lib/react-query";
import { Event, Project } from "@/types/api";

export const getProjectInputSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
});

export type GetProjectInput = z.infer<typeof getProjectInputSchema>;

export const getProject = async ({
  eventId,
}: GetProjectInput): Promise<{ project: Project; event: Event }> => {
  const validatedInput = getProjectInputSchema.parse({ eventId });
  const response = await api.get<{ project: Project; event: Event }>(
    `/events/${validatedInput.eventId}/my-project`,
  );

  return response;
};

export const getProjectQueryOptions = (eventId: string) => {
  return queryOptions({
    queryKey: ["my-project", eventId],
    queryFn: () => getProject({ eventId }),
    enabled: !!eventId,
  });
};

type UseProjectOptions = {
  eventId: string;
  queryConfig?: QueryConfig<typeof getProjectQueryOptions>;
};

export const useProject = ({ eventId, queryConfig }: UseProjectOptions) => {
  return useQuery({
    ...getProjectQueryOptions(eventId),
    ...queryConfig,
  });
};
