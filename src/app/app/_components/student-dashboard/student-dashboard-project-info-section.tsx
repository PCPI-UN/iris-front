"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Edit2, FolderOpen, Check, X } from "lucide-react";
import { useNotifications } from "@/components/ui/notifications";
import { updateProject } from "@/features/projects/api/update-project";
import { StudentDashboardSectionCard } from "./student-dashboard-section-card";

type StudentDashboardProjectInfoSectionProps = {
  projectId: string;
  projectName?: string;
  projectDescription?: string;
  canEdit: boolean;
  projectCode?: string;
};

export const StudentDashboardProjectInfoSection = ({
  projectId,
  projectName,
  projectDescription,
  canEdit,
  projectCode,
}: StudentDashboardProjectInfoSectionProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(projectName || "Sin nombre");
  const [editedDescription, setEditedDescription] = useState(
    projectDescription || "Sin descripcion registrada",
  );
  const [editedProjectCode, setEditedProjectCode] = useState(projectCode || "");
  const { addNotification } = useNotifications();
  const queryClient = useQueryClient();
  const updateProjectMutation = useMutation({
    mutationFn: updateProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["my-project"], exact: false });
      addNotification({
        type: "success",
        title: "Proyecto actualizado",
        message: "Los cambios se guardaron correctamente",
      });
      setIsEditing(false);
    },
  });

  const handleSave = async () => {
    try {
      await updateProjectMutation.mutateAsync({
        projectId,
        data: {
          name: editedName,
          description: editedDescription,
          projectCode: editedProjectCode,
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

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const adjustTextareaHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(() => {
    if (isEditing) adjustTextareaHeight();
    if (isEditing && nameInputRef.current) {
      // focus the name input when entering edit mode
      // small delay to ensure element is mounted
      setTimeout(() => nameInputRef.current?.focus(), 60);
    }
  }, [isEditing]);

  const handleCancel = () => {
    setEditedName(projectName || "Sin nombre");
    setEditedDescription(projectDescription || "Sin descripcion registrada");
    setEditedProjectCode(projectCode || "");
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
            size="md"
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
              size="md"
              variant="flat"
              className="flex w-full items-center justify-center gap-1.5 text-sm font-semibold bg-sky-200/20 text-sky-300 hover:bg-sky-300/20 dark:hover:text-sky-400 sm:w-auto"
              onPress={handleSave}
              isLoading={updateProjectMutation.isPending}
              disabled={updateProjectMutation.isPending}
            >
              <Check className="size-4" />
              Guardar
            </Button>
            <Button
              size="md"
              variant="flat"
              className="flex w-full items-center font-semibold justify-center gap-1.5 text-sm bg-red-400/20 text-red-300  dark:hover:text-red-400 sm:w-auto"
              onPress={handleCancel}
              disabled={updateProjectMutation.isPending}
            >
              <X className="size-4" />
              Cancelar
            </Button>
          </div>
        ) : null
      }
    >
      {shouldReduceMotion ? (
        // If user prefers reduced motion, render without animation
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
                ref={nameInputRef}
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="w-full rounded-xl border border-default-200 bg-default-50/50 px-4 py-3 font-bold focus:outline-none focus:ring-2 focus:white focus:ring-offset-1"
                maxLength={255}
              />
            ) : (
              <div className="w-full rounded-xl border border-default-200 bg-default-50/50 px-4 py-3 font-bold">
                {editedName || "Sin nombre"}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="project-code"
              className="text-xs font-semibold uppercase tracking-wide text-default-500"
            >
              Codigo del proyecto
            </label>

            <Input
              id="project-code"
              value={editedProjectCode}
              onValueChange={setEditedProjectCode}
              placeholder="Sin codigo asignado"
              isReadOnly={!isEditing}
              variant="bordered"
              isDisabled={!isEditing}
              classNames={{
                input: isEditing
                  ? "font-semibold text-default-900 text-[2rem]"
                  : "font-semibold text-default-900",
                inputWrapper:
                  "bg-default-50 border-default-200 data-[hover=true]:border-default-300 text-md",
              }}
            />

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
                ref={textareaRef}
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                onInput={adjustTextareaHeight}
                className="w-full rounded-xl border border-default-200 bg-default-50/50 px-4 py-3 text-md leading-relaxed text-default-600 focus:outline-none focus:ring-2 focus:white focus:ring-offset-1 resize-none"
                maxLength={3000}
                rows={1}
              />
            ) : (
              <div className="min-h-[72px] w-full rounded-xl border border-default-300 bg-default-50/50 px-4 py-3 text-md leading-relaxed text-default-600">
                {editedDescription || "Sin descripcion registrada"}
              </div>
            )}
          </div>
        </div>
      ) : (
        <AnimatePresence mode="wait" initial={false}>
          {isEditing ? (
            <motion.div
              layoutId="project-info"
              key="project-edit"
              layout
              initial={{ opacity: 0, y: -8, scale: 0.995 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.995 }}
              transition={{ duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="project-name"
                    className="text-xs font-semibold uppercase tracking-wide text-default-500"
                  >
                    Nombre del proyecto
                  </label>

                  <input
                    id="project-name"
                    ref={nameInputRef}
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="w-full rounded-xl border border-default-200 bg-default-50/50 px-4 py-3 font-bold focus:outline-none focus:ring-2 focus:white focus:ring-offset-1"
                    maxLength={255}
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="project-code"
                    className="text-xs font-semibold uppercase tracking-wide text-default-500"
                  >
                    Codigo del proyecto
                  </label>

                  <Input
                    id="project-code"
                    value={editedProjectCode}
                    onValueChange={setEditedProjectCode}
                    placeholder="Sin codigo asignado"
                    isReadOnly={!isEditing}
                    variant="bordered"
                    isDisabled={!isEditing}
                    classNames={{
                      input: isEditing
                        ? "font-semibold text-default-900 text-[1rem]"
                        : "font-semibold text-default-900",
                      inputWrapper:
                        "bg-default-50 border-default-200 data-[hover=true]:border-default-300 text-md",
                    }}
                  />

                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="project-description"
                    className="text-xs font-semibold uppercase tracking-wide text-default-500"
                  >
                    Descripcion
                  </label>

                  <textarea
                    id="project-description"
                    ref={textareaRef}
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    onInput={adjustTextareaHeight}
                    className="w-full rounded-xl border min-h-[10rem] border-default-200 bg-default-50/50 px-4 py-3 text-md leading-relaxed text-default-600 focus:outline-none focus:ring-2 focus:white focus:ring-offset-1 resize-none"
                    maxLength={3000}
                    rows={1}
                  />
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              layoutId="project-info"
              key="project-view"
              layout
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: "linear" }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="project-name"
                    className="text-xs font-semibold uppercase tracking-wide text-default-500"
                  >
                    Nombre del proyecto
                  </label>

                  <div className="w-full rounded-xl border border-default-200 bg-default-50/50 px-4 py-3 font-bold">
                    {editedName || "Sin nombre"}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="project-code"
                    className="text-xs font-semibold uppercase tracking-wide text-default-500"
                  >
                    Codigo del proyecto
                  </label>

                  <Input
                    id="project-code"
                    value={editedProjectCode}
                    onValueChange={setEditedProjectCode}
                    placeholder="Sin codigo asignado"
                    isReadOnly={!isEditing}
                    variant="flat"
                    isDisabled={!isEditing}
                    classNames={{
                      input: "font-semibold text-[1rem]",
                      inputWrapper:
                        "border border-default-400 bg-default-50 text-lg",
                    }}
                  />

                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="project-description"
                    className="text-xs font-semibold uppercase tracking-wide text-default-500"
                  >
                    Descripcion
                  </label>

                  <div className="min-h-[72px] w-full rounded-xl border border-default-200 bg-default-50/50 px-4 py-3 text-md leading-relaxed text-default-600">
                    {editedDescription || "Sin descripcion registrada"}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </StudentDashboardSectionCard>
  );
};
