"use client";

import { useState } from "react";
import Link from "next/link";
import { keepPreviousData } from "@tanstack/react-query";
import dayjs from "dayjs";
import type { LucideIcon } from "lucide-react";
import {
  Archive,
  ArrowRight,
  Calendar,
  CalendarDays,
  ChevronDown,
  CircleDot,
  DoorClosed,
  History,
  UserPlus,
} from "lucide-react";

import {
  type MeEvent,
  type MeEventsStatus,
  useMeEvents,
} from "../api/get-me-events";
import {
  EVENT_ROLE_LABELS,
  EVENT_ROLE_STYLES,
  getEventDashboardHref,
} from "../utils/event-roles";

import { getEventKindLabel } from "./get-events-user/helpers";

import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { Spinner } from "@/components/ui/spinner";

/** Cards per page */
export const ME_EVENTS_PAGE_SIZE = 6;

const STATUS_BADGES: Record<
  string,
  { label: string; style: string; icon: LucideIcon }
> = {
  AVAILABLE: {
    label: "Activo",
    style: "border-emerald-400/50 bg-emerald-500/20 text-emerald-300",
    icon: CircleDot,
  },
  UPCOMING: {
    label: "Inscripciones abiertas",
    style: "border-sky-400/50 bg-sky-500/20 text-sky-300",
    icon: UserPlus,
  },
  REGISTRATION_CLOSED: {
    label: "Inscripciones cerradas",
    style: "border-orange-400/50 bg-orange-500/15 text-orange-300",
    icon: DoorClosed,
  },
  CLOSED: {
    label: "Cerrado",
    style: "border-white/10 bg-white/5 text-slate-400",
    icon: Archive,
  },
};

/** "20 – 22 feb, 2026"; the month and the year appear once when they repeat */
const formatRange = (event: MeEvent) => {
  const start = dayjs(event.startDate).locale("es");

  if (!event.endDate) return start.format("D MMM, YYYY");
  const end = dayjs(event.endDate).locale("es");

  if (start.isSame(end, "day")) return start.format("D MMM, YYYY");
  if (start.isSame(end, "month")) {
    return `${start.format("D")} – ${end.format("D MMM, YYYY")}`;
  }
  if (start.isSame(end, "year")) {
    return `${start.format("D MMM")} – ${end.format("D MMM, YYYY")}`;
  }

  return `${start.format("D MMM, YYYY")} – ${end.format("D MMM, YYYY")}`;
};

const MeEventCard = ({ event }: { event: MeEvent }) => {
  const badge = STATUS_BADGES[event.statusName];

  return (
    <div className="flex w-full flex-col gap-3 rounded-2xl border border-white/10 bg-[#0e101a]/70 p-4 backdrop-blur-xl sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        {badge && (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badge.style}`}
          >
            <badge.icon aria-hidden="true" className="size-3" />
            {badge.label}
          </span>
        )}
        <span className="text-xs text-slate-400">
          {getEventKindLabel(event.eventType)}
        </span>
      </div>

      <h3 className="line-clamp-2 break-words text-base font-bold text-white sm:text-lg">
        {event.name}
      </h3>

      <p className="flex items-center gap-1.5 text-xs text-slate-400">
        <Calendar className="size-3.5 shrink-0 text-cyan-400" />
        <span className="truncate">{formatRange(event)}</span>
      </p>

      {/* One link per role: each opens the event with the view of that role */}
      <ul
        aria-label={`Tus roles en ${event.name}`}
        className="mt-auto flex flex-col gap-2"
      >
        {event.roles.map((role) => (
          <li key={role}>
            <Link
              aria-label={`Abrir ${event.name} como ${EVENT_ROLE_LABELS[role].toLowerCase()}`}
              className={`flex min-h-[44px] items-center justify-between gap-3 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors hover:brightness-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${EVENT_ROLE_STYLES[role]}`}
              href={getEventDashboardHref(event.id, role)}
            >
              {EVENT_ROLE_LABELS[role]}
              <ArrowRight aria-hidden="true" className="size-4 shrink-0" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

/** Past event: name and one small link per role, no card */
const MeEventHistoryRow = ({ event }: { event: MeEvent }) => (
  <div className="flex flex-col gap-1.5 py-3">
    <span className="text-sm text-slate-200">{event.name}</span>
    <ul
      aria-label={`Tus roles en ${event.name}`}
      className="flex flex-wrap gap-1.5"
    >
      {event.roles.map((role) => (
        <li key={role}>
          <Link
            aria-label={`Abrir ${event.name} como ${EVENT_ROLE_LABELS[role].toLowerCase()}`}
            className={`inline-flex min-h-[44px] items-center rounded-full border px-2.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${EVENT_ROLE_STYLES[role]}`}
            href={getEventDashboardHref(event.id, role)}
          >
            {EVENT_ROLE_LABELS[role]}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

const EventsList = ({
  status,
  emptyMessage,
  compact = false,
}: {
  status: MeEventsStatus;
  emptyMessage: React.ReactNode;
  /** Past events as plain rows instead of cards */
  compact?: boolean;
}) => {
  const [page, setPage] = useState(1);
  const eventsQuery = useMeEvents({
    status,
    page,
    limit: ME_EVENTS_PAGE_SIZE,
    // Changing page keeps the current cards until the next ones arrive
    queryConfig: { placeholderData: keepPreviousData },
  });

  const events = eventsQuery.data?.data ?? [];
  const totalPages = eventsQuery.data?.meta?.totalPages ?? 1;

  if (eventsQuery.isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (eventsQuery.isError) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#0e101a]/70 p-5 text-center backdrop-blur-xl">
        <p className="text-sm text-slate-300">
          No se pudieron cargar tus eventos.
        </p>
        <Button
          className="mt-3 min-h-[44px]"
          variant="flat"
          onPress={() => void eventsQuery.refetch()}
        >
          Reintentar
        </Button>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#0e101a]/70 p-5 text-center backdrop-blur-xl">
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      {compact ? (
        <ul className="divide-y divide-white/5 rounded-2xl border border-white/10 bg-[#0e101a]/70 px-4 backdrop-blur-xl sm:px-5">
          {events.map((event) => (
            <li key={event.id}>
              <MeEventHistoryRow event={event} />
            </li>
          ))}
        </ul>
      ) : (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {events.map((event) => (
            <li key={event.id} className="flex">
              <MeEventCard event={event} />
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center pt-1">
          <Pagination
            showControls
            page={page}
            size="lg"
            total={totalPages}
            onChange={setPage}
          />
        </div>
      )}
    </>
  );
};

/** Events that have not ended, each with one link per role of the person */
export const CurrentEventsSection = () => (
  <section aria-labelledby="current-events-title" className="space-y-3">
    <h2
      className="flex items-center gap-2 text-base font-bold tracking-tight text-white sm:text-lg"
      id="current-events-title"
    >
      <CalendarDays aria-hidden="true" className="size-4.5 text-cyan-400" />
      <span>En curso</span>
    </h2>
    <EventsList
      emptyMessage={
        <>
          <p className="text-sm text-slate-300">No tienes eventos en curso.</p>
          <p className="mt-1 text-xs text-slate-400">
            Al aceptar una invitación o inscribirte a un evento con su código,
            aparece aquí.
          </p>
        </>
      }
      status="current"
    />
  </section>
);

/** Past events; collapsed, and it only asks for them when opened */
export const PastEventsSection = () => {
  const [open, setOpen] = useState(false);

  return (
    <section aria-labelledby="past-events-title" className="space-y-3">
      <h2 className="text-base font-bold tracking-tight text-white sm:text-lg">
        <button
          aria-controls="past-events-panel"
          aria-expanded={open}
          className="flex min-h-[44px] w-full items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-slate-200 transition-colors hover:border-white/20 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          id="past-events-title"
          type="button"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="flex items-center gap-2">
            <History aria-hidden="true" className="size-4 text-slate-400" />
            Historial de eventos
          </span>
          <ChevronDown
            aria-hidden="true"
            className={`size-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
      </h2>
      {open && (
        <div id="past-events-panel">
          <EventsList
            emptyMessage={
              <p className="text-sm text-slate-300">
                Aún no tienes eventos anteriores.
              </p>
            }
            compact
            status="past"
          />
        </div>
      )}
    </section>
  );
};
