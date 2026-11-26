import type { AcademicCourse, ProjectReviewState } from "../types";

import Link from "next/link";
import { BookOpen, ChevronRight, GraduationCap, Users } from "lucide-react";

import { formatCourse } from "../utils/academic-labels";

import { ProjectStateBadge } from "./project-state-badge";

type AcademicProjectCardProps = {
  href: string;
  name: string;
  code?: string | null;
  state: ProjectReviewState;
  course?: AcademicCourse | null;
  /** "3 estudiantes · 1 pendiente" */
  studentsLabel?: string;
  tutors?: string[];
};

/** A project in a list: code, state, name, course section, students and tutor; opens its detail */
export const AcademicProjectCard = ({
  href,
  name,
  code,
  state,
  course,
  studentsLabel,
  tutors = [],
}: AcademicProjectCardProps) => (
  <Link
    className="group flex h-full w-full flex-col gap-3 rounded-3xl border border-white/10 bg-[#0e101a]/80 p-5 backdrop-blur-xl transition-colors hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
    href={href}
  >
    <span className="flex items-center justify-between gap-2">
      <span className="font-mono text-xs text-slate-400">
        {code || "Sin código"}
      </span>
      <ProjectStateBadge state={state} />
    </span>

    <span className="line-clamp-2 break-words text-lg font-bold leading-snug text-white">
      {name}
    </span>

    <span className="mt-auto flex flex-col gap-1.5 text-xs text-slate-400">
      {course && (
        <span className="flex items-center gap-1.5">
          <BookOpen
            aria-hidden="true"
            className="size-3.5 shrink-0 text-cyan-400"
          />
          <span className="truncate">{formatCourse(course)}</span>
        </span>
      )}
      {tutors.length > 0 && (
        <span className="flex items-center gap-1.5">
          <GraduationCap
            aria-hidden="true"
            className="size-3.5 shrink-0 text-cyan-400"
          />
          <span className="truncate">{tutors.join(", ")}</span>
        </span>
      )}
      <span className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5">
          <Users
            aria-hidden="true"
            className="size-3.5 shrink-0 text-cyan-400"
          />
          {studentsLabel ?? "Sin estudiantes"}
        </span>
        <ChevronRight
          aria-hidden="true"
          className="size-4 shrink-0 text-slate-500 transition-transform group-hover:translate-x-0.5"
        />
      </span>
    </span>
  </Link>
);
