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
import type { ProjectAcademicCourse } from "@/types/api";

type ProjectListViewProps = {
  eventId: string;
  showProjectCode?: boolean;
};

export const PROJECTS_PER_PAGE = 10;

const getVisibleSlice = (
  items: JuryAssignedProject[],
  page: number,
): { currentPage: number; totalPages: number; slice: JuryAssignedProject[] } => {
  const totalPages = Math.max(1, Math.ceil(items.length / PROJECTS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const slice = items.slice(
    (currentPage - 1) * PROJECTS_PER_PAGE,
    currentPage * PROJECTS_PER_PAGE,
  );

  return { currentPage, totalPages, slice };
};

export function ProjectListView({
  eventId,
  showProjectCode = false,
}: ProjectListViewProps) {
  const [pendingPage, setPendingPage] = useState(1);
  const [evaluatedPage, setEvaluatedPage] = useState(1);

  const normalizedEventId = extractEventIdFromSlug(eventId).eventId;
  const parsedEventId = Number(normalizedEventId);
  const hasValidEventId = Number.isFinite(parsedEventId) && parsedEventId > 0;

  const eventsQuery = useJuryAssignedProjects({ eventId: parsedEventId });

  // Each project already brings its code (`projectCode`) and the juror's evaluation
  const projects = eventsQuery.data ?? [];
  const evaluatedProjects = projects.filter((p) => p.evaluated);
  const notEvaluatedProjects = projects.filter((p) => !p.evaluated);

  const pendingView = getVisibleSlice(notEvaluatedProjects, pendingPage);
  const evaluatedView = getVisibleSlice(evaluatedProjects, evaluatedPage);

  // Only load GET /projects/:id for visible projects that have an assigned number (projectCode)
  // and do not already include academicCourse.departmentName
  const visibleProjectIdsNeedingDepartment = [
    ...pendingView.slice,
    ...evaluatedView.slice,
  ]
    .filter(
      (project) =>
        Boolean(String(project.projectCode ?? "").trim()) &&
        !project.academicCourse?.departmentName,
    )
    .map((project) => project.id);

  const { gradingScale, academicCourseByProjectId = {} } = useJurorEvent(
    hasValidEventId ? parsedEventId : undefined,
    visibleProjectIdsNeedingDepartment,
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
        academicCourseByProjectId={academicCourseByProjectId}
        currentPage={pendingView.currentPage}
        maxGrade={maxGrade}
        onPageChange={setPendingPage}
        pageProjects={pendingView.slice}
        showProjectCode={showProjectCode}
        title={
          showProjectCode ? "Proyectos por Evaluar" : "Equipos por Evaluar"
        }
        totalItems={notEvaluatedProjects.length}
        totalPages={pendingView.totalPages}
      />
      <ProjectSection
        academicCourseByProjectId={academicCourseByProjectId}
        currentPage={evaluatedView.currentPage}
        maxGrade={maxGrade}
        onPageChange={setEvaluatedPage}
        pageProjects={evaluatedView.slice}
        showProjectCode={showProjectCode}
        title={showProjectCode ? "Proyectos Evaluados" : "Equipos Evaluados"}
        totalItems={evaluatedProjects.length}
        totalPages={evaluatedView.totalPages}
      />
    </div>
  );
}

type ProjectSectionProps = {
  title: string;
  pageProjects: JuryAssignedProject[];
  totalItems: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showProjectCode: boolean;
  maxGrade?: number;
  academicCourseByProjectId: Record<
    string,
    ProjectAcademicCourse | null | undefined
  >;
};

/** One list of the panel (to evaluate or evaluated), paged on the client: 10 projects per page */
function ProjectSection({
  title,
  pageProjects,
  totalItems,
  currentPage,
  totalPages,
  onPageChange,
  showProjectCode,
  maxGrade,
  academicCourseByProjectId,
}: ProjectSectionProps) {
  if (totalItems === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <div className="grid gap-6 p-4 sm:grid-cols-1 lg:grid-cols-2">
        {pageProjects.map((project) => {
          const academicCourse =
            project.academicCourse ??
            academicCourseByProjectId[String(project.id)];

          return (
            <ProjectCard
              key={project.id}
              departmentName={academicCourse?.departmentName}
              maxGrade={maxGrade}
              project={project}
              showProjectCode={showProjectCode}
            />
          );
        })}
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
            onChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}
