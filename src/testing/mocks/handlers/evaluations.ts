import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';
import type { EventCriteriaStats } from '@/features/evaluations/api/get-event-criteria-stats';

import { db, persistDb } from '../db';
import {
  requireAuth,
  // requireAdmin,
  networkDelay,
} from '../utils';

type EvaluationScore = {
  criterionId: string;
  score: number;
};

type EvaluationBody = {
  memberUserId?: string;
  projectId?: string;
  comments?: string;
  scores: EvaluationScore[];
};

/**
 * The mock database stores no effective weights, so the component averages are a fixed
 * case: scale 25/55/75/90 and one project graded 90/55/75/25 with weights
 * 0.2667/0.1333/0.3/0.3 (grade 61.33).
 */
const eventCriteriaStatsFixture: EventCriteriaStats = {
  maxScore: 90,
  components: [
    {
      id: 1,
      name: "Diseño",
      weight: 0.4,
      average: 78.33,
      projectCount: 1,
      criteria: [
        { id: 1, name: "Planos", weight: 0.2667, average: 90 },
        { id: 2, name: "Cálculo", weight: 0.1333, average: 55 },
      ],
    },
    {
      id: 2,
      name: "Escrito",
      weight: 0.3,
      average: 75,
      projectCount: 1,
      criteria: [{ id: 3, name: "Informe", weight: 0.3, average: 75 }],
    },
    {
      id: 3,
      name: "Oral",
      weight: 0.3,
      average: 25,
      projectCount: 1,
      criteria: [{ id: 4, name: "Exposición", weight: 0.3, average: 25 }],
    },
  ],
};

export const evaluationsHandlers = [
  http.get(
    `${env.API_URL}/evaluations/events/:eventId/stats`,
    async ({ cookies }) => {
      await networkDelay();

      const { error } = requireAuth(cookies);

      if (error) {
        return HttpResponse.json({ message: error }, { status: 401 });
      }

      return HttpResponse.json(eventCriteriaStatsFixture);
    },
  ),
  // POST /evaluations/projects/evaluate: the juror sends a level (1-4) per criterion. The mock
  // keeps the levels (GET /projects/assigned-projects returns them) and, without the event's
  // scale, uses their average as the grade.
  http.post(`${env.API_URL}/evaluations/projects/evaluate`, async ({ request, cookies }) => {
    await networkDelay();
    const { user, error } = requireAuth(cookies);
    if (error || !user) {
      return HttpResponse.json({ message: error || 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as {
      projectId: number;
      comments?: string;
      scores: { criterionId: number; score: number }[];
    };
    // Mock projects use "project-002" or a plain id; the front sends a number
    const rawProjectId = String(body.projectId);
    const projectId = db.project.findFirst({ where: { id: { equals: rawProjectId } } })
      ? rawProjectId
      : `project-${rawProjectId.padStart(3, '0')}`;
    const memberUserId = String(user.id);
    const existing = db.evaluation.findFirst({
      where: { projectId: { equals: projectId }, memberUserId: { equals: memberUserId } },
    });
    if (existing) {
      return HttpResponse.json({ message: 'Ya evaluaste este proyecto' }, { status: 409 });
    }

    const grade =
      body.scores.reduce((sum, score) => sum + score.score, 0) / Math.max(1, body.scores.length);
    const evaluation = db.evaluation.create({
      projectId,
      memberUserId,
      grade,
      comments: body.comments ?? '',
      scores: body.scores,
    });
    await persistDb('evaluation');

    return HttpResponse.json(evaluation, { status: 201 });
  }),

  http.post(`${env.API_URL}/evaluations`, async ({ request, cookies }) => {
    await networkDelay();
    try {
      const { user, error } = requireAuth(cookies);
      if (error) {
        return HttpResponse.json({ message: error }, { status: 401 });
      }

      const body = (await request.json()) as EvaluationBody;

      if (!Array.isArray(body.scores) || body.scores.length === 0) {
        return HttpResponse.json({ message: 'Invalid payload: scores required' }, { status: 400 });
      }

      const memberUserId = body.memberUserId ?? user?.id ?? '';

      const grade = body.scores.reduce((s, d) => s + (d.score ?? 0), 0);

      const evaluation = db.evaluation.create({
        memberUserId,
        projectId: body.projectId,
        grade,
        comments: body.comments ?? '',
        scores: body.scores,
      });

      // create details
      body.scores.forEach((d) => {
        db.evaluationDetail.create({
          evaluationId: evaluation.id,
          criterion: d.criterionId,
          score: d.score,
        });
      });

      await persistDb('evaluation');
      await persistDb('evaluationDetail');

      const details = db.evaluationDetail.findMany({
        where: { evaluationId: { equals: evaluation.id } },
      });

      return HttpResponse.json({ data: { ...evaluation, details } });
    } catch (err: any) {
      return HttpResponse.json({ message: err?.message || 'Server Error' }, { status: 500 });
    }
  }),

  http.get(`${env.API_URL}/evaluations`, async ({ request, cookies }) => {
    await networkDelay();

    try {
      const { user, error } = requireAuth(cookies);
      if (error) {
        return HttpResponse.json({ message: error }, { status: 401 });
      }

      const url = new URL(request.url);
      const projectId = url.searchParams.get('projectId');

      if (!projectId) {
        return HttpResponse.json(
          { message: 'projectId query parameter is required' },
          { status: 400 }
        );
      }

      // Buscar evaluaciones por projectId
      const evaluations = db.evaluation.findMany({
        where: { projectId: { equals: projectId } },
      });

      // Mapear con detalles y calcular promedio
      const result = evaluations.map((evaluation) => {
        const details = db.evaluationDetail.findMany({
          where: { evaluationId: { equals: evaluation.id } },
        });

        const scores = details.map((d) => ({
          criterion: d.criterion,
          score: d.score,
        }));

        const average =
          scores.length > 0
            ? scores.reduce((sum, s) => sum + (s.score ?? 0), 0) / scores.length
            : 0;

        return { ...evaluation, details, scores, average };
      });

      return HttpResponse.json({ data: result });
    } catch (err: any) {
      return HttpResponse.json(
        { message: err?.message || 'Server Error' },
        { status: 500 }
      );
    }
  }),
];