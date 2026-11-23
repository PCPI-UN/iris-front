"use client";

import { useState } from "react";
import Link from "next/link";
import { keepPreviousData } from "@tanstack/react-query";
import { ArrowRight, Calendar, CalendarDays } from "lucide-react";

import { useMyEvents } from "../api/get-my-events";

import {
  RoleName,
  formatDateShort,
  getEventKindLabel,
  getRoleIcon,
  getRoleLabel,
} from "./get-events-user/helpers";

import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { Spinner } from "@/components/ui/spinner";
import { Event } from "@/types/api";

/** Cards per page; the panel reads the same first page to know if there are events */
export const MY_EVENTS_PAGE_SIZE = 6;

const ROLE_STYLES: Record<RoleName, string> = {
  Juror: "border-amber-500/40 bg-amber-500/15 text-amber-300",
  Participant: "border-cyan-500/40 bg-cyan-500/15 text-cyan-300",
};

const formatRange = (event: Event) => {
  const start = formatDateShort(event.startDate).day;

  if (!event.endDate) return start;
  const end = formatDateShort(event.endDate).day;

  return start === end ? start : `${start} – ${end}`;
};

const MyEventCard = ({ event }: { event: Event }) => {
  const roleName = event.role?.name as RoleName | undefined;

  return (
    <Link
      aria-label={`Abrir ${event.name}${roleName ? ` como ${getRoleLabel(roleName).toLowerCase()}` : ""}`}
      className="group flex min-h-[44px] w-full flex-col gap-3 rounded-2xl border border-white/10 bg-[#0e101a]/70 p-4 backdrop-blur-xl transition-colors hover:border-cyan-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 sm:p-5"
      href={`/app/events/${event.id}/dashboard`}
    >
      <div className="flex flex-wrap items-center gap-2">
        {roleName && (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${ROLE_STYLES[roleName]}`}
          >
            {getRoleIcon(roleName)}
            {getRoleLabel(roleName)}
          </span>
        )}
        <span
          className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
            event.active
              ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
              : "border-white/10 bg-white/5 text-slate-400"
          }`}
        >
          {event.active ? "Activo" : "Cerrado"}
        </span>
      </div>

      <h3 className="line-clamp-2 break-words text-base font-bold text-white sm:text-lg">
        {event.name}
      </h3>

      <div className="mt-auto flex items-end justify-between gap-3 text-xs text-slate-400">
        <div className="min-w-0 space-y-1">
          <p className="flex items-center gap-1.5">
            <Calendar className="size-3.5 shrink-0 text-cyan-400" />
            <span className="truncate">{formatRange(event)}</span>
          </p>
          <p>{getEventKindLabel(event.eventType)}</p>
        </div>
        <ArrowRight
          aria-hidden="true"
          className="size-5 shrink-0 text-cyan-300 transition-transform group-hover:translate-x-0.5"
        />
      </div>
    </Link>
  );
};

/**
 * Events where the session has a role (juror or participant), each one linking
 * to the event dashboard, which shows the view of that role.
 */
export const MyEventsSection = () => {
  const [page, setPage] = useState(1);
  const eventsQuery = useMyEvents({
    page,
    limit: MY_EVENTS_PAGE_SIZE,
    // Changing page keeps the current cards until the next ones arrive
    queryConfig: { placeholderData: keepPreviousData },
  });

  const events = eventsQuery.data?.data ?? [];
  const totalPages = eventsQuery.data?.meta?.totalPages ?? 1;

  return (
    <section aria-labelledby="my-events-title" className="space-y-3">
      <h2
        className="flex items-center gap-2 text-base font-bold tracking-tight text-white sm:text-lg"
        id="my-events-title"
      >
        <CalendarDays className="size-4.5 text-cyan-400" />
        <span>Mis eventos</span>
      </h2>

      {eventsQuery.isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : eventsQuery.isError ? (
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
      ) : events.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#0e101a]/70 p-5 text-center backdrop-blur-xl">
          <p className="text-sm text-slate-300">Aún no tienes eventos.</p>
          <p className="mt-1 text-xs text-slate-400">
            Al aceptar una invitación o inscribirte, el evento aparece aquí.
          </p>
        </div>
      ) : (
        <>
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <li key={event.id} className="flex">
                <MyEventCard event={event} />
              </li>
            ))}
          </ul>

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
      )}
    </section>
  );
};
