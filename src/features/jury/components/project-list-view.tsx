"use client"

import { ProjectCard } from "./project-card"
import { useJuryProjects } from "@/features/projects-public/api/get-jury-project"
import { Spinner } from "@/components/ui/spinner"
import { useRouter } from "next/navigation"
import { Button } from "@heroui/button"
import { ArrowLeft } from "lucide-react"
import { useQueries } from "@tanstack/react-query"
import { getProjectQueryOptions } from "@/features/projects/api/get-project"
import { extractEventIdFromSlug } from "@/features/events/utils/resolve-join-target"

type ProjectListViewProps = {
  eventId: string;
  showProjectCode?: boolean;
};

export function ProjectListView({ eventId, showProjectCode = false }: ProjectListViewProps) {
  const router = useRouter();
  const normalizedEventId = extractEventIdFromSlug(eventId).eventId;
  const parsedEventId = Number(normalizedEventId);
  const hasValidEventId = Number.isFinite(parsedEventId) && parsedEventId > 0;

  const extractProjectCode = (project: any) => {
    return (
      project?.projectCode ??
      project?._projectCode ??
      project?.data?.projectCode ??
      project?.data?._projectCode ??
      null
    );
  };

  const eventsQuery = useJuryProjects({
    page: 1,
    eventId: hasValidEventId ? parsedEventId : undefined,
  });

  const projects = eventsQuery.data?.data || [];
  const projectDetailsQueries = useQueries({
    queries: projects.map((project) => ({
      ...getProjectQueryOptions(String(project.id)),
      enabled: !!project.id,
    })),
  });

  const projectsWithCode = projects.map((project, index) => ({
    ...project,
    projectCode: extractProjectCode(project) ?? extractProjectCode(projectDetailsQueries[index]?.data),
  }));

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
      <div>
        <Button
          variant="light"
          className="gap-2"
          onClick={() => router.push('/app')}
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
      </div>
      {notEvaluatedProjects.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">{showProjectCode ? 'Proyectos por Evaluar' : 'Equipos por Evaluar'}</h2>
          <div className="grid gap-6 p-4 sm:grid-cols-1 lg:grid-cols-2">
            {projectsWithCode.filter(p => !p.evaluated).map(project => (
              <ProjectCard key={project.id} project={project} showProjectCode={showProjectCode} />
            ))}
          </div>
        </div>
      )}

      {evaluatedProjects.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">{showProjectCode ? 'Proyectos Evaluados' : 'Equipos Evaluados'}</h2>
          <div className="grid gap-6 p-4 sm:grid-cols-1 lg:grid-cols-2">
            {projectsWithCode.filter(p => p.evaluated).map(project => (
              <ProjectCard key={project.id} project={project} showProjectCode={showProjectCode} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
