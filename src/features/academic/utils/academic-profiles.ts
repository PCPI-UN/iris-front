import type { AcademicProfile } from "../types";

/**
 * Profiles that open the teaching screen, with their URL segment and texts.
 * `byDepartment`: the Notas tab adds the numbers of each department and a
 * department filter, for a scope that spans several of them.
 * `history`: a Historial tab lists the events of the scope by semester.
 */
export const TEACHING_PROFILES = {
  PROFESSOR: {
    slug: "professor",
    label: "Profesor",
    description: "Proyectos de tus cursos",
    byDepartment: false,
    history: false,
  },
  TUTOR: {
    slug: "tutor",
    label: "Tutor",
    description: "Proyectos que tutoras",
    byDepartment: false,
    history: false,
  },
  DIRECTOR: {
    slug: "director",
    label: "Departamento",
    description: "Proyectos de tu departamento",
    byDepartment: false,
    history: true,
  },
  DEAN: {
    slug: "dean",
    label: "Decanatura",
    description: "Proyectos de la facultad",
    byDepartment: true,
    history: true,
  },
} as const;

export type TeachingProfile = keyof typeof TEACHING_PROFILES;

const TEACHING_ORDER: TeachingProfile[] = [
  "PROFESSOR",
  "TUTOR",
  "DIRECTOR",
  "DEAN",
];

export const isTeachingProfile = (
  profile: unknown,
): profile is TeachingProfile =>
  TEACHING_ORDER.includes(profile as TeachingProfile);

/** The session's profiles that have a teaching screen */
export const teachingProfilesOf = (profiles: AcademicProfile[] = []) =>
  TEACHING_ORDER.filter((profile) => profiles.includes(profile));

/** `professor` → PROFESSOR; undefined for any other segment */
export const teachingProfileFromSlug = (
  slug: string | undefined,
): TeachingProfile | undefined =>
  TEACHING_ORDER.find((profile) => TEACHING_PROFILES[profile].slug === slug);
