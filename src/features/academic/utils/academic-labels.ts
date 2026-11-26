import type {
  AcademicCourse,
  ProjectReviewState,
  RegistrationStudent,
  StudentStatus,
} from "../types";

import { stylesBadge } from "@/components/ui/status-badge/status-style";

/**
 * Labels of the review state in the academic views. "En revisión" instead of
 * the admin's "Pendiente": here "Pendiente" is a student state.
 */
export const PROJECT_STATE_LABELS: Record<ProjectReviewState, string> = {
  UNDER_REVIEW: "En revisión",
  APPROVED: "Aprobado",
  REQUEST_CHANGES: "Cambios solicitados",
  REJECTED: "Rechazado",
};

/** Same colors as the admin's state badge */
export const PROJECT_STATE_COLORS: Record<ProjectReviewState, string> =
  stylesBadge as Record<ProjectReviewState, string>;

const STATE_BY_NUMBER: ProjectReviewState[] = [
  "UNDER_REVIEW",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "REQUEST_CHANGES",
];

/** The gateway sends the proto enum by name; a number (older loader) is mapped too */
export const toReviewState = (value: unknown): ProjectReviewState => {
  if (typeof value === "number")
    return STATE_BY_NUMBER[value] ?? "UNDER_REVIEW";

  return typeof value === "string" && value in PROJECT_STATE_LABELS
    ? (value as ProjectReviewState)
    : "UNDER_REVIEW";
};

export const STUDENT_STATUS_LABELS: Record<StudentStatus, string> = {
  CONFIRMED: "Confirmado",
  INVITED: "Invitado",
  PENDING: "Pendiente",
};

/** "Proyecto Final I · NRC 2051" */
export const formatCourse = (course: AcademicCourse) =>
  `${course.name} · NRC ${course.nrc}`;

/** Full name; the student code when the name was not captured */
export const studentName = (student: RegistrationStudent) =>
  [student.firstName, student.lastName].filter(Boolean).join(" ") ||
  `Código ${student.studentCode}`;

/** "3 estudiantes · 1 pendiente": the ones not confirmed count as pending */
export const describeStudents = (students: RegistrationStudent[]) => {
  const total = students.length;
  const notConfirmed = students.filter(
    (student) => student.status !== "CONFIRMED",
  ).length;
  const head = `${total} ${total === 1 ? "estudiante" : "estudiantes"}`;

  if (notConfirmed === 0) return head;

  return `${head} · ${notConfirmed} ${notConfirmed === 1 ? "pendiente" : "pendientes"}`;
};
