import { z } from "zod";

import { ProjectTutor } from "@/types/api";

/** Registered user found by the tutor search (GET /projects/tutor-candidates) */
export type TutorCandidate = {
  id: number;
  firstName: string;
  lastName: string;
};

/** Tutor typed in by the student: invited by email once the project is approved */
export type PendingTutorInput = {
  firstName: string;
  lastName: string;
  email: string;
};

/** Tutors chosen in a form: registered users and tutors still without an account */
export type TutorsValue = {
  linked: TutorCandidate[];
  pending: PendingTutorInput[];
};

/** Body of POST /projects (field `tutors`) and PUT /projects/:id/tutors */
export type TutorsPayload = {
  userIds: number[];
  pending: { firstName: string; lastName?: string; email: string }[];
};

export const EMPTY_TUTORS: TutorsValue = { linked: [], pending: [] };

/** The backend searches from 3 letters, not counting spaces */
export const MIN_TUTOR_SEARCH_LENGTH = 3;

export const pendingTutorSchema = z.object({
  firstName: z.string().trim().min(1, "Ingrese el nombre del tutor"),
  lastName: z.string().trim(),
  email: z
    .string()
    .trim()
    .min(1, "Ingrese el correo del tutor")
    .email("El correo del tutor no es válido"),
});

export const isSearchLongEnough = (search: string) =>
  search.replace(/\s/g, "").length >= MIN_TUTOR_SEARCH_LENGTH;

export const toTutorsPayload = (value: TutorsValue): TutorsPayload => ({
  userIds: value.linked.map((tutor) => tutor.id),
  pending: value.pending.map((tutor) => ({
    firstName: tutor.firstName.trim(),
    ...(tutor.lastName.trim() ? { lastName: tutor.lastName.trim() } : {}),
    email: tutor.email.trim().toLowerCase(),
  })),
});

export const tutorFullName = (tutor: {
  firstName: string;
  lastName?: string | null;
}) => [tutor.firstName, tutor.lastName].filter(Boolean).join(" ").trim();

/** Starting point of the admin form: what the project already has */
export const tutorsValueFromProject = (
  tutors: ProjectTutor[] | undefined,
): TutorsValue => ({
  linked: (tutors ?? [])
    .filter((tutor) => !tutor.pending && typeof tutor.userId === "number")
    .map((tutor) => ({
      id: tutor.userId as number,
      firstName: tutor.firstName,
      lastName: tutor.lastName ?? "",
    })),
  pending: (tutors ?? [])
    .filter((tutor) => tutor.pending)
    .map((tutor) => ({
      firstName: tutor.firstName,
      lastName: tutor.lastName ?? "",
      email: tutor.email ?? "",
    })),
});

export const hasTutors = (value: TutorsValue) =>
  value.linked.length + value.pending.length > 0;
