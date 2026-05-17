import { ProjectDocument } from "./api";

export type ProjectStatus =
  | "APPROVED"
  | "UNDER_REVIEW"
  | "REJECTED"
  | "REQUEST_CHANGES"

export interface Participant {
  name: string;
  email: string;
  career: string;
  semester: string;
}

export interface Juror {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Project {
  id: number;
  eventId: number;
  categoryId: number;
  number: string; //
  name: string;
  category: string;
  status: ProjectStatus;
  members: number;
  description?: string;
  documents: ProjectDocument[];
  jurors: Juror[];
  createdAt: string;
  participants: Participant[];
  jurorAssignments: any;
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

interface StudentStats {
  noStudents: number;
  [careerName: string]: number; 
}

export interface DashboardStats {
  totalProjects: number;
  approved: number;
  underReview: number;
  rejected: number;
  changesRequired: number;
  projectsByCategory: CategoryCount[];
  participants: StudentStats;
  totalJuries: number;
}

// Full Report Payload

export interface EventReportData {
  eventId: number;
  eventName: string;
  reportDate: string; // ISO date string — shown on the Dashboard sheet
  projects: Project[];
  dashboard: DashboardStats;
}