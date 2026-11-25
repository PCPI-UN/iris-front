import { GraduationCap } from "lucide-react";

import { AcademicPanel } from "./academic-panel";

/** Tutors of a project, by name */
export const TutorBlock = ({ tutors }: { tutors: string[] }) => (
  <AcademicPanel title={tutors.length > 1 ? "Tutores" : "Tutor"}>
    {tutors.length === 0 ? (
      <p className="text-sm text-slate-400">Sin tutor registrado.</p>
    ) : (
      <ul className="flex flex-col gap-2">
        {tutors.map((tutor) => (
          <li
            key={tutor}
            className="flex items-center gap-2 text-sm text-slate-200"
          >
            <GraduationCap
              aria-hidden="true"
              className="size-4 shrink-0 text-cyan-400"
            />
            {tutor}
          </li>
        ))}
      </ul>
    )}
  </AcademicPanel>
);
