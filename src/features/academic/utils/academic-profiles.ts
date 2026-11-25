import type { AcademicProfile } from "../types";

/**
 * Profiles that open the teaching screen, with their URL segment and texts.
 * `byDepartment`: the Notas tab adds the numbers of each department and a
 * department filter, for a scope that spans several of them.
 */
export const TEACHING_PROFILES = {
  PROFESSOR: {
    slug: "professor",
    label: "Profesor",
    description: "Proyectos de tus cursos",
    byDepartment: false,
  },
  TUTOR: {
    slug: "tutor",
    label: "Tutor",
    description: "Proyectos que tutoras",
    byDepartment: false,
  },
  DEAN: {
    slug: "dean",
    label: "Decanatura",
    description: "Proyectos de la facultad",
    byDepartment: true,
  },
} as const;

export type TeachingProfile = keyof typeof TEACHING_PROFILES;

const TEACHING_ORDER: TeachingProfile[] = ["PROFESSOR", "TUTOR", "DEAN"];

export const isTeachingProfile = (
  profile: unknown,
): profile is TeachingProfile =>
  TEACHING_ORDER.includes(profile as TeachingProfile);

/** The session's profiles that have a teaching screen; DIRECTOR gets its own later */
export const teachingProfilesOf = (profiles: AcademicProfile[] = []) =>
  TEACHING_ORDER.filter((profile) => profiles.includes(profile));

/** `professor` → PROFESSOR; undefined for any other segment */
export const teachingProfileFromSlug = (
  slug: string | undefined,
): TeachingProfile | undefined =>
  TEACHING_ORDER.find((profile) => TEACHING_PROFILES[profile].slug === slug);
