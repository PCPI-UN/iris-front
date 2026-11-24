"use client"

import { ProjectCard } from "./project-card"
import { useJuryAssignedProjects } from "@/features/projects-public/api/get-jury-project"
import { Spinner } from "@/components/ui/spinner"
import { extractEventIdFromSlug } from "@/features/events/utils/resolve-join-target"
import { maxGradeOf, useJurorEvent } from "../hooks/use-juror-event"

type ProjectListViewProps = {
  eventId: string;
  showProjectCode?: boolean;
};

export function ProjectListView({ eventId, showProjectCode = false }: ProjectListViewProps) {
  const normalizedEventId = extractEventIdFromSlug(eventId).eventId;
  const parsedEventId = Number(normalizedEventId);
  const hasValidEventId = Number.isFinite(parsedEventId) && parsedEventId > 0;

  const eventsQuery = useJuryAssignedProjects({ eventId: parsedEventId });

  // Each project already brings its code (`projectCode`) and the juror's evaluation
  const projects = eventsQuery.data ?? [];
  const { gradingScale } = useJurorEvent(hasValidEventId ? parsedEventId : undefined);
  const maxGrade = maxGradeOf(gradingScale);

  const isLoading = eventsQuery.isLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!hasValidEventId) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No se pudo identificar el evento
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
          <h2 className="text-lg font-semibold text-foreground">{showProjectCode ? 'Proyectos por Evaluar' : 'Equipos por Evaluar'}</h2>
          <div className="grid gap-6 p-4 sm:grid-cols-1 lg:grid-cols-2">
            {notEvaluatedProjects.map(project => (
              <ProjectCard key={project.id} project={project} showProjectCode={showProjectCode} maxGrade={maxGrade} />
            ))}
          </div>
        </div>
      )}

      {evaluatedProjects.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">{showProjectCode ? 'Proyectos Evaluados' : 'Equipos Evaluados'}</h2>
          <div className="grid gap-6 p-4 sm:grid-cols-1 lg:grid-cols-2">
            {evaluatedProjects.map(project => (
              <ProjectCard key={project.id} project={project} showProjectCode={showProjectCode} maxGrade={maxGrade} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
