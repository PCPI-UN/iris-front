import type { AcademicEvent } from "../types";

import Link from "next/link";
import { CalendarDays, ChevronRight } from "lucide-react";

import {
  EVENT_STAGE_LABELS,
  type EventStage,
  eventStage,
  formatEventRange,
  groupEventsBySemester,
} from "../utils/academic-history";

const STAGE_STYLES: Record<EventStage, string> = {
  results: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  evaluation: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  finished: "border-white/10 bg-white/5 text-slate-400",
  ongoing: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
};

type SemesterHistoryProps = {
  events: AcademicEvent[];
  /** Where each event opens */
  getHref: (eventId: number) => string;
};

/** Events of the scope by semester, newest first; each one opens its projects */
export const SemesterHistory = ({ events, getHref }: SemesterHistoryProps) => (
  <div className="space-y-6">
    {groupEventsBySemester(events).map(({ semester, events: items }) => (
      <section key={semester} aria-labelledby={`semester-${semester}`}>
        <h2
          className="mb-3 text-[11px] font-medium uppercase tracking-wider text-slate-500"
          id={`semester-${semester}`}
        >
          Semestre {semester}
        </h2>
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.map((event) => {
            const stage = eventStage(event);

            return (
              <li key={event.id}>
                <Link
                  className="group flex min-h-[44px] items-center gap-3 rounded-3xl border border-white/10 bg-[#0e101a]/80 p-4 backdrop-blur-xl transition-colors hover:border-cyan-400/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                  href={getHref(event.id)}
                >
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <p className="break-words text-sm font-semibold text-white">
                      {event.name}
                    </p>
                    <p className="flex items-center gap-1.5 text-xs text-slate-400">
                      <CalendarDays aria-hidden="true" className="size-3.5" />
                      {formatEventRange(event)}
                    </p>
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] ${STAGE_STYLES[stage]}`}
                    >
                      {EVENT_STAGE_LABELS[stage]}
                    </span>
                  </div>
                  <ChevronRight
                    aria-hidden="true"
                    className="size-4 shrink-0 text-slate-500 transition-colors group-hover:text-cyan-300"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    ))}
  </div>
);
