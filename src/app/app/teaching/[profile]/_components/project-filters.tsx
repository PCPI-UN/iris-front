"use client";

import type {
  AcademicCourse,
  ProjectReviewState,
} from "@/features/academic/types";

import { PROJECT_REVIEW_STATES } from "@/features/academic/types";
import {
  formatCourse,
  PROJECT_STATE_COLORS,
  PROJECT_STATE_LABELS,
} from "@/features/academic/utils/academic-labels";
import { Select, SelectItem } from "@/components/ui/select";

export type ProjectFilterValues = {
  state?: ProjectReviewState;
  academicCourseId?: number;
};

type ProjectFiltersProps = {
  values: ProjectFilterValues;
  courses: AcademicCourse[];
  onChange: (values: ProjectFilterValues) => void;
  /** Inline (desktop toolbar) or stacked (mobile sheet) */
  layout: "inline" | "stacked";
};

const ALL_COURSES = "all";

const chipClass = (active: boolean) =>
  `inline-flex min-h-[44px] items-center gap-2 rounded-xl border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
    active
      ? "border-cyan-400/60 bg-cyan-500/15 text-white"
      : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20"
  }`;

/** State and course section filters of the projects list */
export const ProjectFilters = ({
  values,
  courses,
  onChange,
  layout,
}: ProjectFiltersProps) => {
  const stacked = layout === "stacked";

  return (
    <div
      className={
        stacked
          ? "flex flex-col gap-6"
          : "flex flex-wrap items-center gap-x-4 gap-y-3"
      }
    >
      <fieldset className="min-w-0">
        <legend
          className={
            stacked
              ? "mb-3 text-[11px] font-medium uppercase tracking-wider text-slate-500"
              : "sr-only"
          }
        >
          Estado
        </legend>
        <div className="flex flex-wrap gap-2">
          <button
            aria-pressed={!values.state}
            className={chipClass(!values.state)}
            type="button"
            onClick={() => onChange({ ...values, state: undefined })}
          >
            Todos
          </button>
          {PROJECT_REVIEW_STATES.map((state) => (
            <button
              key={state}
              aria-pressed={values.state === state}
              className={chipClass(values.state === state)}
              type="button"
              onClick={() => onChange({ ...values, state })}
            >
              <span
                aria-hidden="true"
                className="size-2 rounded-full"
                style={{ background: PROJECT_STATE_COLORS[state] }}
              />
              {PROJECT_STATE_LABELS[state]}
            </button>
          ))}
        </div>
      </fieldset>

      {courses.length > 1 && (
        <Select
          className={stacked ? "w-full" : "w-full sm:w-56"}
          label="Curso"
          selectedKeys={[
            values.academicCourseId
              ? String(values.academicCourseId)
              : ALL_COURSES,
          ]}
          size="sm"
          onSelectionChange={(keys) => {
            const selected = Array.from(keys)[0];

            if (selected === undefined) return;
            onChange({
              ...values,
              academicCourseId:
                selected === ALL_COURSES ? undefined : Number(selected),
            });
          }}
        >
          {[
            <SelectItem key={ALL_COURSES}>Todos los cursos</SelectItem>,
            ...courses.map((course) => (
              <SelectItem key={String(course.id)}>
                {formatCourse(course)}
              </SelectItem>
            )),
          ]}
        </Select>
      )}
    </div>
  );
};
