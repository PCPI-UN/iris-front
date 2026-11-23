import { queryOptions, useQuery } from "@tanstack/react-query";

import { normalizeEvent } from "./event-adapter";

import { api } from "@/lib/api-client";
import { QueryConfig } from "@/lib/react-query";
import { Event, Meta } from "@/types/api";

/** Largest page GET /me/events accepts */
export const ME_EVENTS_MAX_LIMIT = 50;

/** Roles a person can hold in an event, in the order the backend lists them */
export const EVENT_ROLE_CODES = [
  "JURY",
  "PARTICIPANT",
  "TUTOR",
  "PROFESSOR",
  "DIRECTOR",
] as const;

export type EventRoleCode = (typeof EVENT_ROLE_CODES)[number];

export type MeEventsStatus = "current" | "past";

/** An event of the session with every role the person holds in it */
export type MeEvent = Event & {
  statusDescription?: string;
  /** Unknown codes from a newer backend are dropped, so the view never breaks */
  roles: EventRoleCode[];
};

export const isEventRoleCode = (value: unknown): value is EventRoleCode =>
  EVENT_ROLE_CODES.includes(value as EventRoleCode);

export const getMeEvents = async ({
  status,
  page = 1,
  limit,
}: {
  status: MeEventsStatus;
  page?: number;
  limit?: number;
}): Promise<{ data: MeEvent[]; meta: Meta }> => {
  const response = await api.get<{
      events?: any[];
      meta?: { currentPage?: number; total?: number; totalPages?: number };
    }>(
    `/me/events`,
    { params: { status, page, limit } },
  );

  const data = (response?.events ?? []).map((raw) => ({
    ...normalizeEvent(raw),
    statusDescription: raw?.statusDescription,
    roles: (Array.isArray(raw?.roles) ? raw.roles : []).filter(isEventRoleCode),
  }));

  return {
    data,
    meta: {
      page: response?.meta?.currentPage ?? page,
      total: response?.meta?.total ?? data.length,
      totalPages: Math.max(1, response?.meta?.totalPages ?? 1),
    },
  };
};

export const getMeEventsQueryOptions = ({
  status,
  page = 1,
  limit,
}: {
  status: MeEventsStatus;
  page?: number;
  limit?: number;
}) =>
  queryOptions({
    queryKey: ["events", "me", status, { page, limit }],
    queryFn: () => getMeEvents({ status, page, limit }),
  });

type UseMeEventsOptions = {
  status: MeEventsStatus;
  page?: number;
  limit?: number;
  queryConfig?: QueryConfig<typeof getMeEventsQueryOptions>;
};

export const useMeEvents = ({
  status,
  page,
  limit,
  queryConfig,
}: UseMeEventsOptions) =>
  useQuery({
    ...getMeEventsQueryOptions({ status, page, limit }),
    ...queryConfig,
  });
