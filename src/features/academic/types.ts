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

/** An active document of a project; `type` arrives by name (LOGO, POSTER, SUPPORTING_DOCUMENT) or number */
export type AcademicDocument = {
  id: number;
  projectId: number;
  type: string | number;
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
  /** Active documents of the project (withdrawn ones are left out) */
  documents?: AcademicDocument[];
  /** Jurors assigned to evaluate the project */
  assignedJurorCount?: number;
};

/** A juror assigned to the project and whether they have evaluated it */
export type AcademicProjectJuror = {
  userId: number;
  /** null when the user could not be read */
  name: string | null;
  evaluated: boolean;
};

/** A criterion of a result, with the effective weight it had (fraction, 0-1) and its score */
export type ResultCriterion = {
  criterionId: number;
  criterion: string;
  weight: number;
  /** Average of the jurors' scores in the project result; the juror's own score in an evaluation */
  score: number;
};

/** Criteria of a result grouped by rubric component; `weight` adds up its criteria's */
export type ResultComponent = {
  component: string;
  weight: number;
  criteria: ResultCriterion[];
};

/** One juror's evaluation, without saying who the juror is (the front calls them Jurado A, B...) */
export type AcademicJurorEvaluation = {
  /** The juror's grade, rounded as the ranking does */
  grade: number;
  components: ResultComponent[];
  /** null when the juror left no comment */
  comment: string | null;
};

/** Result of a project as evaluation-service consolidates it */
export type AcademicProjectResult = {
  /** Average of the jurors' grades, rounded as the ranking does */
  finalScore: number;
  /** Highest grade possible with the event's grading scale */
  maxScore: number;
  components: ResultComponent[];
  /** Each juror's comment; the same texts come in `evaluations` */
  comments: string[];
  /** Each juror's evaluation, oldest first */
  evaluations: AcademicJurorEvaluation[];
};

/** Position of the project in the ranking of its category */
export type AcademicProjectRanking = {
  /** Dense position: tied projects share it */
  position: number;
  tied: boolean;
  categoryId: number;
  categoryName: string;
  /** Titles of the published awards the project won, comma separated; null if none */
  awardTitle: string | null;
};

/**
 * Evaluation of GET /academic/projects/:id. The jurors come with every profile and
 * before the results are published, the pending ones first; the result and the
 * position follow the grade rule of /academic/grades.
 */
export type AcademicProjectEvaluation = {
  gradeStatus: GradeStatus;
  assignedJurors: number;
  completedEvaluations: number;
  pendingEvaluations: number;
  jurors: AcademicProjectJuror[];
  /** true when a result exists but stays hidden until the results are published */
  resultHidden: boolean;
  /** null while PENDING or hidden */
  result: AcademicProjectResult | null;
  /** null while PENDING or hidden, for a project that is not approved or an event without ranking */
  ranking: AcademicProjectRanking | null;
};

/** GET /academic/projects/:id: the project and its evaluation (null when it could not be read) */
export type AcademicProjectDetail = AcademicProject & {
  evaluation: AcademicProjectEvaluation | null;
  /** GET /academic/projects/:id/diploma gives its diploma to this profile (only DIRECTOR and DEAN) */
  diplomaAvailable?: boolean;
};

export type AcademicProjectsPage = {
  items: AcademicProject[];
  total: number;
  currentPage: number;
  totalPages: number;
};

/** PENDING: no evaluation yet; PRELIMINARY: evaluated, results not published; OFFICIAL: published */
export type GradeStatus = "PENDING" | "PRELIMINARY" | "OFFICIAL";

/** One row of GET /academic/grades (approved projects only) */
export type GradeRow = {
  projectId: number;
  projectCode: string | null;
  projectName: string;
  participantNames: string[];
  academicCourse: AcademicCourse | null;
  gradeStatus: GradeStatus;
  assignedJurors: number;
  completedEvaluations: number;
  pendingEvaluations: number;
  /** Average of the jurors' grades; null when there is none or it stays hidden */
  finalScore: number | null;
  /** true when a grade exists but stays hidden until the results are published */
  gradeHidden: boolean;
};

export type GradesReport = {
  eventId: number;
  eventName: string;
  resultsPublished: boolean;
  /** ALL: the session sees grades before publication; PUBLISHED_ONLY: only after it */
  gradeVisibility: "ALL" | "PUBLISHED_ONLY";
  projects: GradeRow[];
};

export type CriterionStats = {
  id: number;
  name: string;
  /** Effective weight in the grade (fraction, 0-1) */
  weight: number;
  average: number;
};

/** Average of a rubric component over the evaluated projects, on the scale of the grade */
export type ComponentStats = {
  /** Absent for the criteria without component */
  id?: number;
  /** Empty for the criteria without component */
  name: string;
  weight: number;
  average: number;
  /** Projects with at least one evaluation of this component */
  projectCount: number;
  criteria: CriterionStats[];
};

/** Evaluated projects whose final grade falls in [from, to); the last range also includes `to` */
export type ScoreBucket = {
  from: number;
  to: number;
  count: number;
};

export type StatsBlock = {
  /** Approved projects of the scope in the event */
  projectCount: number;
  /** Of them, the ones with at least one evaluation; only these enter the averages */
  evaluatedCount: number;
  components: ComponentStats[];
  /** 5 equal ranges from 0 to maxScore; null when the event has no grading scale */
  distribution: ScoreBucket[] | null;
};

/** Numbers of one department; projects without a course section go under a null department */
export type DepartmentStats = StatsBlock & {
  departmentId: number | null;
  departmentName: string | null;
};

/** GET /academic/stats?eventId&profile[&groupBy=department] */
export type AcademicStats = {
  eventId: number;
  eventName: string;
  resultsPublished: boolean;
  /** true when the numbers stay hidden until the results are published; then overall is null */
  statsHidden: boolean;
  /** Top of the event's grading scale; null without a scale or while hidden */
  maxScore: number | null;
  overall: StatsBlock | null;
  /** Only with groupBy=department: by name, the null department last; [] while hidden */
  departments?: DepartmentStats[];
};
