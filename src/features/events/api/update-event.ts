import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { api } from "@/lib/api-client";
import { MutationConfig } from "@/lib/react-query";
import { Event } from "@/types/api";

import { getEventQueryOptions } from "./get-event";
import { getEventsQueryOptions } from "./get-events";

export const updateEventInputSchema = z.object({
  id: z.number().positive(),
  name: z.string().min(2).max(255),
  description: z.string().max(3000),
  accessCode: z.string().optional(),
  isPubliclyJoinable: z.boolean().optional(),
  startDate: z.string().min(10).max(10), 
  endDate: z.string().min(10).max(10),
  inscriptionDeadline: z.string().min(10).max(10),
  evaluationsOpened: z.boolean(),
  active: z.boolean().optional(),
  location: z.string().optional(),
});

export type UpdateEventInput = z.infer<typeof updateEventInputSchema>;

export const updateEvent = ({
  data,
}: {
  data: UpdateEventInput;
}): Promise<Event> => {
  return api.patch(`/events/${data.id}`, data);
};

type UseUpdateEventOptions = {
  mutationConfig?: MutationConfig<typeof updateEvent>;
};

export const useUpdateEvent = ({
  mutationConfig,
}: UseUpdateEventOptions = {}) => {
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: (data, ...args) => {
      queryClient.invalidateQueries({
        queryKey: getEventQueryOptions(data.id).queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: getEventsQueryOptions().queryKey,
      });
      onSuccess?.(data, ...args);
    },
    ...restConfig,
    mutationFn: updateEvent,
  });
};
