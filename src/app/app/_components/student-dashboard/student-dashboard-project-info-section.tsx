"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Edit2, FolderOpen, Check, X } from "lucide-react";
import { useNotifications } from "@/components/ui/notifications";
import { useUpdateProject } from "@/features/projects/api/update-project";
import { StudentDashboardSectionCard } from "./student-dashboard-section-card";

type StudentDashboardProjectInfoSectionProps = {
  projectId: string;
  projectName?: string;
  projectDescription?: string;
  canEdit: boolean;
};

export const StudentDashboardProjectInfoSection = ({
  projectId,
  projectName,
  projectDescription,
  canEdit,
}: StudentDashboardProjectInfoSectionProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(projectName || "Sin nombre");
  const [editedDescription, setEditedDescription] = useState(
    projectDescription || "Sin descripcion registrada"
  );
  const { addNotification } = useNotifications();
  const updateProjectMutation = useUpdateProject({
    mutationConfig: {
      onSuccess: () => {
        addNotification({
          type: "success",
          title: "Proyecto actualizado",
          message: "Los cambios se guardaron correctamente",
        });
        setIsEditing(false);
      },
    },
  });

  const handleSave = async () => {
    try {
      await updateProjectMutation.mutateAsync({
        projectId,
        data: {
          name: editedName,
          description: editedDescription,
        },
      });
    } catch (error) {
      addNotification({
        type: "error",
        title: "Error al actualizar",
        message: "Hubo un error al guardar los cambios",
      });
      console.error("Error saving project changes:", error);
    }
  };

  const handleCancel = () => {
    setEditedName(projectName || "Sin nombre");
    setEditedDescription(projectDescription || "Sin descripcion registrada");
    setIsEditing(false);
  };

  return (
    <StudentDashboardSectionCard
      title="Proyecto"
      icon={FolderOpen}
      className="space-y-5 transition-shadow hover:shadow-lg"
      action={
        canEdit && !isEditing ? (
          <Button
            size="sm"
            variant="flat"
            className="mt-2 flex w-full items-center justify-center gap-1.5 text-sm bg-sky-200/20 text-sky-300 hover:bg-sky-300/20 dark:hover:text-sky-400 sm:w-auto"
            aria-label="Editar nombre y descripcion del proyecto"
            onPress={() => setIsEditing(true)}
          >
            <Edit2 className="h-3 w-3" />
            Editar
          </Button>
        ) : isEditing ? (
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button
              size="sm"
              variant="flat"
              className="flex w-full items-center justify-center gap-1.5 text-sm text-green-600 dark:text-green-400 sm:w-auto"
              onPress={handleSave}
              isLoading={updateProjectMutation.isPending}
              disabled={updateProjectMutation.isPending}
            >
              <Check className="h-3 w-3" />
              Guardar
            </Button>
            <Button
              size="sm"
              variant="flat"
              className="flex w-full items-center justify-center gap-1.5 text-sm text-red-600 dark:text-red-400 sm:w-auto"
              onPress={handleCancel}
              disabled={updateProjectMutation.isPending}
            >
              <X className="h-3 w-3" />
              Cancelar
            </Button>
          </div>
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
          {isEditing ? (
            <input
              id="project-name"
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              className="w-full rounded-xl border border-default-200 bg-default-50/50 px-4 py-3 font-bold focus:outline-none focus:ring-2 focus:white focus:ring-offset-1 " 
              maxLength={255}
            />
          ) : (
            <div
              className="w-full rounded-xl border border-default-200 bg-default-50/50 px-4 py-3 font-bold"
            >
              {editedName || "Sin nombre"}
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="project-description"
            className="text-xs font-semibold uppercase tracking-wide text-default-500"
          >
            Descripcion
          </label>
          {isEditing ? (
            <textarea
              id="project-description"
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              className="w-full rounded-xl border border-default-200 bg-default-50/50 px-4 py-3 text-sm leading-relaxed text-default-600 focus:outline-none focus:ring-2 focus:white focus:ring-offset-1"
              maxLength={3000}
              rows={3}
            />
          ) : (
            <div
              className="min-h-[72px] w-full rounded-xl border border-default-200 bg-default-50/50 px-4 py-3 text-sm leading-relaxed text-default-600"
            >
              {editedDescription || "Sin descripcion registrada"}
            </div>
          )}
        </div>
      </div>
    </StudentDashboardSectionCard>
  );
};
