"use client"

import { ProjectCard } from "./project-cart"
import { useJuryProjects } from "@/features/projects-public/api/get-jury-project"
import { Spinner } from "@/components/ui/spinner"
import { useRouter } from "next/navigation"

type ProjectListViewProps = {
  eventId: string;
};

export function ProjectListView({ eventId }: ProjectListViewProps) {
  const router = useRouter();

  const eventsQuery = useJuryProjects({
      page: 1,
      eventId: Number(eventId),
    });

  const projects = eventsQuery.data?.data || [];
  const isLoading = eventsQuery.isLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  const evaluatedProjects = projects.filter(p => p.evaluated);
  const notEvaluatedProjects = projects.filter(p => !p.evaluated);

  if (projects.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No hay proyectos asignados
      </div>
    )
  }

  return (
<div className="space-y-8">
  {notEvaluatedProjects.length > 0 && (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Proyectos por Evaluar</h2>
      <div className="grid gap-6 p-4 sm:grid-cols-1 lg:grid-cols-2">
        {notEvaluatedProjects.map(project => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  )}

  {evaluatedProjects.length > 0 && (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Proyectos Evaluados</h2>
      <div className="grid gap-6 p-4 sm:grid-cols-1 lg:grid-cols-2">
        {evaluatedProjects.map(project => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  )}
</div>
  );
}
