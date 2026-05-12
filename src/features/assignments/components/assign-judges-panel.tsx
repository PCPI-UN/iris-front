"use client";

import { Button } from "@/components/ui/button";
import { useNotifications } from "@/components/ui/notifications";
import { GlassCard } from "@/features/landing/components/glass-card";
import { useMemo, useState } from "react";

import { useEventJuries } from "@/features/juries/api/get-event-juries";
import { useAssignJurors } from "@/features/projects/api/assign-jurors";

interface Judge {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  isAssigned: boolean;
  assignedProjects: Array<{ id: number; evaluated: boolean }>;
}

export const AssignJudgesPanel = ({
  project,
  onClose,
}: {
  project: any;
  onClose: () => void;
}) => {
  const { addNotification } = useNotifications();

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<number[]>([]);
  const assignJurorsMutation = useAssignJurors();

  const eventJuriesQuery = useEventJuries({
    eventId: project?.eventId,
  });

  const assignedJurorKeys = useMemo(() => {
    const jurors = project?.jurors ?? project?.jurorAssignments ?? [];

    return new Set(
      jurors.flatMap((juror: any) => [
        juror?.id ? String(juror.id) : "",
        juror?.memberUserId ? String(juror.memberUserId) : "",
        juror?.email ? String(juror.email) : "",
      ])
    );
  }, [project]);

  const judges: Judge[] = useMemo(() => {
    const juries = eventJuriesQuery.data?.data ?? [];

    return juries.map((jury) => ({
      id: Number(jury.id),
      firstName: jury.firstName,
      lastName: jury.lastName,
      email: jury.email,
      isAssigned:
        assignedJurorKeys.has(String(jury.id)) || assignedJurorKeys.has(jury.email),
      assignedProjects: jury.assignedProjects || [],
    }));
  }, [assignedJurorKeys, eventJuriesQuery.data?.data]);

  const filtered = judges.filter((j) =>
    `${j.firstName ?? ""} ${j.lastName ?? ""} ${j.email}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const toggle = (id: number) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (selected.length === 0) {
      addNotification({
        type: "error",
        title: "Error",
        message: "Selecciona al menos un jurado",
      });
      return;
    }

    const projectId = Number(project?.id);

    if (!Number.isFinite(projectId)) {
      addNotification({
        type: "error",
        title: "Error",
        message: "No se pudo identificar el proyecto",
      });
      return;
    }

    try {
      await Promise.all(
        selected.map((userId) =>
          assignJurorsMutation.mutateAsync({
            userId,
            projectIds: [projectId],
          })
        )
      );

      addNotification({
        type: "success",
        title: "Asignación realizada",
      });

      setSelected([]);
      onClose();
    } catch (error: any) {
      addNotification({
        type: "error",
        title: "Error al asignar jurados",
        message: error?.message || "No se pudo completar la asignación",
      });
    }
  };

  return (
    <GlassCard className="flex flex-col h-full w-auto" style={{backgroundColor:"#4582ff30"}}>
      

      {/* Header */}
      <div className="p-4">
        <h2 className="text-lg font-semibold">{project.name}</h2>
        <p className="text-sm text-muted-foreground">
          {eventJuriesQuery.isLoading
            ? "Cargando jurados disponibles..."
            : `${filtered.length} jurado${filtered.length === 1 ? "" : "s"} disponible${filtered.length === 1 ? "" : "s"} para asignar`}
        </p>
      </div>

      {/* Search */}
      <div className="p-4">
        <input
          placeholder="Buscar jurado..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex w-full p-3 bg-[#ffffff20] rounded-xl text-sm"

        />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 space-y-2">
        {!eventJuriesQuery.isLoading && filtered.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No hay jurados disponibles para este proyecto.
          </p>
        )}

        {filtered.map((j) => {
          const active = selected.includes(j.id);
          const blocked = j.isAssigned;

          return (
            <div
              key={j.id}
              onClick={() => {
                if (!blocked) {
                  toggle(j.id);
                }
              }}
              className={`p-3 rounded-lg border cursor-pointer transition
                ${
                  blocked
                    ? "border-emerald-400/40 bg-emerald-500/10 cursor-not-allowed opacity-80"
                    : active
                    ? "bg-cyan-500/10 border-cyan-400"
                    : "border-white/10 hover:bg-white/5"
                }
              `}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">
                    {`${j.firstName ?? ""} ${j.lastName ?? ""}`.trim() || j.email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {j.assignedProjects?.length ?? 0} proyecto{(j.assignedProjects?.length ?? 0) === 1 ? "" : "s"}
                  </p>
                </div>

                {blocked ? (
                  <span className="rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2 py-1 text-[11px] font-medium text-emerald-200">
                    Ya asignado
                  </span>
                ) : (
                  <span
                    className={`rounded-full border px-2 py-1 text-[11px] font-medium ${
                      active
                        ? "border-cyan-400 bg-cyan-500/15 text-cyan-100"
                        : "border-muted-foreground/40 text-muted-foreground"
                    }`}
                  >
                    {active ? "Seleccionado" : "Disponible"}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/10 flex gap-2">
        <Button variant="light" onPress={onClose} className="w-full">
          Cancelar
        </Button>

        <Button
          className="w-full"
          color="primary"
          onPress={handleSubmit}
          isLoading={assignJurorsMutation.isPending}
          disabled={assignJurorsMutation.isPending}
        >
          Guardar
        </Button>
      </div>
    </GlassCard>
  );
};