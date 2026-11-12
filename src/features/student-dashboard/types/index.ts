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
  studentCode: string;
  career: string;
  semester: number;
};

export type StudentKpis = {
  totalFairs: number;
  totalProjects: number;
  totalAwards: number;
};

export type StudentProjectDocument = {
  id: string;
  type: 'POSTER' | 'SUPPORTING_DOCUMENT' | 'MEMORY' | string;
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
  role: 'Líder' | 'Miembro';
  status: 'joined' | 'Pendiente' | 'Invitado';
};

export type StudentProjectInfo = {
  id: number | string;
  eventId: number | string;
  eventName: string;
  projectCode: string;
  name: string;
  title?: string;
  description: string;
  categoryName: string;
  enrollmentStatus: EnrollmentStatus;
  canEdit: boolean;
  documents: StudentProjectDocument[];
  participants: StudentProjectParticipant[];
  participantsCount?: number;
  documentsCount?: number;
  semester?: string;
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
  awardTitle?: string;
};

export type StudentEvaluation = {
  resultsPublished: boolean;
  finalScore?: number;
  maxScore?: number;
  ranking?: StudentRankingInfo;
  criteriaScores?: CriterionScore[];
  /**
   * Comentarios cualitativos consolidados de jurados.
   * REGLA DE NEGOCIO ESTRICTA: Debe presentarse como bloque anónimo y consolidado,
   * sin revelar nombres de jurados ni cantidad de evaluadores.
   */
  consolidatedFeedback?: string;
};

export type AcademicParticipation = {
  id: string;
  eventId?: string | number;
  semester: string; // ej. "2025-2", "2026-1"
  eventName: string;
  courseName: string;
  projectName: string;
  finalScore?: number;
  award?: string;
  isCurrent?: boolean;
  /** Certificados y diplomas asociados a esta edición/evento */
  certificates?: DiplomaCertificate[];
  /** Ficha técnica detallada del proyecto en este evento */
  projectDetails?: StudentProjectInfo;
  /** Evaluación oficial consolidada de este evento */
  evaluation?: StudentEvaluation;
};

export type CertificateType =
  | 'PARTICIPATION'
  | 'CO_WINNER'
  | 'WINNER'
  | 'HONOR_MENTION';

export type DiplomaCertificate = {
  id: string;
  eventId?: string | number;
  title: string;
  eventName: string;
  semester: string;
  type: CertificateType;
  /**
   * Estado asíncrono de emisión:
   * true = Diploma emitido y listo para descarga.
   * false = "En proceso de emisión oficial"
   */
  isIssued: boolean;
  downloadUrl?: string;
  issuedDate?: string;
};

export type StudentDashboardData = {
  profile: StudentProfile;
  kpis: StudentKpis;
  currentProject: StudentProjectInfo | null;
  evaluation: StudentEvaluation | null;
  trajectory: AcademicParticipation[];
  certificates: DiplomaCertificate[];
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
  projectCode: string;
  name: string;
  title?: string;
  description: string;
  categoryName: string;
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
    finalScore?: number;
    maxScore?: number;
    ranking?: StudentRankingInfo;
    criteriaScores?: CriterionScore[];
    consolidatedFeedback?: string;
  } | null;
  trajectory: AcademicParticipation[];
  certificates?: DiplomaCertificate[];
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

export type StudentMockScenario =
  | 'IN_REVIEW' // 1. Cambios solicitados / edición habilitada
  | 'PRE_PUBLICATION' // 2. En feria activa / evaluación en consolidación (oculto)
  | 'PUBLISHED_REGULAR' // 3. Resultados publicados normales
  | 'CO_WINNER_TIE' // 4. Resultados publicados con empate / Coganador
  | 'HISTORICAL_TRAJECTORY'; // 5. Trayectoria con amplio historial

