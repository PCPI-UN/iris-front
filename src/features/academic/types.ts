/**
 * Shapes of the gateway's /academic endpoints (read only). Every call names the
 * academic profile it reads as (`profile`); the back limits the projects to that
 * profile's scope (tutored projects, course sections, department...).
 */

/** Academic profiles of the session, from its platform roles (GET /academic/profiles) */
export const ACADEMIC_PROFILES = [
  "PROFESSOR",
  "TUTOR",
  "DIRECTOR",
  "DEAN",
] as const;

export type AcademicProfile = (typeof ACADEMIC_PROFILES)[number];

/** Review state of a project */
export type ProjectReviewState =
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "REQUEST_CHANGES";

export const PROJECT_REVIEW_STATES: ProjectReviewState[] = [
  "UNDER_REVIEW",
  "APPROVED",
  "REQUEST_CHANGES",
  "REJECTED",
];

/** Course section (NRC) of a project */
export type AcademicCourse = {
  id: number;
  nrc: string;
  termId: number;
  /** Term code such as 202610; null when the term is unknown */
  term: string | null;
  name: string;
  departmentName: string;
};

/** GET /academic/events: events where the session's projects take part, newest first */
export type AcademicEvent = {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  inscriptionDeadline: string;
  active: boolean;
  evaluationsOpened: boolean;
  resultsPublished: boolean;
  requiresCourse: boolean;
};

/** CONFIRMED: joined the project; INVITED: invitation sent; PENDING: only captured at submission */
export type StudentStatus = "CONFIRMED" | "INVITED" | "PENDING";

export type RegistrationStudent = {
  status: StudentStatus;
  userId: number | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  studentCode: string;
  semester: string | null;
  career: string | null;
};

export type RegistrationProject = {
  projectId: number;
  projectCode: string | null;
  projectName: string;
  state: ProjectReviewState;
  /** Reason of the last rejection or change request */
  reason: string | null;
  academicCourse: AcademicCourse | null;
  tutors: string[];
  students: RegistrationStudent[];
};

export type RegistrationTotals = {
  projects: number;
  byState: Record<ProjectReviewState, number>;
  confirmedStudents: number;
  pendingStudents: number;
};

/** GET /academic/registrations?eventId */
export type RegistrationsReport = {
  eventId: number;
  eventName: string;
  totals: RegistrationTotals;
  projects: RegistrationProject[];
};

export type AcademicTutor = {
  userId?: number;
  firstName: string;
  lastName?: string;
  pending: boolean;
  email?: string;
};

/** A project as GET /academic/projects and /academic/projects/:id return it */
export type AcademicProject = {
  id: number;
  eventId: number;
  name: string;
  projectCode?: string | null;
  description?: string | null;
  state: ProjectReviewState;
  reason?: string | null;
  tutors?: AcademicTutor[];
  academicCourse?: AcademicCourse | null;
  /** Jurors assigned to evaluate the project */
  assignedJurorCount?: number;
};

export type AcademicProjectsPage = {
  items: AcademicProject[];
  total: number;
  currentPage: number;
  totalPages: number;
};

/** PENDING: no evaluation yet; PRELIMINARY: evaluated, results not published; OFFICIAL: published */
export type GradeStatus = "PENDING" | "PRELIMINARY" | "OFFICIAL";

/** One row of GET /academic/grades (approved projects only); the grade is left to the Notas tab */
export type GradeRow = {
  projectId: number;
  gradeStatus: GradeStatus;
  assignedJurors: number;
  completedEvaluations: number;
  pendingEvaluations: number;
};

export type GradesReport = {
  eventId: number;
  resultsPublished: boolean;
  projects: GradeRow[];
};
