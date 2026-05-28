import type { ProjectWithJurors } from '@/features/projects/api/get-projects-with-jurors';

export const parsePage = (value: string | null) => {
  const parsed = Number(value ?? '1');
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
};

export const parseOptionalId = (value: string | null) => {
  if (!value) return undefined;

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

export const isProjectState = (
  value: string | null,
): value is ProjectWithJurors['state'] =>
  value === 'UNDER_REVIEW' ||
  value === 'REQUEST_CHANGES' ||
  value === 'APPROVED' ||
  value === 'REJECTED';