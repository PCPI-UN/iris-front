import type { AcademicJurorEvaluation } from "../types";

import {
  breakdownFromResult,
  formatScore,
  jurorLabel,
} from "../utils/academic-grades";

import { AcademicPanel } from "./academic-panel";
import { ComponentBreakdown } from "./component-breakdown";

type JurorEvaluationsProps = {
  evaluations: AcademicJurorEvaluation[];
  maxScore: number;
};

/**
 * Each juror's grade and comment without saying who the juror is (Jurado A, B...
 * in the order received); the score per criterion opens on demand.
 */
export const JurorEvaluations = ({
  evaluations,
  maxScore,
}: JurorEvaluationsProps) => (
  <AcademicPanel title="Evaluaciones">
    {evaluations.length === 0 ? (
      <p className="text-sm text-slate-400">Aún no hay evaluaciones.</p>
    ) : (
      <ul
        aria-label="Evaluaciones de los jurados"
        className="flex flex-col gap-3"
      >
        {evaluations.map((evaluation, index) => {
          const label = jurorLabel(index);

          return (
            <li
              key={label}
              className="flex flex-col gap-2 rounded-2xl border border-white/5 bg-white/[0.03] p-3"
            >
              <p className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-white">
                  {label}
                </span>
                <span className="text-sm font-semibold tabular-nums text-white">
                  {formatScore(evaluation.grade, maxScore)}
                </span>
              </p>
              {evaluation.comment ? (
                <p className="whitespace-pre-line break-words text-sm leading-relaxed text-slate-300">
                  {evaluation.comment}
                </p>
              ) : (
                <p className="text-xs text-slate-500">Sin comentario.</p>
              )}
              {evaluation.components.length > 0 && (
                <details className="group">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center text-xs font-semibold text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 [&::-webkit-details-marker]:hidden">
                    <span className="group-open:hidden">Ver desglose</span>
                    <span className="hidden group-open:inline">
                      Ocultar desglose
                    </span>
                  </summary>
                  <ComponentBreakdown
                    items={breakdownFromResult(evaluation.components)}
                    label={`Desglose de ${label}`}
                    maxScore={maxScore}
                  />
                </details>
              )}
            </li>
          );
        })}
      </ul>
    )}
  </AcademicPanel>
);
