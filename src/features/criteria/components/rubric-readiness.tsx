"use client";

import { CheckCircle2, AlertTriangle } from "lucide-react";

import {
  RubricCategoryReadiness,
  useRubricReadiness,
} from "../api/get-rubric-readiness";
import { isFullWeight, toWeightPercent } from "../utils/component-weights";

import { Can } from "@/components/auth/can";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Spinner } from "@/components/ui/spinner";
import { PERMISSIONS } from "@/lib/authorization";
import { CriterionComponent } from "@/types/api";

type RubricReadinessProps = {
  eventId: number;
  components: Pick<CriterionComponent, "id" | "name">[];
  categories: { id: number; code: string }[];
};

/** Why a category cannot be evaluated yet; the weight of the components is shown once for the event. */
export const categoryReadinessProblems = (
  category: RubricCategoryReadiness,
  componentNames: Map<number, string>,
): string[] => {
  if (category.criteriaCount === 0) return ["No tiene criterios."];
  const problems: string[] = [];

  if (category.missingComponentIds.length > 0) {
    const names = category.missingComponentIds.map(
      (id) => componentNames.get(id) ?? `componente ${id}`,
    );

    problems.push(`Faltan criterios en: ${names.join(", ")}.`);
  }
  if (category.criteriaWithoutComponent.length > 0) {
    problems.push(
      `${category.criteriaWithoutComponent.length} criterio(s) sin componente.`,
    );
  }

  return problems;
};

const RubricReadinessContent = ({
  eventId,
  components,
  categories,
}: RubricReadinessProps) => {
  const readinessQuery = useRubricReadiness({ eventId });
  const readiness = readinessQuery.data;
  const componentNames = new Map(
    components.map((component) => [component.id, component.name]),
  );
  const categoryCodes = new Map(
    categories.map((category) => [category.id, category.code]),
  );
  const rows = [...(readiness?.categories ?? [])].sort((left, right) =>
    (categoryCodes.get(left.courseId) ?? "").localeCompare(
      categoryCodes.get(right.courseId) ?? "",
    ),
  );

  return (
    <Card className="glass-card">
      <CardHeader className="pb-0">
        <div>
          <p className="text-sm font-semibold">Rúbrica por categoría</p>
          <p className="text-xs text-default-500">
            Los jurados solo califican los proyectos de una categoría cuando su
            rúbrica está lista.
          </p>
        </div>
      </CardHeader>
      <CardBody className="space-y-2">
        {readinessQuery.isLoading ? (
          <Spinner size="sm" />
        ) : readinessQuery.isError ? (
          <p className="text-sm text-danger">
            No se pudo consultar el estado de la rúbrica.
          </p>
        ) : (
          <>
            {!!readiness && !isFullWeight(readiness.componentsWeight) && (
              <p className="text-sm text-warning">
                Ninguna categoría está lista mientras los componentes sumen{" "}
                {toWeightPercent(readiness.componentsWeight)} % y no 100 %.
              </p>
            )}
            {rows.length === 0 ? (
              <p className="text-sm text-default-500">
                El evento no tiene categorías.
              </p>
            ) : (
              <ul className="space-y-2">
                {rows.map((category) => {
                  const problems = categoryReadinessProblems(
                    category,
                    componentNames,
                  );

                  return (
                    <li
                      key={category.courseId}
                      className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-3"
                    >
                      <div className="flex items-center gap-2 sm:w-48">
                        {category.ready ? (
                          <CheckCircle2 className="size-4 shrink-0 text-success" />
                        ) : (
                          <AlertTriangle className="size-4 shrink-0 text-warning" />
                        )}
                        <span className="text-sm font-medium">
                          {categoryCodes.get(category.courseId) ??
                            `Categoría ${category.courseId}`}
                        </span>
                      </div>
                      {category.ready ? (
                        <Chip color="success" size="sm" variant="flat">
                          Lista · {category.criteriaCount} criterio(s)
                        </Chip>
                      ) : (
                        <p className="text-xs text-default-600">
                          {problems.length > 0
                            ? problems.join(" ")
                            : "Los componentes deben sumar 100 %."}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
};

// The endpoint answers 403 to sessions that cannot manage events
export const RubricReadiness = (props: RubricReadinessProps) => (
  <Can permission={PERMISSIONS.manageEvents}>
    <RubricReadinessContent {...props} />
  </Can>
);
