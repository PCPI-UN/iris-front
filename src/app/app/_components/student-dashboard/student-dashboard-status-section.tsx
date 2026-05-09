import { CheckCircle2, ClipboardList, Edit2 } from "lucide-react";
import {
  getProjectStateLabel,
  getStateColor,
} from "../../../../features/events/api/student-dashboard.helpers";
import { StudentDashboardSectionCard } from "./student-dashboard-section-card";

type StudentDashboardStatusSectionProps = {
  state?: string;
  canEdit: boolean;
  projectCode?: string;
};

export const StudentDashboardStatusSection = ({
  state,
  canEdit,
  projectCode,
}: StudentDashboardStatusSectionProps) => {
  return (
    <a href="#save-changes" className="scrollbar-behavior-auto ">
      <StudentDashboardSectionCard
        title="Estado del proyecto"
        icon={ClipboardList}
        className="space-y-5"
      >
        <div className="space-y-1.5">
          <div className="flex w-full items-center justify-between">
            <h3 className="text-md font-semibold text-default-700 px-2">Estado del proyecto</h3>
          </div>

          <div
            id="project-state"
            role="status"
            aria-live="polite"
            className="flex w-full flex-col gap-3 rounded-xl border border-default-200 bg-default-50/50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5"
          >
            <label
              htmlFor="project-state"
              className="text-xs font-semibold uppercase tracking-wide text-default-500"
            >
              Estado actual:
            </label>

            <span
              className={`inline-flex w-full items-center justify-center gap-2 rounded-full p-1 text-sm font-semibold sm:w-auto sm:px-3 sm:py-1 ${getStateColor(state)}`}
              aria-label={`Estado: ${getProjectStateLabel(state)}`}
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              {getProjectStateLabel(state)}
            </span>
          </div>

          {canEdit && (
            <p
              role="alert"
              className="mt-2 flex items-center gap-4 text-sm text-sky-200  "
            >
              <Edit2 className="size-4 shrink-0" aria-hidden="true" />
              <span className="font-semibold">
                {" "}
                Tu proyecto requiere cambios. Puedes editar la informacion y
                volver a enviarlo.
              </span>
            </p>
          )}
        </div>
      </StudentDashboardSectionCard>
    </a>
  );
};
