export type ProjectStatus =
  | "Aprovado"
  | "En revisión"
  | "Rechazado"
  | "Cambios requeridos"
  | "Pendiente";

export interface Participant {
  name: string;
  email: string;
  career: string;
}

export interface Judge {
  name: string;
  email: string;
  assignedAt: string;
  evaluated: boolean;
}

export interface Project {
  id: number;
  number: string;
  name: string;
  category: string;
  status: ProjectStatus;
  teamLeader: string;
  members: number;
  documents: number;
  judges: number;
  createdAt: string;
  participants: Participant[];
  assignedJudges: Judge[];
  missingDocuments: string[];
}

// Dashboard / Stats

export interface CategoryCount {
  category: string;
  count: number;
}

export interface MissingDocumentEntry {
  projectName: string;
  missing: string;
}

export interface DashboardStats {
  totalProjects: number;
  submittedProjects: number;
  approved: number;
  underReview: number;
  rejected: number;
  changesRequired: number;
  projectsByCategory: CategoryCount[];
  missingDocuments: MissingDocumentEntry[];
}

// Full Report Payload

export interface EventReportData {
  eventId: number;
  eventName: string;
  reportDate: string; // ISO date string — shown on the Dashboard sheet
  projects: Project[];
  dashboard: DashboardStats;
}