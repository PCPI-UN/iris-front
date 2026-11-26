"use client";

import type { LucideIcon } from "lucide-react";

import { Children, useState } from "react";
import Link from "next/link";
import { keepPreviousData } from "@tanstack/react-query";
import dayjs from "dayjs";
import {
  Archive,
  ArrowRight,
  BookOpenCheck,
  Building2,
  Calendar,
  CalendarDays,
  ChevronDown,
  Clock,
  CircleDot,
  ClipboardCheck,
  DoorClosed,
  History,
  Rocket,
  UserCheck,
  UserPlus,
} from "lucide-react";

import {
  type EventRoleCode,
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
  { label: string; style: string; glow: string; icon: LucideIcon }
> = {
  AVAILABLE: {
    label: "Activo",
    style: "border-emerald-400/50 bg-emerald-500/20 text-emerald-300",
    glow: "bg-emerald-500/20",
    icon: CircleDot,
  },
  UPCOMING: {
    label: "Inscripciones abiertas",
    style: "border-sky-400/50 bg-sky-500/20 text-sky-300",
    glow: "bg-sky-500/20",
    icon: UserPlus,
  },
  REGISTRATION_CLOSED: {
    label: "Inscripciones cerradas",
    style: "border-orange-400/50 bg-orange-500/15 text-orange-300",
    glow: "bg-orange-500/15",
    icon: DoorClosed,
  },
  CLOSED: {
    label: "Cerrado",
    style: "border-white/10 bg-white/5 text-slate-400",
    glow: "bg-white/5",
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

/** "Empieza en 3 días", "Termina mañana"... the time left to the next date of the event */
export const describeTimeLeft = (event: MeEvent, now = dayjs()) => {
  const starts = dayjs(event.startDate);
  const hasStarted = !starts.isAfter(now);
  const target = hasStarted ? dayjs(event.endDate ?? event.startDate) : starts;
  const days = target.startOf("day").diff(now.startOf("day"), "day");
  const verb = hasStarted ? "Termina" : "Empieza";

  if (days <= 0) return `${verb} hoy`;
  if (days === 1) return `${verb} mañana`;

  return `${verb} en ${days} días`;
};

/** Square tile of an event in progress: status, name, dates and one entry per role */
const MeEventCard = ({ event }: { event: MeEvent }) => {
  const badge = STATUS_BADGES[event.statusName];

  return (
    <article className="relative flex w-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0e101a]/80 p-5 backdrop-blur-xl transition-colors hover:border-white/20 sm:min-h-72 [&>*]:shrink-0">
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute -right-14 -top-14 size-44 rounded-full blur-3xl ${badge?.glow ?? "bg-cyan-500/10"}`}
      />

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

      <h3 className="mt-4 line-clamp-3 break-words text-xl font-bold leading-snug text-white">
        {event.name}
      </h3>

      <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
        <Calendar className="size-3.5 shrink-0 text-cyan-400" />
        <span className="truncate">{formatRange(event)}</span>
      </p>

      <p className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-300">
        <Clock aria-hidden="true" className="size-3.5 text-slate-400" />
        {describeTimeLeft(event)}
      </p>

      {/* One link per role: each opens the event with the view of that role */}
      <div className="mt-auto pt-5">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-slate-500">
          Entrar como
        </p>
        <ul
          aria-label={`Tus roles en ${event.name}`}
          className="flex flex-col gap-2"
        >
          {event.roles.map((role) => {
            const entry = ROLE_ENTRIES[role];
            const Icon = entry.icon;

            return (
              <li key={role}>
                <Link
                  aria-label={`Abrir ${event.name} como ${EVENT_ROLE_LABELS[role].toLowerCase()}`}
                  className={`group relative flex min-h-[56px] items-center gap-3 overflow-hidden rounded-2xl border bg-gradient-to-br to-transparent px-3 py-2.5 transition-all hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${entry.tile}`}
                  href={getEventDashboardHref(event.id, role)}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none absolute -right-8 -top-8 size-20 rounded-full blur-2xl ${entry.glow}`}
                  />
                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-xl border ${EVENT_ROLE_STYLES[role]}`}
                  >
                    <Icon aria-hidden="true" className="size-[18px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold leading-tight text-white">
                      {EVENT_ROLE_LABELS[role]}
                    </span>
                    <span className="block truncate text-xs text-slate-400">
                      {entry.hint}
                    </span>
                  </span>
                  <ArrowRight
                    aria-hidden="true"
                    className={`size-4 shrink-0 transition-transform group-hover:translate-x-0.5 ${entry.arrow}`}
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </article>
  );
};

/** Look of each role entry of a current event card: a small tile in the color of the role */
const ROLE_ENTRIES: Record<
  EventRoleCode,
  { icon: LucideIcon; hint: string; tile: string; glow: string; arrow: string }
> = {
  JURY: {
    icon: ClipboardCheck,
    hint: "Evalúa tus proyectos asignados",
    tile: "border-amber-500/30 from-amber-500/15 hover:border-amber-400/60 hover:shadow-amber-500/10",
    glow: "bg-amber-500/20",
    arrow: "text-amber-300",
  },
  PARTICIPANT: {
    icon: Rocket,
    hint: "Tu proyecto en el evento",
    tile: "border-cyan-500/30 from-cyan-500/15 hover:border-cyan-400/60 hover:shadow-cyan-500/10",
    glow: "bg-cyan-500/20",
    arrow: "text-cyan-300",
  },
  TUTOR: {
    icon: UserCheck,
    hint: "Proyectos que tutoras",
    tile: "border-violet-500/30 from-violet-500/15 hover:border-violet-400/60 hover:shadow-violet-500/10",
    glow: "bg-violet-500/20",
    arrow: "text-violet-300",
  },
  PROFESSOR: {
    icon: BookOpenCheck,
    hint: "Proyectos de tus cursos",
    tile: "border-emerald-500/30 from-emerald-500/15 hover:border-emerald-400/60 hover:shadow-emerald-500/10",
    glow: "bg-emerald-500/20",
    arrow: "text-emerald-300",
  },
  DIRECTOR: {
    icon: Building2,
    hint: "Proyectos de tu departamento",
    tile: "border-pink-500/30 from-pink-500/15 hover:border-pink-400/60 hover:shadow-pink-500/10",
    glow: "bg-pink-500/20",
    arrow: "text-pink-300",
  },
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
  leading,
}: {
  status: MeEventsStatus;
  emptyMessage: React.ReactNode;
  /** Past events as plain rows instead of cards */
  compact?: boolean;
  /** Tiles placed before the events in the grid (administration, academic profiles) */
  leading?: React.ReactNode;
}) => {
  const leadingTiles = Children.toArray(leading);
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

  // With a leading tile, loading and errors take one tile so it stays in place
  const withLeading = (tile: React.ReactNode) =>
    leadingTiles.length > 0 ? (
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {leadingTiles.map((leadingTile, index) => (
          <li key={index} className="flex">
            {leadingTile}
          </li>
        ))}
        <li className="flex">
          <div className="flex w-full flex-col items-center justify-center rounded-3xl border border-white/10 bg-[#0e101a]/70 p-5 text-center backdrop-blur-xl sm:min-h-72">
            {tile}
          </div>
        </li>
      </ul>
    ) : (
      tile
    );

  if (eventsQuery.isLoading) {
    return withLeading(
      <div className="flex h-32 items-center justify-center">
        <Spinner size="lg" />
      </div>,
    );
  }

  if (eventsQuery.isError) {
    return withLeading(
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
      </div>,
    );
  }

  if (events.length === 0 && compact) {
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
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {leadingTiles.map((leadingTile, index) => (
            <li key={index} className="flex">
              {leadingTile}
            </li>
          ))}
          {events.map((event) => (
            <li key={event.id} className="flex">
              <MeEventCard event={event} />
            </li>
          ))}
          {events.length === 0 && (
            <li className="flex">
              <div className="flex w-full flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-white/15 p-6 text-center sm:min-h-72">
                <CalendarDays
                  aria-hidden="true"
                  className="size-8 text-slate-500"
                />
                {emptyMessage}
              </div>
            </li>
          )}
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
export const CurrentEventsSection = ({
  leading,
}: {
  leading?: React.ReactNode;
}) => (
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
      leading={leading}
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
            compact
            emptyMessage={
              <p className="text-sm text-slate-300">
                Aún no tienes eventos anteriores.
              </p>
            }
            status="past"
          />
        </div>
      )}
    </section>
  );
};
