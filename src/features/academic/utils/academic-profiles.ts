import type { AcademicProfile } from "../types";

/** Profiles that open the teaching screen, with their URL segment and texts */
export const TEACHING_PROFILES = {
  PROFESSOR: {
    slug: "professor",
    label: "Profesor",
    description: "Proyectos de tus cursos",
  },
  TUTOR: {
    slug: "tutor",
    label: "Tutor",
    description: "Proyectos que tutoras",
  },
} as const;

export type TeachingProfile = keyof typeof TEACHING_PROFILES;

const TEACHING_ORDER: TeachingProfile[] = ["PROFESSOR", "TUTOR"];

export const isTeachingProfile = (
  profile: unknown,
): profile is TeachingProfile =>
  TEACHING_ORDER.includes(profile as TeachingProfile);

/** The session's profiles that have a teaching screen; DIRECTOR and DEAN get theirs later */
export const teachingProfilesOf = (profiles: AcademicProfile[] = []) =>
  TEACHING_ORDER.filter((profile) => profiles.includes(profile));

/** `professor` → PROFESSOR; undefined for any other segment */
export const teachingProfileFromSlug = (
  slug: string | undefined,
): TeachingProfile | undefined =>
  TEACHING_ORDER.find((profile) => TEACHING_PROFILES[profile].slug === slug);
