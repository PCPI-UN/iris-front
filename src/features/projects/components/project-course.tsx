"use client";

import { projectCourseLabel } from "../utils/course-label";

import { useEvent } from "@/features/events/api/get-event";
import { ProjectAcademicCourse } from "@/types/api";

type ProjectCourseProps = {
  /** Course section that GET /projects/:id returns with the project; absent when it has none */
  course: ProjectAcademicCourse | null | undefined;
  eventId: number | string;
};

/**
 * NRC of a project for the administration: its course section, "No aplica" for an event that does
 * not require one, or "Sin NRC" for a project from before NRCs existed.
 */
export function ProjectCourse({ course, eventId }: ProjectCourseProps) {
  const eventQuery = useEvent({ eventId: Number(eventId) });

  if (!course && eventQuery.isLoading) {
    return <p className="text-sm font-light text-default-500">Cargando...</p>;
  }

  const label = projectCourseLabel(
    course?.nrc
      ? {
          nrc: course.nrc,
          name: course.name ?? "",
          term: course.term ?? null,
          departmentName: course.departmentName ?? null,
        }
      : null,
    eventQuery.data?.data?.requiresCourse,
  );

  return (
    <div className="space-y-0.5">
      <p className="text-sm font-medium">{label.text}</p>
      {label.detail && (
        <p className="text-sm font-light text-default-500">{label.detail}</p>
      )}
    </div>
  );
}
