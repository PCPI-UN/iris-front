import { queryOptions, useQuery } from "@tanstack/react-query";

import { ProjectCourse } from "../utils/course-label";

import { api } from "@/lib/api-client";
import { QueryConfig } from "@/lib/react-query";

type AcademicProjectResponse = {
  academicCourse?: {
    nrc?: string;
    name?: string;
    term?: string | null;
    departmentName?: string | null;
  } | null;
};

/**
 * Course section (NRC) of a project. Only the academic read endpoints (GET /academic/projects/:id,
 * permission read:academic_projects) return it, the other project endpoints do not. A project
 * of an event that needs none, or from before NRCs existed, has no academicCourse: null here.
 */
export const getProjectCourse = async (
  projectId: number | string,
): Promise<ProjectCourse | null> => {
  const response = await api.get<AcademicProjectResponse | null>(
    `/academic/projects/${projectId}`,
    { suppressErrorNotification: true },
  );
  const course = response?.academicCourse;

  if (!course?.nrc) {
    return null;
  }

  return {
    nrc: course.nrc,
    name: course.name ?? "",
    term: course.term ?? null,
    departmentName: course.departmentName ?? null,
  };
};

export const getProjectCourseQueryOptions = (projectId: number | string) => {
  return queryOptions({
    queryKey: ["projects", "course", String(projectId)],
    queryFn: () => getProjectCourse(projectId),
  });
};

type UseProjectCourseOptions = {
  projectId: number | string;
  queryConfig?: QueryConfig<typeof getProjectCourseQueryOptions>;
};

export const useProjectCourse = ({
  projectId,
  queryConfig,
}: UseProjectCourseOptions) => {
  return useQuery({
    ...getProjectCourseQueryOptions(projectId),
    ...queryConfig,
  });
};
