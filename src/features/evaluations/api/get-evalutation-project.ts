import { api } from '@/lib/api-client';

export type EvaluationDetail = {
  id: string;
  evaluationId: string;
  criterion: string;
  score: number;
};

export type EvaluationScoreInput = {
    criterion: string;
    score: number;
};

export type Evaluation = {
  id: string;
  projectId: string;
  memberUserId: string;
  evaluatorId: string;
  grade: number;
  comments: string;
  scores: EvaluationScoreInput[];
  createdAt: number;
};

export type GetEvaluationsByProjectResponse = {
  data: Evaluation[];
};

export const getEvaluationsByProject = async (projectId: string) => {
  return api.get<GetEvaluationsByProjectResponse>(
    `/evaluations?projectId=${projectId}`
  );
};
