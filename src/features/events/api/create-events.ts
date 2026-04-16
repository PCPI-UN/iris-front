import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';
import { Event } from '@/types/api';

import { getEventsQueryOptions } from './get-events';
import { normalizeEventDatesForPayload } from '../utils/event-date-payload';
import { normalizeEvent } from './event-adapter';
import { toEventTypeCode, toEvaluationTypeCode } from '../utils/event-enums';

export const createEventInputSchema = z.object({
  name: z.string().min(1, 'Required'),
  description: z.string().min(1, 'Required'),
  accessCode: z.string().min(1, 'Required'),
  startDate: z.string().min(10).max(32), 
  endDate: z.string().min(10).max(32), 
  inscriptionDeadline: z.string().min(10).max(32),
  evaluationsOpened: z.boolean(),
  isPubliclyJoinable: z.boolean().optional(),
  active: z.boolean().optional(),
  location: z.string().min(1, 'Required'),
  locationDetails: z.string().optional(),
  eventType: z.union([z.literal(1), z.literal(2), z.enum(["Exposition", "Competition"])]),
  inscriptionCost: z.coerce.number().optional(),
  inscriptionRequirements: z.string().optional(),
  minimumTeamSize: z.coerce.number().optional(),
  aboutOurAllies: z.string().optional(),
  evaluationType: z
    .union([
      z.literal(1),
      z.literal(2),
      z.enum(["ZERO_TO_FIVE", "ZERO_TO_HUNDRED"]),
      z.enum(["0-5", "0-100"]),
    ])
    .optional(),
  organizers: z.array(z.string()).optional(),
  collaborators: z.array(z.string()).optional(),
  // Estos campos se manejan en tablas relacionadas (EventInscriptionDetail, Category, etc)
  specificInscriptionDetails: z.array(z.object({
    id: z.coerce.number().optional(),
    eventId: z.coerce.number().optional(),
    title: z.string().min(1, 'Required'),
    description: z.string().min(1, 'Required'),
    value: z.coerce.number().optional(),
    isRequired: z.boolean().optional(),
  })).optional(),
  awards: z
    .array(
      z.object({
        id: z.coerce.number().optional(),
        title: z.string().min(1, "Required"),
        description: z.string().optional(),
        value: z.coerce.number().optional(),
        position: z.coerce.number(),
        categoryId: z.coerce.number().optional(),
      })
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
    .post<Record<string, any>>('/events', {
      ...normalizeEventDatesForPayload(data),
      eventType: toEventTypeCode(data.eventType),
      evaluationType:
        data.evaluationType === undefined
          ? undefined
          : toEvaluationTypeCode(data.evaluationType),
    })
    .then((response) =>
      normalizeEvent(response?.event ?? response?.data?.event ?? response?.data?.data ?? response?.data ?? response)
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
