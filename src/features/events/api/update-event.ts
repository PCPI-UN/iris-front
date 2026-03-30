import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { api } from "@/lib/api-client";
import { MutationConfig } from "@/lib/react-query";
import { Event } from "@/types/api";

import { normalizeEvent } from "./event-adapter";
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
  locationDetails: z.string().optional(),
  inscriptionCost: z.coerce.number().optional(),
  inscriptionRequirements: z.string().optional(),
  minimumTeamSize: z.coerce.number().optional(),
  aboutOurAllies: z.string().optional(),
  organizers: z.array(z.string()).optional(),
  collaborators: z.array(z.string()).optional(),
  // Estos campos se manejan en tablas relacionadas
  specificInscriptionDetails: z
    .array(
      z.object({
        title: z.string().min(1, "Required"),
        description: z.string().min(1, "Required"),
      })
    )
    .optional(),
  awards: z
    .array(
      z.object({
        top: z.coerce.number(),
        position: z.coerce.number().optional(),
        title: z.string().optional(),
        description: z.string().min(1, "Required"),
      })
    )
    .optional(),
  evaluationType: z.enum(["0-5", "0-100"]).optional(),
});

export type UpdateEventInput = z.infer<typeof updateEventInputSchema>;

export const updateEvent = ({
  data,
}: {
  data: UpdateEventInput;
}): Promise<Event> => {
  return api
    .patch<Record<string, any>>(`/events/${data.id}`, data)
    .then((response) => normalizeEvent(response?.data ?? response));
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
