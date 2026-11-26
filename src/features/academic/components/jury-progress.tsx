import type { ReactNode } from "react";
import type { AcademicProjectJuror } from "../types";

import { AcademicPanel } from "./academic-panel";

type JuryProgressProps = {
  /** Assigned jurors; null when the evaluation could not be read */
  jurors: AcademicProjectJuror[] | null;
  /** Shown instead of the progress when the project has no jurors */
  emptyMessage?: string;
  /** Line under the progress (when the grade is shown, for instance) */
  note?: ReactNode;
};

/** Jurors assigned to a project and which of them have evaluated it */
export const JuryProgress = ({
  jurors,
  emptyMessage = "Aún no tiene jurados asignados.",
  note,
}: JuryProgressProps) => {
  const total = jurors?.length ?? 0;
  const done = jurors?.filter((juror) => juror.evaluated).length ?? 0;
  const percent = total > 0 ? (done / total) * 100 : 0;

  return (
    <AcademicPanel title="Evaluación">
      {jurors === null ? (
        <p className="text-sm text-slate-400">
          No se pudo cargar el avance de la evaluación.
        </p>
      ) : total === 0 ? (
        <p className="text-sm text-slate-400">{emptyMessage}</p>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-slate-200">
            <span className="text-2xl font-bold tabular-nums text-white">
              {done}
            </span>{" "}
            de {total} {total === 1 ? "jurado evaluó" : "jurados evaluaron"}
          </p>
          <div
            aria-label="Avance de la evaluación"
            aria-valuemax={total}
            aria-valuemin={0}
            aria-valuenow={done}
            className="h-2 overflow-hidden rounded-full bg-white/10"
            role="progressbar"
          >
            <div
              className={`h-full rounded-full ${done === total ? "bg-emerald-400" : "bg-cyan-400"}`}
              style={{ width: `${percent}%` }}
            />
          </div>
          <ul aria-label="Jurados" className="divide-y divide-white/5">
            {jurors.map((juror) => (
              <li
                key={juror.userId}
                className="flex min-h-11 items-center justify-between gap-3 py-2"
              >
                <span className="truncate text-sm text-slate-200">
                  {juror.name ?? "Jurado sin nombre"}
                </span>
                <span
                  className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                    juror.evaluated
                      ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                      : "border-amber-500/40 bg-amber-500/15 text-amber-300"
                  }`}
                >
                  {juror.evaluated ? "Evaluó" : "Pendiente"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {note && <p className="mt-3 text-xs text-slate-400">{note}</p>}
    </AcademicPanel>
  );
};
