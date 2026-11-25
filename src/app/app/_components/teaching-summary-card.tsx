"use client";

import Link from "next/link";
import { ArrowRight, BookOpenCheck } from "lucide-react";

import { useAcademicEvents } from "@/features/academic/api/get-academic-events";
import { Spinner } from "@/components/ui/spinner";
import { paths } from "@/config/paths";

/** Square entry to Docencia (projects of the session's courses and tutoring), a tile of the home grid */
export const TeachingSummaryCard = () => {
  const { data: events, isLoading } = useAcademicEvents();
  const latest = events?.[0];

  return (
    <Link
      className="group relative flex w-full flex-col gap-5 overflow-hidden rounded-3xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/15 via-[#0e101a]/80 to-[#0e101a]/80 p-5 backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-emerald-400/50 hover:shadow-lg hover:shadow-emerald-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 sm:min-h-72 [&>*]:shrink-0"
      href={paths.app.teaching.getHref()}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-14 -top-14 size-44 rounded-full bg-emerald-500/20 blur-3xl"
      />

      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-500/15">
          <BookOpenCheck
            aria-hidden="true"
            className="size-5 text-emerald-300"
          />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-bold leading-tight text-white">
            Docencia
          </h2>
          <p className="text-xs text-slate-400">
            Proyectos de tus cursos y tutorías
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <dl className="flex flex-1 flex-col justify-center gap-1">
          <dt className="text-[11px] uppercase tracking-wider text-slate-500">
            Evento más reciente
          </dt>
          <dd className="line-clamp-2 text-base font-semibold text-white">
            {latest?.name ?? "Aún sin proyectos"}
          </dd>
          {events && events.length > 1 && (
            <dd className="text-xs text-slate-400">
              y {events.length - 1}{" "}
              {events.length - 1 === 1 ? "evento más" : "eventos más"}
            </dd>
          )}
        </dl>
      )}

      <span className="mt-auto flex min-h-[44px] items-center justify-between gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 text-sm font-semibold text-emerald-200 transition-colors group-hover:bg-emerald-500/20">
        Ver proyectos
        <ArrowRight
          aria-hidden="true"
          className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5"
        />
      </span>
    </Link>
  );
};
