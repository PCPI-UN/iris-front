import type { EventRoleCode } from "../api/get-me-events";

import { EVENT_ROLE_CODES } from "../api/get-me-events";

/** Value of `?rol=` in the event dashboard for each role the person can hold */
export const EVENT_ROLE_SLUGS: Record<EventRoleCode, string> = {
  JURY: "jurado",
  PARTICIPANT: "participante",
  TUTOR: "tutor",
  PROFESSOR: "profesor",
  DIRECTOR: "director",
};

export const EVENT_ROLE_LABELS: Record<EventRoleCode, string> = {
  JURY: "Jurado",
  PARTICIPANT: "Participante",
  TUTOR: "Tutor",
  PROFESSOR: "Profesor",
  DIRECTOR: "Director",
};

/** Chip colors by role */
export const EVENT_ROLE_STYLES: Record<EventRoleCode, string> = {
  JURY: "border-amber-500/40 bg-amber-500/15 text-amber-300",
  PARTICIPANT: "border-cyan-500/40 bg-cyan-500/15 text-cyan-300",
  TUTOR: "border-violet-500/40 bg-violet-500/15 text-violet-300",
  PROFESSOR: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
  DIRECTOR: "border-pink-500/40 bg-pink-500/15 text-pink-300",
};

export const getEventDashboardHref = (
  eventId: number | string,
  role: EventRoleCode,
) => `/app/events/${eventId}/dashboard?rol=${EVENT_ROLE_SLUGS[role]}`;

/**
 * The role a `?rol=` asks for, only if the person holds it in that event;
 * otherwise the first one they hold (the URL never opens a view they do not
 * have). Undefined when the person has no role.
 */
export const resolveEventRole = (
  requested: string | null | undefined,
  roles: EventRoleCode[],
): EventRoleCode | undefined => {
  const asked = EVENT_ROLE_CODES.find(
    (code) => EVENT_ROLE_SLUGS[code] === requested,
  );

  return asked && roles.includes(asked) ? asked : roles[0];
};
