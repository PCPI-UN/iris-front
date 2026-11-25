import type { DepartmentStats } from "@/features/academic/types";

import { ChevronDown } from "lucide-react";

import {
  AcademicPanel,
  ComponentBreakdown,
  ScoreDistribution,
} from "@/features/academic/components";
import { breakdownFromStats } from "@/features/academic/utils/academic-grades";

export const NO_DEPARTMENT = "Sin departamento";

const evaluatedLabel = ({ evaluatedCount, projectCount }: DepartmentStats) =>
  `${evaluatedCount} de ${projectCount} ${
    projectCount === 1 ? "proyecto evaluado" : "proyectos evaluados"
  }`;

/** Averages and spread of each department, one folding card per department */
export const DepartmentStatsList = ({
  departments,
  maxScore,
}: {
  departments: DepartmentStats[];
  maxScore: number | null;
}) => (
  <AcademicPanel title="Por departamento">
    <ul className="flex flex-col gap-2">
      {departments.map((department) => {
        const name = department.departmentName ?? NO_DEPARTMENT;

        return (
          <li key={department.departmentId ?? "none"}>
            <details className="group/department rounded-2xl border border-white/5 bg-white/[0.03]">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-3 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 [&::-webkit-details-marker]:hidden">
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="break-words text-sm font-medium text-slate-200">
                    {name}
                  </span>
                  <span className="text-xs text-slate-400">
                    {evaluatedLabel(department)}
                  </span>
                </span>
                <ChevronDown
                  aria-hidden="true"
                  className="size-4 shrink-0 text-slate-500 transition-transform group-open/department:rotate-180"
                />
              </summary>
              <div className="border-t border-white/5 p-3">
                {department.evaluatedCount === 0 ? (
                  <p className="text-sm text-slate-400">
                    Aún no hay proyectos evaluados.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
                    <ComponentBreakdown
                      items={breakdownFromStats(department.components)}
                      label={`Promedio por componente en ${name}`}
                      maxScore={maxScore}
                    />
                    {department.distribution ? (
                      <ScoreDistribution buckets={department.distribution} />
                    ) : (
                      <p className="text-sm text-slate-400">
                        El evento no tiene escala de calificación.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </details>
          </li>
        );
      })}
    </ul>
  </AcademicPanel>
);
