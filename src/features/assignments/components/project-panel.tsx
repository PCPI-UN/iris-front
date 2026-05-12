"use client";

import { Button } from "@/components/ui/button";
import { useNotifications } from "@/components/ui/notifications";
import { GlassCard } from "@/features/landing/components/glass-card";
import { useEventJuries } from "@/features/juries/api/get-event-juries";
import { useDeleteJuror } from "@/features/projects/api/assign-jurors";
import { Trash2 } from "lucide-react";
import { useMemo } from "react";

type ProjectJuror = {
  id?: string | number;
  firstName?: string;
  lastName?: string;
  email?: string;
  memberUserId?: string;
  memberEventId?: string;
};

type AssignedJuror = ProjectJuror & {
  key: string;
  memberUserId: string;
  evaluated: boolean;
};

export const ProjectPanel = ({
  project,
  onClose,
}: {
  project: any;
  onClose: () => void;
}) => {
  const { addNotification } = useNotifications();
  const deleteJurorMutation = useDeleteJuror();
  const projectJurors: ProjectJuror[] =
    project?.jurors ?? project?.jurorAssignments ?? [];

  const eventJuriesQuery = useEventJuries({
    eventId: project?.eventId,
  });

  const jurors: AssignedJuror[] = useMemo(() => {
    const eventJurors = eventJuriesQuery.data?.data ?? [];

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
  }, [eventJuriesQuery.data?.data, project?.eventId, project?.id, projectJurors]);

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
        <GlassCard className="flex flex-col h-full" style={{backgroundColor:"#dd82ff20"}}>
            {/* Header */}
            <div className="p-4">
                <h2 className="text-lg font-semibold">{project.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {jurors.length} jurado{jurors.length === 1 ? "" : "s"} asignado{jurors.length === 1 ? "" : "s"}
                </p>
            </div>
            
            {/* List */}
            <div className="flex-1 overflow-y-auto px-4 space-y-2">
                <section>
                    <h3>Descripción</h3>
                    <p>{ project.description }</p>
                </section>
                <section className="space-y-3 pt-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Jurados asignados
                  </h3>

                  {jurors.length > 0 ? (
                    <div className="space-y-2">
                      {jurors.map((juror, index) => {
                        const fullName = `${juror.firstName ?? ""} ${juror.lastName ?? ""}`.trim();

                        return (
                          <div
                            key={juror.id ?? juror.key ?? `${juror.email ?? "juror"}-${index}`}
                            className="rounded-lg border border-white/10 bg-white/5 p-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-medium">
                                  {fullName || juror.email || "Jurado sin nombre"}
                                </p>
                                {juror.email && (
                                  <p className="text-xs text-muted-foreground">
                                    {juror.email}
                                  </p>
                                )}
                              </div>

                              <Button
                                size="sm"
                                variant="light"
                                color="danger"
                                isDisabled={juror.evaluated || deleteJurorMutation.isPending}
                                isLoading={deleteJurorMutation.isPending}
                                onPress={() => handleRemoveJuror(juror)}
                                className="min-w-0 px-2"
                              >
                                <Trash2 size={16} />
                              </Button>
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
        </GlassCard>
  );
};