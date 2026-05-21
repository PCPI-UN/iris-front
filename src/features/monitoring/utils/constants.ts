import type { ProjectWithJurors } from '@/features/projects/api/get-projects-with-jurors';
import type { ProjectFilterState } from '../types';

export const projectStateOptions: Array<{
  key: ProjectFilterState;
  label: string;
  tone: string;
}> = [
  { key: 'ALL', label: 'Todos', tone: 'border-default-300 text-default-600' },
  { key: 'UNDER_REVIEW', label: 'En revisión', tone: 'border-amber-400/50 text-amber-600' },
  { key: 'REQUEST_CHANGES', label: 'Cambios', tone: 'border-sky-400/50 text-sky-600' },
  { key: 'APPROVED', label: 'Aprobados', tone: 'border-emerald-400/50 text-emerald-600' },
  { key: 'REJECTED', label: 'Rechazados', tone: 'border-rose-400/50 text-rose-600' },
];

export const stateLabels: Record<ProjectWithJurors['state'], string> = {
  UNDER_REVIEW: 'En revisión',
  REQUEST_CHANGES: 'Cambios requeridos',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
};

export const stateColors: Record<ProjectWithJurors['state'], string> = {
  UNDER_REVIEW: 'bg-amber-500',
  REQUEST_CHANGES: 'bg-sky-500',
  APPROVED: 'bg-emerald-500',
  REJECTED: 'bg-rose-500',
};