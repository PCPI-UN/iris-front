export type BaseEntity = {
  id: string;
  createdAt: number;
};

export type Entity<T> = {
  [K in keyof T]: T[K];
} & BaseEntity;

export type CourseCategory = {
  category: string;
  weight: number;
  criterions: {
    id: number;
    name: string;
  }[];
};

export type Meta = {
  page: number;
  total: number;
  totalPages: number;
};

export type PlatformRole = {
  id: number;
  name: string;
  scope: string;
};

export type User = {
  id: string | number;
  createdAt?: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  active: boolean;
  status: string;
  platformRoles: PlatformRole[];
  platformPermissions: string[];
};

export type AuthResponse = {
  message: string;
};

export type Discussion = Entity<{
  title: string;
  body: string;
  teamId: string;
  author: User;
  public: boolean;
}>;

export type Comment = Entity<{
  body: string;
  discussionId: string;
  author: User;
}>;

export type EventMembership = Entity<{
  eventId: number;
  userId: number;
  eventRole: "Participant" | "Juror";
  event: Event;
}>;

export type role = Entity<{
  description?: string;
  id: number;
  name: "Juror" | "Participant";
  scope: string;
}>;

export enum EventType {
  Exposition = 1,
  Competition = 2,
}

export enum EvaluationType {
  ZERO_TO_FIVE = 1,
  ZERO_TO_HUNDRED = 2,
}

export type Event = Entity<{
  id: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  inscriptionDeadline: string;
  accessCode: string;
  isPubliclyJoinable: boolean;
  evaluationsOpened: boolean;
  statusName: string;
  location?: string;
  locationDetails?: string;
  inscriptionCost?: number;
  inscriptionRequirements?: string;
  aboutOurAllies?: string;
  evaluationType?: EvaluationType | "ZERO_TO_FIVE" | "ZERO_TO_HUNDRED";
  eventType: EventType;
  minimumTeamSize?: number;
  specificInscriptionDetails?: {
    id?: number;
    eventId?: number;
    title: string;
    description: string;
    value?: number;
    isRequired?: boolean;
  }[];
  categories?: {
    id: number;
    eventId?: number;
    name: string;
    description?: string;
    active?: boolean;
  }[];
  organizers?: string[];
  collaborators?: string[];
  awards?: {
    id?: number;
    title: string;
    description?: string;
    value?: number;
    position: number;
    categoryId?: number;
  }[];
  participants?: string[];
  status?: number;
  active: boolean;
  role?: role;
  createdAt: number;
  updatedAt: number;
}>;

export type Project = Entity<{
  id: number;
  eventId: number;
  courseId: number;
  projectCode?: string | null;
  name: string;
  description?: string;
  eventNumber?: string;
  state: "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "REQUEST_CHANGES";
  participants: ProjectParticipant[];
  documents: ProjectDocument[];
  jurorAssignments: ProjectAssignment[];
  pendingParticipants: ProjectParticipant[];
  reason: string;
  evaluated: boolean;
  createdAt: number;
  updatedAt: number;
}>;

export type ProjectDocument = Entity<{
  id: string;
  projectId: string;
  type: string;
  url: string;
  createdAt: number;
  project: Project;
}>;

export type ProjectParticipant = Entity<{
  firstName: string;
  lastName: string;
  email: string;
  projectId: string;
  ParticipantCode?: string;
  studentCode?: string;
  project: Project;
  semester: number;
  career: string;
}>;

export type ProjectAssignment = Entity<{
  projectId: string;
  memberEventId: string;
  assigneAt: Date;
  updatedAt: Date;
  project: Project;
}>;

export type Course = Entity<{
  id: number;
  eventId: number;
  code: string;
  description?: string;
  active: boolean;
  event?: { id: number; name: string };
  createdAt: number;
}>;

export type EvaluationScoreInput = {
  criterion: string;
  score: number;
};

export type Evaluation = Entity<{
  memberUserId: string;
  evaluatorId: string;
  grade: number;
  comments: string;
  scores: EvaluationScoreInput[];
}>;

export type Jury = Entity<{
  email: string;
  eventIds: number[];
  projectIds: number[];
  invitationStatus: "pending" | "accepted" | "declined";
}>;

// Real API types for invitations
// Status values: 0 = PENDING, 1 = ACCEPTED, 2 = DECLINED, 3 = EXPIRED
export type InvitationStatus = 0 | 1 | 2 | 3;

export type InvitationRole = {
  id: number;
  name: string;
  description: string;
  scope: string;
};

export type JuryInvitation = {
  id: string;
  token: string;
  email: string;
  targetType: string;
  targetId: number;
  status: InvitationStatus;
  expiresAt: string;
  invitedByUserId: number;
  invitedUserId: number | null;
  roleIds: number[];
  createdAt: string;
  roles: InvitationRole[];
  event: Event;
  project: any | null;
};

export type InvitationsMeta = {
  total: number;
  itemsOnCurrentPage: number;
  itemsPerPage: number;
  currentPage: number;
  totalPages: number;
};

export type Administrator = Entity<{
  email: string;
  invitationStatus: "pending" | "accepted" | "declined";
}>;

export type Criterion = Entity<{
  id: number;
  eventId: number;
  name: string;
  description: string;
  weight: number;
  active: boolean;
  courseIds: number[];
  createdAt?: number;
}>;

export type CriterionCourse = Entity<{
  courseId: number;
  criterionId: number;
}>;

export type DeveloperProfile = Entity<{
  name: string;
  role: string;
  version: string;
}>;

export type DevelopersResponse = {
  data: DeveloperProfile[];
  meta?: Meta;
};
