"use client";

import { useState } from "react";

import { maxGradeOf, useJurorEvent } from "../hooks/use-juror-event";

import { ProjectCard } from "./project-card";

import {
  JuryAssignedProject,
  useJuryAssignedProjects,
} from "@/features/projects-public/api/get-jury-project";
import { Pagination } from "@/components/ui/pagination";
import { Spinner } from "@/components/ui/spinner";
import { extractEventIdFromSlug } from "@/features/events/utils/resolve-join-target";

type ProjectListViewProps = {
  eventId: string;
  showProjectCode?: boolean;
};

export function ProjectListView({
  eventId,
  showProjectCode = false,
}: ProjectListViewProps) {
  const normalizedEventId = extractEventIdFromSlug(eventId).eventId;
  const parsedEventId = Number(normalizedEventId);
  const hasValidEventId = Number.isFinite(parsedEventId) && parsedEventId > 0;

  const eventsQuery = useJuryAssignedProjects({ eventId: parsedEventId });

  // Each project already brings its code (`projectCode`) and the juror's evaluation
  const projects = eventsQuery.data ?? [];
  const { gradingScale, termCode } = useJurorEvent(
    hasValidEventId ? parsedEventId : undefined,
  );
  const maxGrade = maxGradeOf(gradingScale);

  const isLoading = eventsQuery.isLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!hasValidEventId) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No se pudo identificar el evento
      </div>
    );
  }

  const evaluatedProjects = projects.filter((p) => p.evaluated);
  const notEvaluatedProjects = projects.filter((p) => !p.evaluated);

  if (projects.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No hay proyectos asignados
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <ProjectSection
        eventId={parsedEventId}
        maxGrade={maxGrade}
        projects={notEvaluatedProjects}
        showProjectCode={showProjectCode}
        termCode={termCode}
        title={
          showProjectCode ? "Proyectos por Evaluar" : "Equipos por Evaluar"
        }
      />
      <ProjectSection
        eventId={parsedEventId}
        maxGrade={maxGrade}
        projects={evaluatedProjects}
        showProjectCode={showProjectCode}
        termCode={termCode}
        title={showProjectCode ? "Proyectos Evaluados" : "Equipos Evaluados"}
      />
    </div>
  );
}

export const PROJECTS_PER_PAGE = 10;

type ProjectSectionProps = {
  title: string;
  projects: JuryAssignedProject[];
  showProjectCode: boolean;
  maxGrade?: number;
  eventId: number;
  termCode?: string;
};

/** One list of the panel (to evaluate or evaluated), paged on the client: 10 projects per page */
function ProjectSection({
  title,
  projects,
  showProjectCode,
  maxGrade,
  eventId,
  termCode,
}: ProjectSectionProps) {
  const [page, setPage] = useState(1);

  if (projects.length === 0) return null;

  const totalPages = Math.ceil(projects.length / PROJECTS_PER_PAGE);
  // The list can shrink (a project moves to "evaluated"): stay on the last existing page
  const currentPage = Math.min(page, totalPages);
  const pageProjects = projects.slice(
    (currentPage - 1) * PROJECTS_PER_PAGE,
    currentPage * PROJECTS_PER_PAGE,
  );

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <div className="grid gap-6 p-4 sm:grid-cols-1 lg:grid-cols-2">
        {pageProjects.map((project) => (
          <ProjectCard
            key={project.id}
            eventId={eventId}
            maxGrade={maxGrade}
            project={project}
            showProjectCode={showProjectCode}
            termCode={termCode}
          />
        ))}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <span className="text-sm text-default-400">
            Página {currentPage} de {totalPages}
          </span>
          <Pagination
            isCompact
            showControls
            color="primary"
            page={currentPage}
            total={totalPages}
            onChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
