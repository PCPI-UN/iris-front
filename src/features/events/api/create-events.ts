import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { normalizeEventDatesForPayload } from "../utils/event-date-payload";
import { toEventTypeLabel } from "../utils/event-enums";

import { getEventsQueryOptions } from "./get-events";
import { normalizeEvent } from "./event-adapter";

import { api } from "@/lib/api-client";
import { MutationConfig } from "@/lib/react-query";
import { Event } from "@/types/api";

export const createEventInputSchema = z.object({
  name: z.string().min(1, "Este campo es obligatorio"),
  description: z.string().min(1, "Este campo es obligatorio"),
  accessCode: z.string().min(1, "Este campo es obligatorio"),
  startDate: z.string().min(10).max(32),
  endDate: z.string().min(10).max(32),
  inscriptionDeadline: z.string().min(10).max(32),
  evaluationsOpened: z.boolean(),
  isPubliclyJoinable: z.boolean().optional(),
  active: z.boolean().optional(),
  location: z.string().min(1, "Este campo es obligatorio"),
  locationDetails: z.string().optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  eventType: z.union([
    z.literal(1),
    z.literal(2),
    z.enum(["Exposition", "Competition"]),
  ]),
  inscriptionCost: z.coerce.number().optional(),
  inscriptionRequirements: z.string().optional(),
  minimumTeamSize: z.coerce.number().optional(),
  aboutOurAllies: z.string().optional(),
  /** Escala del catálogo (`GET /grading-scales`); una escala nueva se crea antes con `POST /grading-scales` */
  gradingScaleId: z.number().int().positive().optional(),
  // Academic term (GET /terms); the "no term" row -1 is not accepted
  termId: z.coerce.number().int().min(1, "Este campo es obligatorio"),
  // true: each project must belong to a course section (NRC) of the term
  requiresCourse: z.boolean(),
  organizers: z.array(z.string()).optional(),
  collaborators: z.array(z.string()).optional(),
  // Estos campos se manejan en tablas relacionadas (EventInscriptionDetail, Category, etc)
  specificInscriptionDetails: z
    .array(
      z.object({
        id: z.coerce.number().optional(),
        eventId: z.coerce.number().optional(),
        title: z.string().min(1, "Este campo es obligatorio"),
        description: z.string().min(1, "Este campo es obligatorio"),
        value: z.coerce.number().optional(),
        isRequired: z.boolean().optional(),
      }),
    )
    .optional(),
  awards: z
    .array(
      z.object({
        id: z.coerce.number().optional(),
        title: z.string().min(1, "Este campo es obligatorio"),
        description: z.string().optional(),
        value: z.coerce.number().optional(),
        position: z.coerce.number(),
        categoryId: z.coerce.number().optional(),
      }),
    )
    .optional(),
});

export type CreateEventInput = z.infer<typeof createEventInputSchema>;

export const createEvent = ({
  data,
}: {
  data: CreateEventInput;
}): Promise<Event> => {
  return api
    .post<Record<string, any>>("/events", {
      ...normalizeEventDatesForPayload(data),
      eventType: toEventTypeLabel(data.eventType),
    })
    .then((response) =>
      normalizeEvent(
        response?.event ??
          response?.data?.event ??
          response?.data?.data ??
          response?.data ??
          response,
      ),
    );
};

type UseCreateEventOptions = {
  mutationConfig?: MutationConfig<typeof createEvent>;
};

export const useCreateEvent = ({
  mutationConfig,
}: UseCreateEventOptions = {}) => {
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: getEventsQueryOptions().queryKey,
      });
      onSuccess?.(...args);
    },
    ...restConfig,
    mutationFn: createEvent,
  });
};
