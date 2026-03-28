export type EventBody = {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  inscriptionDeadline?: string;
  evaluationsStatus?: "open" | "closed";
  isPublic?: boolean;
};

export type EventDTO = {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  inscriptionDeadline: string;
  accessCode: string;
  isPublic: boolean;
  evaluationsStatus: "open" | "closed";
  createdAt: string | number;
  userEventRole?: "Participant" | "JURY";
};

export type PublicEventDTO = {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  inscriptionDeadline: string;
  accessCode: string;
  statusName: string;
  isPubliclyJoinable: boolean;
  evaluationsOpened: boolean;
  active: boolean;
};

export type EventRecord = {
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

export type EventMembershipRecord = {
  eventRole: string;
};
