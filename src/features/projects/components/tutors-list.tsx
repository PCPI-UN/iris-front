import { Chip } from "@/components/ui/chip";
import { ProjectTutor } from "@/types/api";

import { tutorFullName } from "../utils/tutors";

type TutorsListProps = {
  tutors?: ProjectTutor[];
  className?: string;
};

/** Tutors of a project: linked ones first, pending ones (no account yet) marked as such */
export const TutorsList = ({ tutors, className = "" }: TutorsListProps) => {
  if (!tutors || tutors.length === 0) {
    return (
      <p className={`text-sm font-light text-default-500 ${className}`}>
        Sin tutor registrado
      </p>
    );
  }

  const ordered = [...tutors].sort(
    (a, b) => Number(Boolean(a.pending)) - Number(Boolean(b.pending)),
  );

  return (
    <ul className={`flex flex-wrap gap-2 ${className}`} aria-label="Tutores">
      {ordered.map((tutor, index) => (
        <li key={`${tutor.userId ?? tutor.email ?? index}`}>
          <Chip
            variant="flat"
            color={tutor.pending ? "warning" : "primary"}
            size="sm"
          >
            {tutorFullName(tutor)}
            {tutor.pending ? " · Pendiente" : ""}
          </Chip>
        </li>
      ))}
    </ul>
  );
};
