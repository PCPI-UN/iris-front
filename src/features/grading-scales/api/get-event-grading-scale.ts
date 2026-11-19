import { queryOptions, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import { QueryConfig } from "@/lib/react-query";

import { GradingScale, normalizeGradingScale } from "../utils/grading-scale";

/**
 * Escala del evento para el formulario del jurado. El gateway la incluye en `GET /events/:id`
 * (`gradingScale`), que pide el permiso `read:events`; un jurado sin ese permiso recibe 403. En
 * ese caso se devuelve `null`, sin avisar al usuario, y el formulario usa las etiquetas por defecto.
 */
export const getEventGradingScale = async (eventId: number): Promise<GradingScale | null> => {
  try {
    const response = await api.get<Record<string, any>>(`/events/${eventId}`, {
      suppressErrorNotification: true,
    });
    const event = response?.event ?? response?.data?.event ?? response?.data ?? response;
    return normalizeGradingScale(event?.gradingScale);
  } catch {
    return null;
  }
};

export const getEventGradingScaleQueryOptions = (eventId: number) => {
  return queryOptions({
    queryKey: ["events", eventId, "grading-scale"],
    queryFn: () => getEventGradingScale(eventId),
  });
};

type UseEventGradingScaleOptions = {
  eventId: number;
  queryConfig?: QueryConfig<typeof getEventGradingScaleQueryOptions>;
};

export const useEventGradingScale = ({ eventId, queryConfig }: UseEventGradingScaleOptions) => {
  return useQuery({
    ...getEventGradingScaleQueryOptions(eventId),
    enabled: Number.isFinite(eventId) && eventId > 0,
    ...queryConfig,
  });
};
