import { useQueries } from "@tanstack/react-query";

import { useMeEvent } from "@/features/events/api/get-me-events";
import { useEventGradingScale } from "@/features/grading-scales/api/get-event-grading-scale";
import { GradingScale } from "@/features/grading-scales/utils/grading-scale";
import { api } from "@/lib/api-client";
import type { Project, ProjectAcademicCourse } from "@/types/api";

const fetchProjectDetailSilently = async (
  projectId: string,
): Promise<Project | null> => {
  try {
    const response = await api.get<{ data?: Project } | Project | null>(
      `/projects/${projectId}`,
      { suppressErrorNotification: true },
    );

    if (!response) return null;
    if (typeof response === "object" && "data" in response) {
      return response.data ?? null;
    }

    return response as Project;
  } catch {
    return null;
  }
};

/**
 * The event as the juror sees it (GET /me/events, every page), its grading scale,
 * and optional project academic courses (departmentName) loaded silently from GET /projects/:id.
 */
export const useJurorEvent = (
  eventId: number | string | undefined,
  projectIdsForCourse: Array<number | string> = [],
) => {
  const id = eventId === undefined || eventId === null ? "" : String(eventId);
  const eventQuery = useMeEvent(id);
  const event = eventQuery.data ?? undefined;

  const scaleQuery = useEventGradingScale({
    eventId: Number(id),
    queryConfig: {
      enabled: Number(id) > 0 && eventQuery.isSuccess && !event?.gradingScale,
    },
  });
  const gradingScale: GradingScale | null =
    event?.gradingScale ?? scaleQuery.data ?? null;

  const uniqueProjectIds = Array.from(
    new Set(
      projectIdsForCourse
        .map((pid) => String(pid ?? "").trim())
        .filter(Boolean),
    ),
  );
  const projectDetailQueries = useQueries({
    queries: uniqueProjectIds.map((projectId) => ({
      queryKey: ["projects", projectId],
      queryFn: () => fetchProjectDetailSilently(projectId),
      retry: false,
    })),
  });

  const academicCourseByProjectId: Record<
    string,
    ProjectAcademicCourse | null | undefined
  > = {};
  uniqueProjectIds.forEach((projectId, index) => {
    academicCourseByProjectId[projectId] =
      projectDetailQueries[index]?.data?.academicCourse;
  });

  return {
    event,
    gradingScale,
    academicCourseByProjectId,
    isLoading: eventQuery.isLoading,
  };
};

/** Highest grade of the scale: the points of its top level */
export const maxGradeOf = (scale: GradingScale | null): number | undefined =>
  scale && scale.levels.length > 0
    ? Math.max(...scale.levels.map((level) => level.points))
    : undefined;
