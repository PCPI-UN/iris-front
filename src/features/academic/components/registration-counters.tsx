import type { RegistrationTotals } from "../types";

import { PROJECT_REVIEW_STATES } from "../types";
import {
  PROJECT_STATE_COLORS,
  PROJECT_STATE_LABELS,
} from "../utils/academic-labels";

/** Totals of the registrations: projects, confirmed and pending students, and projects per state */
export const RegistrationCounters = ({
  totals,
}: {
  totals: RegistrationTotals;
}) => {
  const figures = [
    { label: "Proyectos", value: totals.projects },
    { label: "Estudiantes confirmados", value: totals.confirmedStudents },
    { label: "Estudiantes por confirmar", value: totals.pendingStudents },
  ];

  return (
    <section
      aria-label="Resumen de inscripciones"
      className="rounded-3xl border border-white/10 bg-[#0e101a]/80 p-5 backdrop-blur-xl"
    >
      <dl className="grid grid-cols-3 gap-3">
        {figures.map(({ label, value }) => (
          <div
            key={label}
            className="flex min-w-0 flex-col-reverse justify-end"
          >
            <dt className="text-[11px] leading-tight text-slate-400">
              {label}
            </dt>
            <dd className="text-3xl font-bold tabular-nums text-white">
              {value}
            </dd>
          </div>
        ))}
      </dl>
      <ul
        aria-label="Proyectos por estado"
        className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-white/5 pt-4"
      >
        {PROJECT_REVIEW_STATES.map((state) => (
          <li
            key={state}
            className="flex items-center gap-1.5 text-xs text-slate-300"
          >
            <span
              aria-hidden="true"
              className="size-2 rounded-full"
              style={{ background: PROJECT_STATE_COLORS[state] }}
            />
            {PROJECT_STATE_LABELS[state]}
            <span className="font-semibold tabular-nums text-white">
              {totals.byState?.[state] ?? 0}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
};
