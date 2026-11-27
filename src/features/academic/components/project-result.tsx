import type { AcademicProjectRanking, AcademicProjectResult } from "../types";

import { Medal, Trophy } from "lucide-react";

import {
  breakdownFromResult,
  formatPoints,
  scorePercent,
} from "../utils/academic-grades";

import { AcademicPanel } from "./academic-panel";
import { ComponentBreakdown } from "./component-breakdown";

type ProjectResultProps = {
  result: AcademicProjectResult;
  /** null for an event without ranking */
  ranking: AcademicProjectRanking | null;
  /** "Oficial" or "Preliminar", next to the heading */
  statusLabel?: string;
};

/** Final grade of a project, its position and awards, and the score of each component */
export const ProjectResult = ({
  result,
  ranking,
  statusLabel,
}: ProjectResultProps) => {
  const percent = scorePercent(result.finalScore, result.maxScore);

  return (
    <AcademicPanel
      aside={
        statusLabel && (
          <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-slate-300">
            {statusLabel}
          </span>
        )
      }
      title="Resultado"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-slate-400">
            <span className="text-4xl font-bold tabular-nums text-white">
              {formatPoints(result.finalScore)}
            </span>{" "}
            / {formatPoints(result.maxScore)}
          </p>
          {percent !== null && (
            <div
              aria-hidden="true"
              className="h-2 overflow-hidden rounded-full bg-white/10"
            >
              <div
                className="h-full rounded-full bg-cyan-400"
                style={{ width: `${percent}%` }}
              />
            </div>
          )}
        </div>

        {ranking && (
          <ul className="flex flex-col gap-2 text-sm">
            <li className="flex items-start gap-2 text-slate-200">
              <Medal
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-cyan-400"
              />
              <span className="min-w-0 break-words">
                Puesto {ranking.position}
                {ranking.tied && " (empate)"} en {ranking.categoryName}
              </span>
            </li>
            {ranking.awardTitle && (
              <li className="flex items-start gap-2 text-amber-200">
                <Trophy
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-amber-300"
                />
                <span className="min-w-0 break-words">
                  {ranking.awardTitle}
                </span>
              </li>
            )}
          </ul>
        )}

        {result.components.length > 0 && (
          <ComponentBreakdown
            items={breakdownFromResult(result.components)}
            label="Nota por componente"
            maxScore={result.maxScore}
          />
        )}
      </div>
    </AcademicPanel>
  );
};
