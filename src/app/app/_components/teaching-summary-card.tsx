"use client";

import Link from "next/link";
import { ArrowRight, BookOpenCheck, GraduationCap } from "lucide-react";

import { useAcademicEvents } from "@/features/academic/api/get-academic-events";
import {
  TEACHING_PROFILES,
  type TeachingProfile,
} from "@/features/academic/utils/academic-profiles";
import { Spinner } from "@/components/ui/spinner";
import { paths } from "@/config/paths";

/** Same colors as the professor and tutor roles of the event cards */
const TILE_STYLES: Record<
  TeachingProfile,
  {
    tile: string;
    glow: string;
    badge: string;
    icon: string;
    button: string;
  }
> = {
  PROFESSOR: {
    tile: "border-emerald-500/25 from-emerald-500/15 hover:border-emerald-400/50 hover:shadow-emerald-500/10 focus-visible:ring-emerald-400",
    glow: "bg-emerald-500/20",
    badge: "border-emerald-400/30 bg-emerald-500/15",
    icon: "text-emerald-300",
    button:
      "border-emerald-500/40 bg-emerald-500/10 text-emerald-200 group-hover:bg-emerald-500/20",
  },
  TUTOR: {
    tile: "border-violet-500/25 from-violet-500/15 hover:border-violet-400/50 hover:shadow-violet-500/10 focus-visible:ring-violet-400",
    glow: "bg-violet-500/20",
    badge: "border-violet-400/30 bg-violet-500/15",
    icon: "text-violet-300",
    button:
      "border-violet-500/40 bg-violet-500/10 text-violet-200 group-hover:bg-violet-500/20",
  },
};

/** Square entry to the teaching screen of one academic profile, a tile of the home grid */
export const TeachingSummaryCard = ({
  profile,
}: {
  profile: TeachingProfile;
}) => {
  const { data: events, isLoading } = useAcademicEvents({ profile });
  const latest = events?.[0];
  const texts = TEACHING_PROFILES[profile];
  const styles = TILE_STYLES[profile];
  const Icon = profile === "TUTOR" ? GraduationCap : BookOpenCheck;

  return (
    <Link
      className={`group relative flex w-full flex-col gap-5 overflow-hidden rounded-3xl border bg-gradient-to-br via-[#0e101a]/80 to-[#0e101a]/80 p-5 backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 sm:min-h-72 [&>*]:shrink-0 ${styles.tile}`}
      href={paths.app.teaching.getHref(texts.slug)}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute -right-14 -top-14 size-44 rounded-full blur-3xl ${styles.glow}`}
      />

      <div className="flex items-center gap-3">
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-2xl border ${styles.badge}`}
        >
          <Icon aria-hidden="true" className={`size-5 ${styles.icon}`} />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-bold leading-tight text-white">
            {texts.label}
          </h2>
          <p className="text-xs text-slate-400">{texts.description}</p>
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

      <span
        className={`mt-auto flex min-h-[44px] items-center justify-between gap-2 rounded-xl border px-4 text-sm font-semibold transition-colors ${styles.button}`}
      >
        Ver proyectos
        <ArrowRight
          aria-hidden="true"
          className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5"
        />
      </span>
    </Link>
  );
};
