import { useQuery, queryOptions } from "@tanstack/react-query";
import { z } from "zod";

import { api } from "@/lib/api-client";
import { QueryConfig } from "@/lib/react-query";
import { Event, Project } from "@/types/api";

export const getProjectInputSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
});

export type GetProjectInput = z.infer<typeof getProjectInputSchema>;

type ProjectByEventPayload = {
  project: Project;
  event: Event;
};

type ProjectByEventResponse =
  | { data: ProjectByEventPayload }
  | ProjectByEventPayload;

export const getProject = async ({
  eventId,
}: GetProjectInput): Promise<ProjectByEventPayload> => {
  const validatedInput = getProjectInputSchema.parse({ eventId });
  const response = await api.get<ProjectByEventResponse>(
    `/events/${validatedInput.eventId}/my-project`,
  );

  const payload = "data" in response ? response.data : response;

  if (!payload?.project || !payload?.event) {
    throw new Error("Invalid project response");
  }

  return payload;
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
