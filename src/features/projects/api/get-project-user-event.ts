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
}: GetProjectInput): Promise<ProjectByEventPayload | null> => {
  const validatedInput = getProjectInputSchema.parse({ eventId });
  try {
    const response = await api.get<any>(
      `/events/${validatedInput.eventId}/my-project`,
      { suppressErrorNotification: true },
    );
    const payload =
      response && typeof response === "object" && "data" in response
        ? response.data
        : response;

    if (payload?.project && payload?.event) {
      return payload;
    }

    if (payload?.id && (payload?.enrollmentStatus || payload?.state)) {
      return {
        project: {
          ...payload,
          state: payload.enrollmentStatus ?? payload.state,
        } as Project,
        event: {
          id: payload.eventId,
          name: payload.eventName ?? "",
        } as Event,
      };
    }

    throw new Error("Invalid project response");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message === "No project found for this user in the specified event") {
      return null;
    }

    throw error;
  }
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
