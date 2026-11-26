'use client';

import { BarChart3 } from 'lucide-react';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import type { EventCriteriaStats } from '@/features/evaluations/api/get-event-criteria-stats';
import type { CategoryEvaluationStats } from '../types';
import { CriteriaPerformanceCard } from './criteria-performance-card';

type StatisticsTabProps = {
    criteriaStats: { data?: EventCriteriaStats; isLoading: boolean; isError: boolean };
    /** A category is chosen: the card lists the criteria of each component */
    showCriteria: boolean;
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
    criteriaStats,
    showCriteria,
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

                    
            <CriteriaPerformanceCard
                stats={criteriaStats.data}
                isLoading={criteriaStats.isLoading}
                isError={criteriaStats.isError}
                showCriteria={showCriteria}
            />

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