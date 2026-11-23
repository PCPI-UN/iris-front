/** Course section (NRC) of a project, as the academic read endpoints return it */
export type ProjectCourse = {
  nrc: string;
  name: string;
  /** Term code such as 202610; null when event-service does not list the term */
  term: string | null;
  departmentName: string | null;
};

export type CourseLabel =
  | { kind: "section"; text: string; detail: string | null }
  | { kind: "none"; text: "Sin NRC"; detail: null }
  | { kind: "not-applicable"; text: "No aplica"; detail: null }
  | { kind: "unknown"; text: "Sin información"; detail: null };

/**
 * What to show as the NRC of a project:
 * - its NRC and course when it has one;
 * - "No aplica" when its event does not require an NRC (a hackathon);
 * - "Sin NRC" when the event requires one but the project is from before NRCs existed;
 * - "Sin información" while the event is not known, so a hackathon is not shown as "Sin NRC".
 */
export const projectCourseLabel = (
  course: ProjectCourse | null | undefined,
  eventRequiresCourse: boolean | undefined,
): CourseLabel => {
  if (course) {
    const detail = [course.name, course.term ? `Periodo ${course.term}` : null]
      .filter(Boolean)
      .join(" · ");

    return {
      kind: "section",
      text: `NRC ${course.nrc}`,
      detail: detail || null,
    };
  }

  if (eventRequiresCourse === false) {
    return { kind: "not-applicable", text: "No aplica", detail: null };
  }

  if (eventRequiresCourse === true) {
    return { kind: "none", text: "Sin NRC", detail: null };
  }

  return { kind: "unknown", text: "Sin información", detail: null };
};
