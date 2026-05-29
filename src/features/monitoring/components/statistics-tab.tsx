'use client';

import { BarChart3, FileCheck } from 'lucide-react';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import type { ProjectEvaluationStats } from '@/features/evaluations/api/get-project-evaluation-stats';
import type { CategoryEvaluationStats } from '../types';

type StatisticsTabProps = {
    criterions: Array<{ category: string; name: string }>;
    statisticsProjects: Array<{ id: number; categoryId: number; evaluated?: boolean }>;
    allProjectStatsById: Map<string, ProjectEvaluationStats | undefined>;
    projectTotals: {
        uniqueJurorsCount: number;
        total: number;
    };
    evaluationMetrics: {
        totalEvaluationsSent: number;
        completionPercentage: number;
        averageGrade: number;
    };
    categoryEvaluationStats: CategoryEvaluationStats[];
};

export const StatisticsTab = ({
    criterions,
    statisticsProjects,
    allProjectStatsById,
    projectTotals,
    evaluationMetrics,
    categoryEvaluationStats,
}: StatisticsTabProps) => {
    return (
        <div className="space-y-4">

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        <div className="rounded-2xl border border-default-200/70 bg-background/80 p-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-default-400">Total de jurados</p>
                            <p className="mt-2 text-2xl font-bold text-primary">{projectTotals.uniqueJurorsCount}</p>
                        </div>
                        <div className="rounded-2xl border border-default-200/70 bg-background/80 p-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-default-400">Total de proyectos</p>
                            <p className="mt-2 text-2xl font-bold text-primary">{projectTotals.total}</p>
                        </div>
                        <div className="rounded-2xl border border-default-200/70 bg-background/80 p-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-default-400">Evaluaciones completadas</p>
                            <p className="mt-2 text-2xl font-bold text-primary">{evaluationMetrics.totalEvaluationsSent}</p>
                        </div>
                        <div className="rounded-2xl border border-default-200/70 bg-background/80 p-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-default-400">Tasa de completitud</p>
                            <p className="mt-2 text-2xl font-bold text-primary">{evaluationMetrics.completionPercentage}%</p>
                        </div>
                    </div>

                    
            <div className="grid gap-4 lg:grid-cols-1">
                <Card className="glass-card border border-default-200/70 shadow-sm">
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                            <FileCheck className="h-5 w-5 text-primary" />
                            <div>
                                <h3 className="text-lg font-semibold">Desempeño por criterios</h3>
                                <p className="text-sm text-default-400">
                                    Cómo han calificado los jurados cada criterio del proyecto.
                                </p>
                            </div>
                        </div>
                    </CardHeader>




                    <CardBody className="space-y-3 pt-0">
                        {(() => {
                            const criterionNameByCategory = new Map(criterions.map((criterion) => [criterion.category, criterion.name]));
                            const categoryStatsMap = new Map<string, { scores: number[]; weights: number[] }>();

                            statisticsProjects.forEach((project) => {
                                const stats = allProjectStatsById.get(String(project.id));

                                stats?.categoryStats?.forEach((categoryStat) => {
                                    const existing = categoryStatsMap.get(categoryStat.category) ?? { scores: [], weights: [] };
                                    existing.scores.push(categoryStat.averageScore);
                                    existing.weights.push(categoryStat.weight);
                                    categoryStatsMap.set(categoryStat.category, existing);
                                });
                            });

                            const criterionStats = Array.from(categoryStatsMap.entries())
                                .map(([category, data]) => ({
                                    category,
                                    criterionName: criterionNameByCategory.get(category) ?? category,
                                    averageScore: data.scores.length > 0
                                        ? data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length
                                        : 0,
                                    averageWeight: data.weights.length > 0
                                        ? data.weights.reduce((sum, weight) => sum + weight, 0) / data.weights.length
                                        : 0,
                                }))
                                .sort((left, right) => right.averageScore - left.averageScore);

                            return criterionStats.length > 0 ? (
                                <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1 md:max-h-[500px]">
                                    {criterionStats.map((criterion) => {
                                        const progress = Math.min(Math.max(criterion.averageScore, 0), 100);
                                        const tone = progress >= 80
                                            ? 'bg-emerald-500'
                                            : progress >= 70
                                                ? 'bg-sky-500'
                                                : progress >= 60
                                                    ? 'bg-amber-500'
                                                    : 'bg-rose-500';

                                        return (
                                            <div key={criterion.category} className="space-y-2 rounded-2xl border border-default-200/70 bg-background/80 p-3">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-semibold text-foreground md:text-base">
                                                            {criterion.criterionName}
                                                        </p>
                                                        <p className="text-[11px] text-default-400 md:text-xs">Categoría: {criterion.category}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-base font-bold text-primary md:text-lg">
                                                            {criterion.averageScore.toFixed(2)}
                                                        </p>
                                                        <p className="text-[11px] text-default-400 md:text-xs">de 100</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-default-100 md:h-3">
                                                        <div
                                                            className={`h-full rounded-full transition-all ${tone}`}
                                                            style={{ width: `${progress}%` }}
                                                        />
                                                    </div>
                                                    <span className="min-w-[40px] text-right text-[11px] font-semibold text-default-600 md:text-xs">
                                                        {Math.round(progress)}%
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between gap-3 text-[11px] text-default-400 md:text-xs">
                                                    <span>Peso promedio: {criterion.averageWeight.toFixed(2)}</span>
                                                    <span>Promedio calculado</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-default-200 text-sm text-default-500">
                                    Todavía no hay criterios con evaluaciones para mostrar.
                                </div>
                            );
                        })()}
                    </CardBody>
                </Card>
            </div>



            <Card className="glass-card border border-default-200/70 shadow-sm">
                <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        <div>
                            <h3 className="text-lg font-semibold">Evaluación por categoría</h3>
                            <p className="text-sm text-default-400">
                                Proyectos evaluados y pendientes por categoría del evento.
                            </p>
                        </div>
                    </div>
                </CardHeader>
                <CardBody className="space-y-4 pt-0">
                    {categoryEvaluationStats.length > 0 ? (
                        <>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-default-500">
                                <span className="inline-flex items-center gap-2">
                                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                    Evaluados
                                </span>
                                <span className="inline-flex items-center gap-2">
                                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                                    Pendientes
                                </span>
                            </div>

                            <div className="space-y-3">
                                {categoryEvaluationStats.map((category) => {
                                    const evaluatedWidth = category.totalProjects > 0
                                        ? (category.evaluatedProjects / category.totalProjects) * 100
                                        : 0;
                                    const pendingWidth = category.totalProjects > 0
                                        ? (category.pendingProjects / category.totalProjects) * 100
                                        : 0;

                                    return (
                                        <div
                                            key={category.categoryId}
                                            className="space-y-2 rounded-2xl border border-default-200/70 bg-background/80 p-4"
                                        >
                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                <div>
                                                    <p className="font-semibold text-foreground">{category.label}</p>
                                                    <p className="text-xs text-default-400">{category.totalProjects} proyectos en total</p>
                                                </div>
                                                <div className="text-right text-xs">
                                                    <p className="font-semibold text-emerald-600">{category.evaluatedProjects} evaluados</p>
                                                    <p className="text-default-400">{category.pendingProjects} pendientes</p>
                                                </div>
                                            </div>

                                            <div className="h-3 overflow-hidden rounded-full bg-default-100">
                                                <div className="flex h-full w-full">
                                                    <div
                                                        className="h-full bg-emerald-500 transition-all"
                                                        style={{ width: `${evaluatedWidth}%` }}
                                                    />
                                                    <div
                                                        className="h-full bg-amber-400/80 transition-all"
                                                        style={{ width: `${pendingWidth}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-default-200 text-sm text-default-500">
                            Todavía no hay categorías con proyectos para mostrar.
                        </div>
                    )}
                </CardBody>
            </Card>
        </div>
    );
};