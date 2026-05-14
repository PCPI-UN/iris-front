import type { ProjectJuror, ProjectWithJurors } from '@/features/projects/api/get-projects-with-jurors';
import type { CategoryEvaluationStats, ProjectEvaluationStats } from '../types';
import { getCourseLabel } from './formatting';

export const getJurorKey = (juror: ProjectJuror) => {
  if (juror.id !== undefined && juror.id !== null) {
    return `id:${juror.id}`;
  }

  if (juror.email?.trim()) {
    return `email:${juror.email.trim().toLowerCase()}`;
  }

  return `name:${juror.firstName ?? ''}:${juror.lastName ?? ''}`;
};

export const getUniqueJurors = (jurors: ProjectJuror[] = []) => {
  const seen = new Set<string>();

  return jurors.filter((juror) => {
    const key = getJurorKey(juror);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

export const buildCategoryEvaluationStats = (
  projects: ProjectWithJurors[],
  courses: { id: number; code: string; description?: string }[],
  statsByProjectId: Map<string, ProjectEvaluationStats | undefined>,
) => {
  const courseMap = new Map(courses.map((course) => [course.id, course]));
  const statsMap = new Map<number, CategoryEvaluationStats>();

  projects.forEach((project) => {
    const courseId = project.courseId;
    const course = courseMap.get(courseId);
    const current = statsMap.get(courseId) ?? {
      courseId,
      label: course ? getCourseLabel(course, courseId) : `Categoría ${courseId}`,
      totalProjects: 0,
      evaluatedProjects: 0,
      pendingProjects: 0,
    };

    const projectStats = statsByProjectId.get(String(project.id));
    const hasEvaluations = (projectStats?.evaluationCount ?? 0) > 0 || project.evaluated;

    current.totalProjects += 1;
    if (hasEvaluations) {
      current.evaluatedProjects += 1;
    } else {
      current.pendingProjects += 1;
    }

    statsMap.set(courseId, current);
  });

  return Array.from(statsMap.values()).sort((left, right) => right.totalProjects - left.totalProjects);
};