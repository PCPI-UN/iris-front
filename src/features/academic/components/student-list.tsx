import type { RegistrationStudent, StudentStatus } from "../types";

import { STUDENT_STATUS_LABELS, studentName } from "../utils/academic-labels";

import { AcademicPanel } from "./academic-panel";

const STATUS_STYLES: Record<StudentStatus, string> = {
  CONFIRMED: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
  INVITED: "border-sky-500/40 bg-sky-500/15 text-sky-300",
  PENDING: "border-white/10 bg-white/5 text-slate-300",
};

/** Second line of a student: code and career, or why they have no account yet */
const describe = (student: RegistrationStudent) => {
  // Without a name the first line already shows the code
  const named = Boolean(student.firstName || student.lastName);
  const parts = [named && student.studentCode, student.career].filter(Boolean);

  if (student.status === "INVITED") parts.push("invitación enviada");
  if (student.status === "PENDING") parts.push("sin cuenta en Iris");

  return parts.join(" · ");
};

/** Students of a project with their state: confirmed, invited or pending */
export const StudentList = ({
  students,
}: {
  students: RegistrationStudent[];
}) => (
  <AcademicPanel
    aside={
      <span className="text-xs tabular-nums text-slate-400">
        {students.length}
      </span>
    }
    title="Estudiantes"
  >
    {students.length === 0 ? (
      <p className="text-sm text-slate-400">
        El proyecto no tiene estudiantes registrados.
      </p>
    ) : (
      <ul className="divide-y divide-white/5">
        {students.map((student) => (
          <li
            key={`${student.status}-${student.studentCode}`}
            className="flex min-h-12 items-center justify-between gap-3 py-2"
          >
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm text-slate-200">
                {studentName(student)}
              </span>
              <span className="truncate text-xs text-slate-500">
                {describe(student)}
              </span>
            </span>
            <span
              className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[student.status]}`}
            >
              {STUDENT_STATUS_LABELS[student.status]}
            </span>
          </li>
        ))}
      </ul>
    )}
  </AcademicPanel>
);
