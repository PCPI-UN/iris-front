/**
 * Tipos y contratos TypeScript para el Dashboard del Estudiante (IRIS)
 * Alineado con la Especificación Funcional y Técnica (Tarjeta CU-86e3vmxb2).
 */

export type EnrollmentStatus =
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REQUEST_CHANGES'
  | 'REJECTED';

export type StudentProfile = {
  id: string | number;
  firstName: string;
  lastName: string;
  email: string;
  /** null cuando el estudiante aún no tiene datos académicos registrados */
  studentCode: string | null;
  career: string | null;
  semester: number | null;
};

export type StudentKpis = {
  totalFairs: number;
  totalProjects: number;
  totalAwards: number;
};

export type StudentProjectDocument = {
  id: string;
  type: 'POSTER' | 'LOGO' | 'SUPPORTING_DOCUMENT' | 'MEMORY' | string;
  title: string;
  url: string;
  createdAt?: number;
};

export type StudentProjectParticipant = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  studentCode?: string;
  career?: string;
  semester?: number;
  /** El backend no distingue líder; solo llega en datos de prueba */
  role?: 'Líder' | 'Miembro';
  status: 'joined' | 'Pendiente' | 'Invitado';
};

export type StudentProjectInfo = {
  id: number | string;
  eventId: number | string;
  eventName: string;
  projectCode: string | null;
  name: string;
  title?: string;
  description: string | null;
  categoryName: string | null;
  enrollmentStatus: EnrollmentStatus;
  canEdit: boolean;
  documents: StudentProjectDocument[];
  participants: StudentProjectParticipant[];
  participantsCount?: number;
  documentsCount?: number;
  semester?: string;
  /** false cuando el evento del proyecto ya terminó (ficha histórica) */
  isCurrent?: boolean;
  /**
   * `evaluationsOpened` del evento (GET /events/:eventId/my-project). Con evaluaciones
   * abiertas el backend ya no acepta documentos nuevos; sin el dato no se sabe.
   */
  evaluationsOpened?: boolean;
};

export type CriterionScore = {
  id: string | number;
  criterion: string;
  component?: string;
  weight?: number;
  score: number;
  maxScore: number;
};

export type StudentRankingInfo = {
  position: number;
  isWinner: boolean;
  isCoWinner: boolean;
  categoryName: string;
  awardTitle?: string | null;
};

export type StudentEvaluation = {
  resultsPublished: boolean;
  /** false cuando los resultados están publicados pero ningún jurado evaluó el proyecto */
  evaluated?: boolean;
  /** null hasta que se publican los resultados o si el proyecto no fue evaluado */
  finalScore?: number | null;
  /** Nota máxima de la escala del evento (5, 90 o 100); la define el backend */
  maxScore?: number | null;
  ranking?: StudentRankingInfo | null;
  criteriaScores?: CriterionScore[];
  /**
   * Comentarios cualitativos consolidados de jurados.
   * REGLA DE NEGOCIO ESTRICTA: Debe presentarse como bloque anónimo y consolidado,
   * sin revelar nombres de jurados ni cantidad de evaluadores.
   */
  consolidatedFeedback?: string;
};

export type AcademicParticipation = {
  id: string | number;
  eventId?: string | number;
  semester: string; // ej. "2025-30", "2026-10"
  eventName: string;
  /** Categoría del proyecto en el evento */
  courseName: string | null;
  projectName: string;
  /** null hasta que se publican los resultados del evento */
  finalScore?: number | null;
  /** Nota máxima de la escala del evento; el dashboard general aún no la envía */
  maxScore?: number | null;
  award?: string | null;
  isCurrent?: boolean;
  /**
   * true cuando el diploma de premio del proyecto se puede descargar con
   * GET /events/:eventId/my-project/diploma: resultados publicados, al menos un
   * premio del evento y el evento tiene diseño de diploma
   */
  diplomaAvailable?: boolean;
  /** Ficha técnica detallada del proyecto en este evento */
  projectDetails?: StudentProjectInfo;
  /** Evaluación oficial consolidada de este evento */
  evaluation?: StudentEvaluation;
};

export type StudentDashboardData = {
  profile: StudentProfile;
  kpis: StudentKpis;
  currentProject: StudentProjectInfo | null;
  evaluation: StudentEvaluation | null;
  trajectory: AcademicParticipation[];
};

/**
 * Contratos HTTP según el Documento de Integración Backend [CU-86e3vmxb2]
 */

/** Endpoint 1: GET /api/v1/students/me/dashboard */
export type StudentGeneralDashboardCurrentProjectDTO = {
  id: number | string;
  eventId: number | string;
  eventName: string;
  semester?: string;
  projectCode: string | null;
  name: string;
  title?: string;
  description: string | null;
  categoryName: string | null;
  enrollmentStatus: EnrollmentStatus;
  canEdit: boolean;
  participantsCount?: number;
  documentsCount?: number;
  documents?: StudentProjectDocument[];
  participants?: StudentProjectParticipant[];
};

export type StudentGeneralDashboardResponse = {
  profile: StudentProfile;
  kpis: StudentKpis;
  currentProject: StudentGeneralDashboardCurrentProjectDTO | null;
  evaluation: {
    resultsPublished: boolean;
    finalScore?: number | null;
    maxScore?: number | null;
    ranking?: StudentRankingInfo | null;
    criteriaScores?: CriterionScore[];
    consolidatedFeedback?: string;
  } | null;
  trajectory: AcademicParticipation[];
};

/** Endpoint 2: GET /api/v1/events/:eventId/my-project */
export type StudentProjectDetailResponse = StudentProjectInfo;

/** Endpoint 3: GET /api/v1/events/:eventId/my-project/results */
export type StudentProjectResultsResponse = StudentEvaluation;

/** Endpoint 4: PATCH /api/v1/projects/:projectId */
export type UpdateStudentProjectPayload = {
  name: string;
  description: string;
};
