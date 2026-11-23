"use client";

import { useProjectCourse } from "../api/get-project-course";
import { projectCourseLabel } from "../utils/course-label";

import { useEvent } from "@/features/events/api/get-event";

type ProjectCourseProps = {
  projectId: number | string;
  eventId: number | string;
};

/**
 * NRC of a project for the administration: its course section, "No aplica" for an event that does
 * not require one, or "Sin NRC" for a project from before NRCs existed.
 */
export function ProjectCourse({ projectId, eventId }: ProjectCourseProps) {
  const courseQuery = useProjectCourse({ projectId });
  const eventQuery = useEvent({ eventId: Number(eventId) });

  if (courseQuery.isLoading || eventQuery.isLoading) {
    return <p className="text-sm font-light text-default-500">Cargando...</p>;
  }

  const label = projectCourseLabel(
    courseQuery.data,
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
