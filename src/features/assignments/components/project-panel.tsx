"use client";

import type { EventJuror } from "@/features/juries/api/get-event-juries";

import { ArrowLeftRight, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { useNotifications } from "@/components/ui/notifications";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEventJuries } from "@/features/juries/api/get-event-juries";
import { GlassCard } from "@/features/landing/components/glass-card";
import {
  useDeleteJuror,
  useReassignJuror,
} from "@/features/projects/api/assign-jurors";

import {
  applyLocalJurorSwap,
  type AssignedJuror,
  formatJurorName,
  type ProjectJurorRecord,
} from "../utils/juror-swap";
import { SwapJurorView } from "./swap-juror-view";

export const ProjectPanel = ({
  project,
  onClose,
}: {
  project: any;
  onClose: () => void;
}) => {
  const { addNotification } = useNotifications();
  const deleteJurorMutation = useDeleteJuror();
  const reassignJurorMutation = useReassignJuror();

  const [jurorToSwap, setJurorToSwap] = useState<AssignedJuror | null>(null);
  const [jurorsOverride, setJurorsOverride] = useState<{
    projectId: string;
    jurors: ProjectJurorRecord[];
  } | null>(null);

  const currentProjectId = String(project?.id ?? "");

  // Reset internal swap state whenever the user selects a different project
  useEffect(() => {
    setJurorToSwap(null);
  }, [currentProjectId]);

  const baseProjectJurors: ProjectJurorRecord[] = useMemo(
    () => project?.jurors ?? project?.jurorAssignments ?? [],
    [project?.jurorAssignments, project?.jurors],
  );

  const projectJurors: ProjectJurorRecord[] =
    jurorsOverride?.projectId === currentProjectId
      ? jurorsOverride.jurors
      : baseProjectJurors;

  const eventJuriesQuery = useEventJuries({
    eventId: project?.eventId,
  });

  const eventJurors: EventJuror[] = useMemo(
    () => eventJuriesQuery.data?.data ?? eventJuriesQuery.data?.jurors ?? [],
    [eventJuriesQuery.data?.data, eventJuriesQuery.data?.jurors],
  );

  const jurors: AssignedJuror[] = useMemo(() => {
    return projectJurors.map((juror, index) => {
      const jurorKey = String(
        juror?.id ?? juror?.memberUserId ?? juror?.memberEventId ?? juror?.email ?? index
      );

      const matchedJuror = eventJurors.find((eventJuror) => {
        return [eventJuror.id, eventJuror.email].some(
          (value) => String(value) === jurorKey
        );
      });

      const evaluated = Boolean(
        matchedJuror?.assignedProjects?.some(
          (assignedProject) =>
            Number(assignedProject.id) === Number(project?.id) && assignedProject.evaluated
        )
      );
      const memberUserId = String(
        juror?.memberUserId ?? matchedJuror?.id ?? juror?.id ?? ""
      );

      return {
        ...juror,
        key: jurorKey,
        memberUserId,
        id: juror.id ?? matchedJuror?.id,
        firstName: juror.firstName ?? matchedJuror?.firstName,
        lastName: juror.lastName ?? matchedJuror?.lastName,
        email: juror.email ?? matchedJuror?.email,
        evaluated,
      };
    });
  }, [eventJurors, project?.id, projectJurors]);

  const isMutating =
    deleteJurorMutation.isPending || reassignJurorMutation.isPending;

  const handleOpenSwap = (juror: AssignedJuror) => {
    if (juror.evaluated) {
      addNotification({
        type: "error",
        title: "No se puede intercambiar",
        message: "Este jurado ya evaluó el proyecto.",
      });
      return;
    }

    if (!juror.memberUserId) {
      addNotification({
        type: "error",
        title: "Error",
        message: "No se pudo identificar el jurado a intercambiar.",
      });
      return;
    }

    setJurorToSwap(juror);
  };

  const handleConfirmSwap = async (replacement: EventJuror) => {
    if (!jurorToSwap) return;

    if (jurorToSwap.evaluated) {
      addNotification({
        type: "error",
        title: "No se puede intercambiar",
        message: "Este jurado ya evaluó el proyecto.",
      });
      return;
    }

    const projectId = Number(project?.id);
    const fromUserId = Number(jurorToSwap.memberUserId);
    const toUserId = Number(replacement.id);

    if (!Number.isInteger(projectId) || projectId < 1) {
      addNotification({
        type: "error",
        title: "Error",
        message: "No se pudo identificar el proyecto.",
      });
      return;
    }

    if (
      !Number.isInteger(fromUserId) ||
      fromUserId < 1 ||
      !Number.isInteger(toUserId) ||
      toUserId < 1
    ) {
      addNotification({
        type: "error",
        title: "Error",
        message: "No se pudo identificar el jurado seleccionado.",
      });
      return;
    }

    try {
      await reassignJurorMutation.mutateAsync({
        projectId,
        fromUserId,
        toUserId,
      });

      setJurorsOverride({
        projectId: currentProjectId,
        jurors: applyLocalJurorSwap(
          projectJurors,
          jurorToSwap.memberUserId,
          replacement,
        ),
      });

      addNotification({
        type: "success",
        title: "Jurado intercambiado",
        message: `Se reemplazó a ${formatJurorName(jurorToSwap)} por ${formatJurorName(replacement)}.`,
      });

      setJurorToSwap(null);
    } catch (error: any) {
      addNotification({
        type: "error",
        title: "Error al intercambiar jurado",
        message:
          error?.message || "Refresca la página e intenta nuevamente.",
      });
    }
  };

  const handleRemoveJuror = async (juror: AssignedJuror) => {
    if (juror.evaluated) {
      addNotification({
        type: "error",
        title: "No se puede eliminar",
        message: "Este jurado ya evaluó el proyecto.",
      });
      return;
    }

    const projectId = String(project?.id ?? "");
    if (!projectId) {
      addNotification({
        type: "error",
        title: "Error",
        message: "No se pudo identificar el proyecto.",
      });
      return;
    }

    if (!juror.memberUserId) {
      addNotification({
        type: "error",
        title: "Error",
        message: "No se pudo identificar el jurado a eliminar.",
      });
      return;
    }

    try {
      await deleteJurorMutation.mutateAsync({
        projectId,
        memberUserId: juror.memberUserId,
      });

      addNotification({
        type: "success",
        title: "Jurado eliminado",
        message: "La asignación se actualizó correctamente.",
      });

      onClose();
    } catch (error: any) {
      addNotification({
        type: "error",
        title: "Error al eliminar jurado",
        message: "Refresca la página e intenta nuevamente.",
      });
    }
  };

  return (
    <GlassCard
      className="flex flex-col h-full"
      style={{ backgroundColor: "#dd82ff20" }}
    >
      {jurorToSwap ? (
        <SwapJurorView
          projectName={project?.name ?? "Proyecto"}
          currentJuror={jurorToSwap}
          assignedJurors={jurors}
          eventJurors={eventJurors}
          isLoadingJurors={eventJuriesQuery.isLoading}
          isSubmitting={reassignJurorMutation.isPending}
          onBack={() => setJurorToSwap(null)}
          onConfirm={handleConfirmSwap}
        />
      ) : (
        <>
          {/* Header */}
          <div className="p-4">
            <h2 className="text-lg font-semibold">{project.name}</h2>
            <p className="text-sm text-muted-foreground">
              {jurors.length} jurado{jurors.length === 1 ? "" : "s"} asignado
              {jurors.length === 1 ? "" : "s"}
            </p>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto px-4 space-y-2">
            <section>
              <h3>Descripción</h3>
              <p>{project.description}</p>
            </section>
            <section className="space-y-3 pt-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Jurados asignados
              </h3>

              {jurors.length > 0 ? (
                <div className="space-y-2">
                  {jurors.map((juror, index) => {
                    const displayName = formatJurorName(juror);

                    return (
                      <div
                        key={
                          juror.id ??
                          juror.key ??
                          `${juror.email ?? "juror"}-${index}`
                        }
                        className="rounded-lg border border-white/10 bg-white/5 p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {displayName}
                            </p>
                            {juror.email && (
                              <p className="truncate text-xs text-muted-foreground">
                                {juror.email}
                              </p>
                            )}
                          </div>

                          <div className="flex shrink-0 items-center gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex">
                                  <Button
                                    size="sm"
                                    variant="light"
                                    color="primary"
                                    isDisabled={juror.evaluated || isMutating}
                                    onPress={() => handleOpenSwap(juror)}
                                    className="min-w-0 px-2"
                                    aria-label={`Intercambiar jurado ${displayName}`}
                                  >
                                    <ArrowLeftRight size={16} />
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                {juror.evaluated
                                  ? "No se puede intercambiar: ya evaluó"
                                  : "Intercambiar jurado"}
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex">
                                  <Button
                                    size="sm"
                                    variant="light"
                                    color="danger"
                                    isDisabled={juror.evaluated || isMutating}
                                    isLoading={deleteJurorMutation.isPending}
                                    onPress={() => handleRemoveJuror(juror)}
                                    className="min-w-0 px-2"
                                    aria-label={`Eliminar jurado ${displayName}`}
                                  >
                                    <Trash2 size={16} />
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                {juror.evaluated
                                  ? "No se puede eliminar: ya evaluó"
                                  : "Eliminar jurado"}
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>

                        <div className="mt-2 flex items-center gap-2">
                          <span
                            className={`rounded-full border px-2 py-1 text-[11px] font-medium ${
                              juror.evaluated
                                ? "border-amber-400/40 bg-amber-500/15 text-amber-100"
                                : "border-white/15 text-muted-foreground"
                            }`}
                          >
                            {juror.evaluated ? "Ya evaluó" : "Asignación activa"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Este proyecto no tiene jurados asignados.
                </p>
              )}
            </section>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10 flex gap-2">
            <Button variant="light" onPress={onClose} className="w-full">
              Cerrar
            </Button>
          </div>
        </>
      )}
    </GlassCard>
  );
};