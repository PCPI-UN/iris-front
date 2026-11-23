import { queryOptions, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import { QueryConfig } from "@/lib/react-query";

export type CourseSectionProfessor = {
  userId: number;
  firstName: string;
  lastName: string | null;
};

/** Course section (NRC) of the academic term of an event */
export type CourseSection = {
  id: number;
  nrc: string;
  name: string;
  /** null when the account no longer exists or auth-service could not be reached */
  professor: CourseSectionProfessor | null;
};

export type CourseSections = {
  sections: CourseSection[];
  /** false when the names could not be read: the sections come without professor */
  professorsAvailable: boolean;
};

/**
 * GET /events/:eventId/course-sections (Iris#216): the NRC a student picks when submitting a project.
 * Empty for an event that does not require an NRC or that has no term.
 */
export const getCourseSections = async (
  eventId: number,
): Promise<CourseSections> => {
  const response = await api.get<Partial<CourseSections> | null>(
    `/events/${eventId}/course-sections`,
    { suppressErrorNotification: true },
  );

  return {
    sections: Array.isArray(response?.sections) ? response.sections : [],
    professorsAvailable: response?.professorsAvailable !== false,
  };
};

export const professorName = (professor: CourseSectionProfessor | null) =>
  professor
    ? [professor.firstName, professor.lastName].filter(Boolean).join(" ")
    : null;

export const getCourseSectionsQueryOptions = (eventId: number) => {
  return queryOptions({
    queryKey: ["events", eventId, "course-sections"],
    queryFn: () => getCourseSections(eventId),
  });
};

type UseCourseSectionsOptions = {
  eventId: number;
  queryConfig?: QueryConfig<typeof getCourseSectionsQueryOptions>;
};

export const useCourseSections = ({
  eventId,
  queryConfig,
}: UseCourseSectionsOptions) => {
  return useQuery({
    ...getCourseSectionsQueryOptions(eventId),
    enabled: Number.isFinite(eventId) && eventId > 0,
    ...queryConfig,
  });
};
