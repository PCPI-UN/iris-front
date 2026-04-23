"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/components/ui/notifications";
import { GlassCard } from "@/features/landing/components/glass-card";

interface Judge {
  id: number;
  firstName: string;
  lastName: string;
  assignedProjects?: number;
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

  // 🔥 reemplazar con API
  const judges: Judge[] = [
    { id: 1, firstName: "Ana", lastName: "García", assignedProjects: 2 },
    { id: 2, firstName: "Luis", lastName: "Pérez", assignedProjects: 1 },
    { id: 3, firstName: "Sofía", lastName: "Ramírez", assignedProjects: 3 },
  ];

  const filtered = judges.filter((j) =>
    `${j.firstName} ${j.lastName}`
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

  const handleSubmit = () => {
    if (selected.length === 0) {
      addNotification({
        type: "error",
        title: "Error",
        message: "Selecciona al menos un jurado",
      });
      return;
    }

    addNotification({
      type: "success",
      title: "Asignación realizada",
    });

    onClose();
  };

  return (
    <GlassCard className="flex flex-col h-full" style={{backgroundColor:"#4582ff30"}}>
      

      {/* Header */}
      <div className="p-4">
        <h2 className="text-lg font-semibold">{project.name}</h2>
        <p className="text-sm text-muted-foreground">
          Asignar jurados
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
        {filtered.map((j) => {
          const active = selected.includes(j.id);

          return (
            <div
              key={j.id}
              onClick={() => toggle(j.id)}
              className={`p-3 rounded-lg border cursor-pointer transition
                ${
                  active
                    ? "bg-cyan-500/10 border-cyan-400"
                    : "border-white/10 hover:bg-white/5"
                }
              `}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">
                    {j.firstName} {j.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {j.assignedProjects} proyectos
                  </p>
                </div>

                <div
                  className={`h-5 w-5 rounded border flex items-center justify-center
                    ${
                      active
                        ? "bg-cyan-500 border-cyan-500"
                        : "border-muted-foreground"
                    }
                  `}
                >
                  {active && <span className="text-white text-xs">✓</span>}
                </div>
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

        <Button className="w-full" color="primary" onPress={handleSubmit}>
          Guardar
        </Button>
      </div>
    </GlassCard>
  );
};