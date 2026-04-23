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

export const ProjectPanel = ({
  project,
  onClose,
}: {
  project: any;
  onClose: () => void;
}) => {

  // 🔥 reemplazar con API
  const judges: Judge[] = [
    { id: 1, firstName: "Ana", lastName: "García", assignedProjects: 2 },
    { id: 2, firstName: "Luis", lastName: "Pérez", assignedProjects: 1 },
    { id: 3, firstName: "Sofía", lastName: "Ramírez", assignedProjects: 3 },
  ];

    return (
        <GlassCard className="flex flex-col h-full" style={{backgroundColor:"#dd82ff20"}}>
            {/* Header */}
            <div className="p-4">
                <h2 className="text-lg font-semibold">{project.name}</h2>
            </div>
            
            {/* List */}
            <div className="flex-1 overflow-y-auto px-4 space-y-2">
                <section>
                    <h3>Descripción</h3>
                    <p>{ project.description }</p>
                </section>
                <section>
                
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