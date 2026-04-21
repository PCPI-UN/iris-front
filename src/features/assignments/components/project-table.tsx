"use client";

import { Button } from "@/components/ui/button";

export const ProjectsTable = ({
  onSelectProject,
}: {
  onSelectProject: (project: any) => void;
}) => {
  // 🔥 reemplazar con tu hook real
  const projects = [
    { id: 1, name: "Proyecto A", assigned: 1 },
    { id: 2, name: "Proyecto B", assigned: 3 },
    { id: 3, name: "Proyecto C", assigned: 0 },
  ];

  return (
    <div className="p-4">
      <table className="w-full text-sm">
        <thead className="text-left text-muted-foreground border-b border-white/10">
          <tr>
            <th className="py-2">Proyecto</th>
            <th>Jurados</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {projects.map((p) => (
            <tr
              key={p.id}
              className="border-b border-white/5 hover:bg-white/5 transition"
            >
              <td className="py-3 font-medium">{p.name}</td>

              <td>
                <span className="text-xs text-muted-foreground">
                  {p.assigned} asignados
                </span>
              </td>

              <td className="text-right">
                <Button
                  size="sm"
                  variant="light"
                  onPress={() => onSelectProject({ id: 1, name: "Proyecto A", assigned: 1 })}
                >
                  Ver
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};