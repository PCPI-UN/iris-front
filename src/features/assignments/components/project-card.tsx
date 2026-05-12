"use client";

import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { columnsProject } from "./columns-project-table";
import { useSearchParams } from "next/navigation";
import { useProjects } from "@/features/projects/api/get-projects";
import { GlassCard } from "@/features/landing/components/glass-card";
import { StatusBadge } from "@/components/ui/status-badge/status-badge";
import { stylesGradient } from "@/components/ui/status-badge/status-style";
import { useState } from "react";
import { AssignJudgesPanel } from "./assign-judges-panel";
import { ProjectPanel } from "./project-panel";

export const ProjectsCard = () => {

  const searchParams = useSearchParams();
  
  const page = searchParams?.get("page") ? Number(searchParams.get("page")) : 1;
  const eventId = searchParams?.get("event") ? Number(searchParams.get("event")) : 0;
  const state = "APPROVED";
  const courseId = searchParams?.get("courseId") ? Number(searchParams.get("courseId")) : 0;

  const projectsQuery = useProjects({ page, eventId, state, courseId });
  const projects = projectsQuery.data?.data;

  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [selectedProjectView, setSelectedProjectView] = useState<any | null>(null);

  return (
    <div className="flex flex-col space-y-5 justify-between my-5">
        {projects?.map((project) => (
            <GlassCard
              key={project.id}
              className="group relative overflow-hidden w-full rounded-xl cursor-pointer hover:scale-105 transition-all duration-500"
            >
                <div className={`absolute inset-0 bg-gradient-to-br ${stylesGradient[project.state]} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}/>

                {/* ---------- Nombre y descripción ---------- */}
                <div className="flex justify-between">
                    <div>
                        <h3 className="text-base sm:text-lg font-semibold">{project.name}</h3>
                        {project.description && (
                            <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2">
                                {project.description}
                            </p>
                        )}
                    </div>
                    <StatusBadge key={project.id} state={project.state}/>
                </div>

                {/* Mobile: Lista de nombres */}
                <div className="sm:hidden space-y-2">
                    {((project.pendingParticipants?.length ?? 0) > 0
                        ? project.pendingParticipants
                        : project.participants
                    ).map((participant, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                            {participant.firstName[0]}
                            {participant.lastName[0]}
                        </div>
                        <span>{participant.firstName} {participant.lastName}</span>
                    </div>
                    ))}
                </div>

                {/*Footer*/}
                <div className="mt-5 flex justify-between space-x-2">
                    <Button
                        size="sm"
                        onPress={() => setSelectedProjectView(project)}
                        className="w-full py-5 bg-white/10"
                    >
                        Ver asignaciones
                    </Button>

                    <Button
                        size="sm"
                        onPress={() => setSelectedProject(project)}
                        className="w-full py-5 bg-cyan-500/30"
                    >
                        Asignar jurados
                    </Button>
                </div>
            </GlassCard>
        ))}
        {selectedProject && (
            <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm animate-appearance-in transition-all duration-400">
                <div className="w-full sm:w-[400px] md:w-[450px] h-full">
                    <AssignJudgesPanel
                        project={selectedProject}
                        onClose={() => setSelectedProject(null)}
                    />
                </div>
                
            </div>
        )}

        {selectedProjectView && (
            <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm animate-appearance-in transition-all duration-400">
                <div className="w-full sm:w-[400px] md:w-[450px] h-full">
                    <ProjectPanel
                        project={selectedProjectView}
                        onClose={() => setSelectedProjectView(null)}
                    />
                </div>
            </div>
        )}
    </div>
  );
};