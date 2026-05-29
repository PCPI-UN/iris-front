import { queryOptions, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import { QueryConfig } from "@/lib/react-query";
import { Meta, Event } from "@/types/api";

import { normalizeEventsResponse } from "./normalize-events-response";

export const getPastEventsPublic = async (
  { page }: { page?: number } = { page: 1 }
): Promise<{ data: Event[]; meta: Meta }> => {
  const response = await api.get<Record<string, any>>(
    "/events/public/past",
    {
      params: { page },
      suppressErrorNotification: true,
    }
  );

  const normalized = normalizeEventsResponse(response);

  // Cliente: asegurar que solo se muestren eventos que estén activos
  // y cuyo endDate ya haya pasado. Evitamos tocar el backend; filtramos
  // sobre los datos normalizados para la vista pública de eventos pasados.
  const now = Date.now();
  const filtered = (normalized.data ?? []).filter((ev) => {
    try {
      if (!ev) return false;
      if (!ev.active) return false;
      if (!ev.endDate) return false;
      const parsed = Date.parse(ev.endDate);
      if (Number.isNaN(parsed)) return false;
      return parsed < now;
    } catch (e) {
      return false;
    }
  });

  return {
    data: filtered,
    meta: normalized.meta,
  };
};

export const getPastEventsQueryOptions = ({ page = 1 }: { page?: number } = {}) => {
  return queryOptions({
    queryKey: ["events", "past-public", { page }],
    queryFn: () => getPastEventsPublic({ page }),
  });
};

type UsePastEventsPublicOptions = {
  page?: number;
  queryConfig?: QueryConfig<typeof getPastEventsQueryOptions>;
};

export const usePastEventsPublic = ({ queryConfig, page }: UsePastEventsPublicOptions) => {
  return useQuery({
    ...getPastEventsQueryOptions({ page }),
    ...queryConfig,
  });
};

