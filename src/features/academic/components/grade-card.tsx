import type { GradeRow } from "../types";

import Link from "next/link";
import { BookOpen, ChevronRight, EyeOff, Users } from "lucide-react";

import { formatCourse } from "../utils/academic-labels";
import { formatScore, GRADE_STATUS_LABELS } from "../utils/academic-grades";

type GradeCardProps = {
  row: GradeRow;
  href: string;
  /** Top of the grading scale, to show "4.3 / 5"; null when unknown */
  maxScore: number | null;
};

/** A project in the grades list: its grade (or why there is none) and evaluation progress; opens its detail */
export const GradeCard = ({ row, href, maxScore }: GradeCardProps) => (
  <Link
    className="group flex h-full w-full flex-col gap-3 rounded-3xl border border-white/10 bg-[#0e101a]/80 p-5 backdrop-blur-xl transition-colors hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
    href={href}
  >
    <span className="flex items-center justify-between gap-2">
      <span className="font-mono text-xs text-slate-400">
        {row.projectCode || "Sin código"}
      </span>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {GRADE_STATUS_LABELS[row.gradeStatus]}
      </span>
    </span>

    <span className="flex items-start justify-between gap-3">
      <span className="line-clamp-2 min-w-0 break-words text-lg font-bold leading-snug text-white">
        {row.projectName}
      </span>
      <span className="shrink-0 text-right">
        {row.finalScore !== null ? (
          <span className="text-2xl font-bold tabular-nums text-white">
            {formatScore(row.finalScore, maxScore)}
          </span>
        ) : row.gradeHidden ? (
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <EyeOff aria-hidden="true" className="size-3.5" />
            Nota oculta
          </span>
        ) : (
          <span className="text-xs text-slate-500">Sin nota</span>
        )}
      </span>
    </span>

    <span className="mt-auto flex flex-col gap-1.5 text-xs text-slate-400">
      {row.academicCourse && (
        <span className="flex items-center gap-1.5">
          <BookOpen
            aria-hidden="true"
            className="size-3.5 shrink-0 text-cyan-400"
          />
          <span className="truncate">{formatCourse(row.academicCourse)}</span>
        </span>
      )}
      {row.participantNames.length > 0 && (
        <span className="flex items-center gap-1.5">
          <Users
            aria-hidden="true"
            className="size-3.5 shrink-0 text-cyan-400"
          />
          <span className="truncate">{row.participantNames.join(", ")}</span>
        </span>
      )}
      <span className="flex items-center justify-between gap-2">
        <span>
          {row.assignedJurors === 0
            ? "Sin jurados asignados"
            : `${row.completedEvaluations} de ${row.assignedJurors} ${
                row.assignedJurors === 1 ? "jurado evaluó" : "jurados evaluaron"
              }`}
        </span>
        <ChevronRight
          aria-hidden="true"
          className="size-4 shrink-0 text-slate-500 transition-transform group-hover:translate-x-0.5"
        />
      </span>
    </span>
  </Link>
);
