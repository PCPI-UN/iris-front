// Transforming database data into the format expected

type EventDTO = {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  inscriptionDeadline: string;
  accessCode: string;
  isPublic: boolean;
  evaluationsStatus: "open" | "closed";
  createdAt: number;
  userEventRole?: "Participant" | "JURY";
};

type PublicEventDTO = {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  inscriptionDeadline: string;
  accessCode: string;
  statusName: "OPEN" | "CLOSED";
  isPubliclyJoinable: boolean;
  evaluationsOpened: boolean;
  active: boolean;
};

type EventRecord = {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  inscriptionDeadline: string;
  accessCode: string;
  isPublic: boolean;
  evaluationsStatus: string;
  createdAt: number;
};

type EventMembershipRecord = {
  eventRole: string;
};

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
