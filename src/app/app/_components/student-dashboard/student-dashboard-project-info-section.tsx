import { Button } from "@heroui/button";
import { Edit2, FolderOpen } from "lucide-react";
import { StudentDashboardSectionCard } from "./student-dashboard-section-card";

type StudentDashboardProjectInfoSectionProps = {
  projectName?: string;
  projectDescription?: string;
  canEdit: boolean;
  onEdit: () => void;
};

export const StudentDashboardProjectInfoSection = ({
  projectName,
  projectDescription,
  canEdit,
  onEdit,
}: StudentDashboardProjectInfoSectionProps) => {
  return (
    <StudentDashboardSectionCard
      title="Proyecto"
      icon={FolderOpen}
      className="space-y-5 transition-shadow hover:shadow-lg"
      action={
        canEdit ? (
          <Button
            size="sm"
            variant="flat"
            className="mt-2 flex items-center gap-1.5 text-sm text-yellow-600 dark:text-yellow-400"
            onClick={onEdit}
            aria-label="Editar nombre y descripcion del proyecto"
          >
            <Edit2 className="h-3 w-3" />
            Editar
          </Button>
        ) : null
      }
    >
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-1.5">
          <label
            htmlFor="project-name"
            className="text-xs font-semibold uppercase tracking-wide text-default-500"
          >
            Nombre del proyecto
          </label>
          <div
            id="project-name"
            className="w-full rounded-xl border border-default-200 bg-default-50/50 px-4 py-3 font-bold"
          >
            {projectName || "Sin nombre"}
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="project-description"
            className="text-xs font-semibold uppercase tracking-wide text-default-500"
          >
            Descripcion
          </label>
          <div
            id="project-description"
            className="min-h-[72px] w-full rounded-xl border border-default-200 bg-default-50/50 px-4 py-3 text-sm leading-relaxed text-default-600"
          >
            {projectDescription || "Sin descripcion registrada"}
          </div>
        </div>
      </div>
    </StudentDashboardSectionCard>
  );
};
