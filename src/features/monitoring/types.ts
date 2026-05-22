import type { ProjectJuror, ProjectWithJurors } from '@/features/projects/api/get-projects-with-jurors';
import type { ProjectEvaluationStats } from '@/features/evaluations/api/get-project-evaluation-stats';
import type { Event } from '@/types/api';

export type { ProjectEvaluationStats };

export type MonitoringTab = 'statistics' | 'projects' | 'ranking';
export type ProjectFilterState = ProjectWithJurors['state'] | 'ALL';

export type JurorEvaluationState = ProjectJuror & {
  evaluated: boolean;
};

export type ProjectEvaluationProgress = {
  evaluated: number;
  total: number;
  jurors: JurorEvaluationState[];
};

export type ProjectEvaluationSummary = ProjectEvaluationStats | undefined;

export type CategoryEvaluationStats = {
  categoryId: number;
  label: string;
  totalProjects: number;
  evaluatedProjects: number;
  pendingProjects: number;
};

export type MonitoringDashboardProps = {
  initialEventId?: number;
  onBack?: () => void;
  eventData?: Event;
};

export type SortOrder = 'asc' | 'desc';