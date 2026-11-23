"use client";

import type { EventCriteriaStats } from "@/features/evaluations/api/get-event-criteria-stats";

import { FileCheck } from "lucide-react";

import { Card, CardBody, CardHeader } from "@/components/ui/card";

type CriteriaPerformanceCardProps = {
  stats?: EventCriteriaStats;
  isLoading?: boolean;
  isError?: boolean;
  /** Criteria belong to a category: list them only when one is chosen */
  showCriteria: boolean;
};

const formatScore = (value: number) => value.toFixed(2);

/** Weight is a fraction (0.2667 → "26.67 %") */
const formatWeight = (weight: number) =>
  `${Number((weight * 100).toFixed(2))} %`;

const toneFor = (percentage: number) =>
  percentage >= 80
    ? "bg-emerald-500"
    : percentage >= 70
      ? "bg-sky-500"
      : percentage >= 60
        ? "bg-amber-500"
        : "bg-rose-500";

/** Share of the scale reached, 0-100; null when the event has no scale */
const percentageOf = (average: number, maxScore?: number) =>
  maxScore && maxScore > 0
    ? Math.min(Math.max((average / maxScore) * 100, 0), 100)
    : null;

const EmptyState = ({ message }: { message: string }) => (
  <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-default-200 text-sm text-default-500">
    {message}
  </div>
);

/**
 * Average score of each rubric component, with the effective weights the backend
 * applies; with a category chosen, also the criteria of each component.
 */
export const CriteriaPerformanceCard = ({
  stats,
  isLoading = false,
  isError = false,
  showCriteria,
}: CriteriaPerformanceCardProps) => {
  const maxScore = stats?.maxScore;
  const components = stats?.components ?? [];

  const renderBody = () => {
    if (isLoading) {
      return <EmptyState message="Cargando el desempeño por criterios..." />;
    }

    if (isError) {
      return (
        <EmptyState message="No se pudo cargar el desempeño por criterios." />
      );
    }

    if (components.length === 0) {
      return (
        <EmptyState message="Todavía no hay criterios con evaluaciones para mostrar." />
      );
    }

    return (
      <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1 md:max-h-[500px]">
        {components.map((component) => {
          const percentage = percentageOf(component.average, maxScore);

          return (
            <div
              key={component.id ?? `sin-componente-${component.name}`}
              className="space-y-2 rounded-2xl border border-default-200/70 bg-background/80 p-3"
              data-testid="component-stats"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground md:text-base">
                    {component.name}
                  </p>
                  <p className="text-[11px] text-default-400 md:text-xs">
                    Peso {formatWeight(component.weight)} ·{" "}
                    {component.projectCount === 1
                      ? "1 proyecto evaluado"
                      : `${component.projectCount} proyectos evaluados`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-base font-bold text-primary md:text-lg">
                    {formatScore(component.average)}
                  </p>
                  {maxScore !== undefined ? (
                    <p className="text-[11px] text-default-400 md:text-xs">
                      de {maxScore}
                    </p>
                  ) : null}
                </div>
              </div>

              {percentage !== null ? (
                <div className="flex items-center gap-2">
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-default-100 md:h-3">
                    <div
                      className={`h-full rounded-full transition-all ${toneFor(percentage)}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="min-w-[40px] text-right text-[11px] font-semibold text-default-600 md:text-xs">
                    {Math.round(percentage)}%
                  </span>
                </div>
              ) : null}

              {showCriteria && component.criteria.length > 0 ? (
                <ul className="space-y-1 border-t border-default-200/70 pt-2">
                  {component.criteria.map((criterion) => (
                    <li
                      key={criterion.id}
                      className="flex items-center justify-between gap-2 text-xs md:text-sm"
                    >
                      <span className="min-w-0 truncate text-default-600">
                        {criterion.name}
                        <span className="ml-1 text-default-400">
                          ({formatWeight(criterion.weight)})
                        </span>
                      </span>
                      <span className="font-semibold text-foreground">
                        {formatScore(criterion.average)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card className="glass-card border border-default-200/70 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <FileCheck className="h-5 w-5 text-primary" />
          <div>
            <h3 className="text-lg font-semibold">Desempeño por criterios</h3>
            <p className="text-sm text-default-400">
              {showCriteria
                ? "Promedio de cada componente y de sus criterios, con el peso que tienen en la nota."
                : "Promedio de cada componente con el peso que tiene en la nota. Elige una categoría para ver sus criterios."}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardBody className="space-y-3 pt-0">{renderBody()}</CardBody>
    </Card>
  );
};
