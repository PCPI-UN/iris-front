import {
  type EventDTO,
  type EventMembershipRecord,
  type EventRecord,
  type PublicEventDTO,
} from "./events.dto";

const normalizeEvaluationsStatus = (
  evaluationsStatus: string,
): EventDTO["evaluationsStatus"] => {
  return evaluationsStatus === "open" ? "open" : "closed";
};

const normalizeUserEventRole = (
  eventRole: string,
): EventDTO["userEventRole"] => {
  if (eventRole === "Participant" || eventRole === "JURY") {
    return eventRole;
  }

  return undefined;
};

export const mapEventToDTO = (
  event: EventRecord,
  membership?: EventMembershipRecord,
): EventDTO => {
  const userEventRole = membership
    ? normalizeUserEventRole(membership.eventRole)
    : undefined;

  return {
    id: event.id,
    title: event.title,
    description: event.description,
    startDate: event.startDate,
    endDate: event.endDate,
    inscriptionDeadline: event.inscriptionDeadline,
    accessCode: event.accessCode,
    isPublic: event.isPublic,
    evaluationsStatus: normalizeEvaluationsStatus(event.evaluationsStatus),
    createdAt: event.createdAt,
    ...(userEventRole && { userEventRole }),
  };
};

export const mapEventToPublicDTO = (event: EventRecord): PublicEventDTO => {
  const now = new Date();
  const inscriptionDeadline = new Date(event.inscriptionDeadline);
  const isOpen = inscriptionDeadline >= now;

  return {
    id: event.id,
    name: event.title,
    description: event.description,
    startDate: event.startDate,
    endDate: event.endDate,
    inscriptionDeadline: event.inscriptionDeadline,
    accessCode: event.accessCode,
    statusName: isOpen ? "OPEN" : "CLOSED",
    isPubliclyJoinable: Boolean(event.isPublic),
    evaluationsOpened: normalizeEvaluationsStatus(event.evaluationsStatus) === "open",
    active: true,
  };
};
