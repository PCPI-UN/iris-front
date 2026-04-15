// Developers info for all versions
import type { DeveloperProfile } from '@/types/api';

export type ContributorCard = Pick<DeveloperProfile, 'name' | 'role' | 'version'>;

export type ContributorRoleGroup =
  | 'Frontend'
  | 'Backend'
  | 'FullStack'
  | 'UX & UI'
  | 'Software Architecture'
  | 'DevOps'
  | 'Scrum Master'
  | 'Otros';

const normalizeRole = (role: string) => role.trim().toLowerCase();

export const getContributorRoleLabels = (role: string) =>
  role
    .split(/\s+-\s+/)
    .map((roleLabel) => roleLabel.trim())
    .filter(Boolean);

export const getContributorRoleGroup = (role: string): ContributorRoleGroup => {
  const normalizedRole = normalizeRole(role);
  // Simple keyword-based mapping to role groups
  if (normalizedRole.includes('frontend')) return 'Frontend';
  if (normalizedRole.includes('backend')) return 'Backend';
  if (normalizedRole.includes('devops')) return 'DevOps';
  if (normalizedRole.includes('scrum')) return 'Scrum Master';
  if (normalizedRole.includes('architect')) return 'Software Architecture';
  if (normalizedRole.includes('ui/ux') || normalizedRole.includes('ux') || normalizedRole.includes('ui')) {
    return 'UX & UI';
  }
  if (normalizedRole.includes('full stack') || normalizedRole.includes('fullstack')) return 'FullStack';

  return 'Otros';
};

export const contributors: ContributorCard[] = [
  { name: 'Juan Povea', role: 'Backend Leader', version: 'v1.0' },
  { name: 'Jorge Sánchez', role: 'Frontend Leader', version: 'v1.0' },
  { name: 'Alejandra Valencia', role: 'Scrum Master - Backend Developer', version: 'v1.0' },
  { name: 'Carlos López', role: 'UI/UX Leader - Frontend Developer', version: 'v1.0' },
  { name: 'Yovany Zhu Ye', role: 'Full Stack Developer', version: 'v1.0' },
  { name: 'Jhonatan Romero', role: 'Frontend Developer', version: 'v1.0' },
  { name: 'Jesús Cantillo', role: 'Backend Developer', version: 'v1.0' },
  { name: 'Juan Carrasquilla', role: 'Backend Developer', version: 'v1.0' },
  { name: 'Samuel Robles', role: 'Backend Developer', version: 'v1.0' },
  { name: 'Gabriel Palencia', role: 'Backend Developer', version: 'v1.0' },
  { name: 'Daniel Romero', role: 'Software Architect', version: 'v1.0' },

  { name: 'Daniel Romero', role: 'Software Architect', version: 'v2.0' },
  { name: 'Kevin Torregrosa', role: 'Backend Leader', version: 'v2.0' },
  { name: 'Paula Núñez', role: 'Frontend Developer', version: 'v2.0' },
  { name: 'Andrés Monserrat', role: 'Frontend Developer', version: 'v2.0' },
  { name: 'Judith Pérez', role: 'Frontend Leader - Full Stack Developer', version: 'v2.0' },
  { name: 'Isabella Arrieta', role: 'Full Stack Developer', version: 'v2.0' },
  { name: 'Esteban Arnedo', role: 'Full Stack Developer', version: 'v2.0' },
  { name: 'Carlos Arango', role: 'Full Stack Developer', version: 'v2.0' },
  { name: 'Wilmer Santiago', role: 'Full Stack Developer', version: 'v2.0' },
  { name: 'Camilo De La Rosa', role: 'DevOps Engineer', version: 'v2.0' },
  { name: 'Natalia Carpintero', role: 'Scrum Master - Frontend Developer', version: 'v2.0' },
];
