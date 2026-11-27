import { normalizeCategoryId } from '@/lib/compat/category-legacy';

export const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

/**
 * Projects of one category (all when there is none). The Monitoreo search reads every
 * project of the event, so the category is applied on the client.
 */
export const filterByCategory = <T extends { categoryId?: number; courseId?: number }>(
  projects: T[],
  categoryId?: number,
): T[] =>
  categoryId === undefined
    ? projects
    : projects.filter(
        (project) => Number(normalizeCategoryId(project)) === categoryId,
      );
