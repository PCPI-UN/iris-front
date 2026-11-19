'use client';

import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { getEvaluationsByProject } from '../api/get-evalutation-project';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/utils/cn';
import { CampusEvaluationCard } from '@/features/student/components/campus-evaluation-card';
import { CriteriaEvaluationCard } from '@/features/student/components/criteria-evaluation-card';
import { JuryFeedbackCard } from '@/features/student/components/jury-feedback-card';

interface EvaluationProjectProps {
    projectId: string;
    className?: string;
}

export const EvaluationProject = ({ projectId, className }: EvaluationProjectProps) => {
    const { data: evaluationsData, isLoading } = useQuery({
        queryKey: ['evaluations', projectId],
        queryFn: () => getEvaluationsByProject(projectId),
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-4">
                <Spinner />
            </div>
        );
    }

    if (!evaluationsData?.data || evaluationsData.data.length === 0) {
        return (
            <Card className={cn('p-4', className)}>
                <p className="text-center text-gray-500">No hay evaluaciones disponibles</p>
            </Card>
        );
    }

    const evaluations = evaluationsData.data;
    const totalEvaluations = evaluations.length;

    const calculateEvaluationAverage = (evaluation: any) => {
        const scores = evaluation.scores ?? [];
        const scoreValues = scores.map((s: { score: number }) => s.score);
        return scoreValues.length
            ? scoreValues.reduce((a: number, b: number) => a + b, 0) / scoreValues.length
            : 0;
    };

    const averageScore =
        evaluations.reduce((sum: number, evaluation: any) => sum + calculateEvaluationAverage(evaluation), 0) /
        totalEvaluations;

    return (
        <div className={cn('space-y-8', className)}>
            {/* Overview Card */}
            <CampusEvaluationCard
                title="Evaluación del proyecto"
                description="Puntajes detallados y retroalimentación de los jurados"
                overallScore={Number(averageScore.toFixed(1))}
                maxScore={5.0}
                evaluationsCount={totalEvaluations}
                isEvaluated={totalEvaluations > 0}
            />

            {/* Criteria Cards */}
            <div className="flex items-center gap-4 mb-4">
                <h2 className="text-xl font-semibold text-foreground whitespace-nowrap">Evaluación por criterios</h2>
                <div className="flex-1 border-b border-border" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {evaluations[0]?.scores?.map((score: { criterion: string; score: number }, index: number) => (
                    <CriteriaEvaluationCard
                        key={score.criterion || `criterion-${index}`}
                        title={score.criterion || `Criterio ${index + 1}`}
                        score={Number((evaluations.reduce((sum: number, evaluation: any) => {
                            const criterionScore = evaluation.scores.find((s: any) => s.criterion === score.criterion)?.score || 0;
                            return sum + criterionScore;
                        }, 0) / totalEvaluations).toFixed(1))}
                        maxScore={5}
                    />
                ))}
            </div>

            {/* Feedback Cards */}
            <div className="flex items-center gap-4 mb-4">
                <h2 className="text-xl font-semibold text-foreground whitespace-nowrap">Retroalimentación del jurado</h2>
                <div className="flex-1 border-b border-border" />
            </div>
            <div className="space-y-4">
                {evaluations.map((evaluation: any) => (
                    <JuryFeedbackCard
                        key={evaluation.id}
                        evaluatorName={`Jurado #${evaluation.id.slice(-4)}`}
                        date={new Date(evaluation.createdAt).toLocaleDateString("es-CO")}
                        feedback={evaluation.comments}
                    />
                ))}
            </div>
        </div>
    );
};
