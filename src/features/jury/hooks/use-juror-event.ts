import { useQueries, useQuery } from "@tanstack/react-query";

import { useMeEvent } from "@/features/events/api/get-me-events";
import { formatTermCode } from "@/features/events/api/get-terms";
import { useEventGradingScale } from "@/features/grading-scales/api/get-event-grading-scale";
import { GradingScale } from "@/features/grading-scales/utils/grading-scale";
import { api } from "@/lib/api-client";
import type { Project, ProjectAcademicCourse, Term } from "@/types/api";

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
 * its formatted academic term code (<year><period>, e.g. 202630) when available,
 * and optional project academic courses (departmentName/term) loaded silently from GET /projects/:id.
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

  const termId =
    typeof event?.termId === "number" && event.termId > 0
      ? event.termId
      : undefined;
  const termsQuery = useQuery({
    queryKey: ["terms"],
    queryFn: async (): Promise<Term[]> => {
      const response = await api.get<
        Term[] | { data?: Term[]; terms?: Term[] }
      >("/terms", { suppressErrorNotification: true });
      const terms = Array.isArray(response)
        ? response
        : (response?.terms ?? response?.data ?? []);

      return Array.isArray(terms) ? terms : [];
    },
    enabled: termId !== undefined,
    retry: false,
  });
  const matchedTerm =
    termId !== undefined
      ? termsQuery.data?.find((candidate) => candidate.id === termId)
      : undefined;
  const termCode = matchedTerm ? formatTermCode(matchedTerm) : undefined;

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
    termCode,
    academicCourseByProjectId,
    isLoading: eventQuery.isLoading,
  };
};

/** Highest grade of the scale: the points of its top level */
export const maxGradeOf = (scale: GradingScale | null): number | undefined =>
  scale && scale.levels.length > 0
    ? Math.max(...scale.levels.map((level) => level.points))
    : undefined;
