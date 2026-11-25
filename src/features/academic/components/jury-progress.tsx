import type { ReactNode } from "react";

import { AcademicPanel } from "./academic-panel";

type JuryProgressProps = {
  assignedJurors: number;
  completedEvaluations: number;
  /** Shown instead of the progress when the project has no jurors */
  emptyMessage?: string;
  /** Line under the progress (when the grade is shown, for instance) */
  note?: ReactNode;
};

/** How many of the jurors assigned to a project have evaluated it */
export const JuryProgress = ({
  assignedJurors,
  completedEvaluations,
  emptyMessage = "Aún no tiene jurados asignados.",
  note,
}: JuryProgressProps) => {
  const done = Math.min(completedEvaluations, assignedJurors);
  const percent = assignedJurors > 0 ? (done / assignedJurors) * 100 : 0;

  return (
    <AcademicPanel title="Evaluación">
      {assignedJurors === 0 ? (
        <p className="text-sm text-slate-400">{emptyMessage}</p>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-slate-200">
            <span className="text-2xl font-bold tabular-nums text-white">
              {done}
            </span>{" "}
            de {assignedJurors}{" "}
            {assignedJurors === 1 ? "jurado evaluó" : "jurados evaluaron"}
          </p>
          <div
            aria-label="Avance de la evaluación"
            aria-valuemax={assignedJurors}
            aria-valuemin={0}
            aria-valuenow={done}
            className="h-2 overflow-hidden rounded-full bg-white/10"
            role="progressbar"
          >
            <div
              className={`h-full rounded-full ${done === assignedJurors ? "bg-emerald-400" : "bg-cyan-400"}`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      )}
      {note && <p className="mt-3 text-xs text-slate-400">{note}</p>}
    </AcademicPanel>
  );
};
