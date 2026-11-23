import { describe, expect, test } from "vitest";

import { projectCourseLabel } from "../course-label";

const course = {
  nrc: "1001",
  name: "Proyecto Final - Grupo 1",
  term: "202610",
  departmentName: "Ingeniería de Sistemas",
};

describe("projectCourseLabel", () => {
  test("a project with a course section shows its NRC, course and term", () => {
    expect(projectCourseLabel(course, true)).toEqual({
      kind: "section",
      text: "NRC 1001",
      detail: "Proyecto Final - Grupo 1 · Periodo 202610",
    });
  });

  test("the term is left out when event-service does not list it", () => {
    expect(projectCourseLabel({ ...course, term: null }, true)).toMatchObject({
      detail: "Proyecto Final - Grupo 1",
    });
  });

  test("a project of an event that does not require NRC says it does not apply", () => {
    expect(projectCourseLabel(null, false)).toMatchObject({
      kind: "not-applicable",
      text: "No aplica",
    });
  });

  test("a project from before NRCs existed, in an event that requires them, has none", () => {
    expect(projectCourseLabel(null, true)).toMatchObject({
      kind: "none",
      text: "Sin NRC",
    });
  });

  test("without knowing the event it does not claim the project has no NRC", () => {
    expect(projectCourseLabel(undefined, undefined)).toMatchObject({
      kind: "unknown",
      text: "Sin información",
    });
  });

  test("the NRC wins over the event setting", () => {
    expect(projectCourseLabel(course, false)).toMatchObject({
      kind: "section",
    });
  });
});
