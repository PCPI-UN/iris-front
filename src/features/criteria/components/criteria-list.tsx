"use client";

import { AlertTriangle, CheckCircle2, ChevronDown, Info, Save } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useNotifications } from "@/components/ui/notifications";
import { Spinner } from "@/components/ui/spinner";
import { Select, SelectItem } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEventsDropdown } from "@/features/events/api/get-events-dropdown";
import { useCategories } from "@/features/courses/api/get-categories";

import { Criterion, CriterionComponent } from "@/types/api";

import { useComponents } from "../api/get-components";
import { useDeleteComponent } from "../api/delete-component";
import { useCriteria } from "../api/get-criteria";
import { useUpdateCriteria } from "../api/update-criteria";
import { CreateComponent } from "./create-component";
import { CreateCriteriaContextual } from "./create-criteria-contextual";
import { DeleteCriteria } from "./delete-criteria";

type CriteriaMode = "neutral" | "flat" | "mixed" | "components";

const getSingleSelectionKey = (selection: unknown): string => {
  if (typeof selection === "string" || typeof selection === "number") {
    return String(selection);
  }

  if (selection instanceof Set) {
    const first = Array.from(selection)[0];
    return first !== undefined && first !== null ? String(first) : "";
  }

  if (selection && typeof selection === "object") {
    const currentKey = (selection as any).currentKey;
    if (currentKey !== undefined && currentKey !== null) {
      return String(currentKey);
    }
  }

  return "";
};

const toPositiveInt = (value: string): number | undefined => {
  if (!/^\d+$/.test(value)) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

export const CriteriaList = () => {
  const { addNotification } = useNotifications();

  const [selectedEventKey, setSelectedEventKey] = useState<string>("");

  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string>("");
  const [assignmentByCriterion, setAssignmentByCriterion] = useState<
    Record<number, string>
  >({});
  const [openByComponent, setOpenByComponent] = useState<Record<number, boolean>>(
    {}
  );
  const [eventComponentIds, setEventComponentIds] = useState<
    Record<string, number[]>
  >({});
  const [createdComponentsByEvent, setCreatedComponentsByEvent] = useState<
    Record<string, CriterionComponent[]>
  >({});

  const selectedCategoryId = useMemo(() => {
    return toPositiveInt(selectedCategoryKey);
  }, [selectedCategoryKey]);

  const selectedEventId = useMemo(() => {
    return toPositiveInt(selectedEventKey);
  }, [selectedEventKey]);

  const criteriaQuery = useCriteria({
    page: 1,
    limit: 100,

    
    eventId: selectedEventKey ? Number(selectedEventKey) : undefined,
    categoryId: selectedCategoryKey ? Number(selectedCategoryKey) : undefined,

  });
  const eventsQuery = useEventsDropdown();
  const categoriesQuery = useCategories({
    page: 1,
    eventId: selectedEventId,
    queryConfig: { enabled: !!selectedEventKey },
  });
  const componentsQuery = useComponents({
    queryConfig: { enabled: !!selectedEventKey },
  });

  const updateCriteriaMutation = useUpdateCriteria();
  const deleteComponentMutation = useDeleteComponent();

  const events = eventsQuery.data?.data ?? [];

  const allComponents = componentsQuery.data?.components ?? [];
  const categories = categoriesQuery.data?.data ?? [];

  const isLoading =
    criteriaQuery.isLoading || eventsQuery.isLoading || componentsQuery.isLoading;

  const criteria = criteriaQuery.data?.criterions ?? [];

  const hasAssigned = useMemo(
    () => criteria.some((criterion) => !!criterion.component?.id),
    [criteria]
  );
  const hasLoose = useMemo(
    () => criteria.some((criterion) => !criterion.component?.id),
    [criteria]
  );

  const hasComponentsAvailable = useMemo(() => {
    if (!selectedEventKey) return false;

    return (
      allComponents.length > 0 ||
      (eventComponentIds[selectedEventKey]?.length ?? 0) > 0 ||
      criteria.some((criterion) => !!criterion.component?.id)
    );
  }, [allComponents.length, criteria, eventComponentIds, selectedEventKey]);

  const mode: CriteriaMode = useMemo(() => {
    if (criteria.length === 0) {
      return hasComponentsAvailable ? "components" : "neutral";
    }

    if (hasAssigned && hasLoose) return "mixed";
    if (hasAssigned) return "components";
    return "flat";
  }, [criteria.length, hasAssigned, hasLoose, hasComponentsAvailable]);

  const looseCount = useMemo(
    () => criteria.filter((criterion) => !criterion.component?.id).length,
    [criteria]
  );

  const validationState = useMemo(() => {
    if (!selectedEventKey) {
      return {
        tone: "neutral" as const,
        message: "Selecciona un evento para configurar criterios de evaluación.",
      };
    }

    if (mode === "neutral") {
      return {
        tone: "neutral" as const,
        message:
          "No hay criterios configurados. Puedes crear criterios sueltos o por componentes.",
      };
    }

    if (mode === "mixed") {
      return {
        tone: "danger" as const,
        message: `Estado bloqueante: hay criterios sueltos y por componente. Quedan ${looseCount} por asignar.`,
      };
    }

    if (mode === "components") {
      return {
        tone: "success" as const,
        message: "Configuración válida en modo por componentes.",
      };
    }

    return {
      tone: "success" as const,
      message: "Configuración válida en modo plano.",
    };
  }, [selectedEventKey, mode, looseCount]);

  const storageKey = useMemo(
    () =>
      selectedEventKey
        ? `criteria-component-collapsible:${selectedEventKey}:${selectedCategoryKey || "all"}`
        : "",
    [selectedEventKey, selectedCategoryKey]
  );

  useEffect(() => {
    if (!storageKey) {
      setOpenByComponent({});
      return;
    }

    const persisted = sessionStorage.getItem(storageKey);
    if (!persisted) {
      setOpenByComponent({});
      return;
    }

    try {
      const parsed = JSON.parse(persisted) as Record<number, boolean>;
      setOpenByComponent(parsed);
    } catch {
      setOpenByComponent({});
    }
  }, [storageKey]);

  const persistOpenState = useCallback(
    (nextState: Record<number, boolean>) => {
      setOpenByComponent(nextState);
      if (storageKey) {
        sessionStorage.setItem(storageKey, JSON.stringify(nextState));
      }
    },
    [storageKey]
  );

  const mergeEventComponentIds = useCallback(
    (componentIds: number[]) => {
      if (!selectedEventKey || componentIds.length === 0) return;

      setEventComponentIds((previous) => {
        const current = previous[selectedEventKey] ?? [];
        const merged = Array.from(new Set([...current, ...componentIds]));
        if (merged.length === current.length) return previous;
        return {
          ...previous,
          [selectedEventKey]: merged,
        };
      });
    },
    [selectedEventKey]
  );

  useEffect(() => {
    const ids = criteria
      .map((criterion) => criterion.component?.id)
      .filter((value): value is number => typeof value === "number");
    mergeEventComponentIds(ids);
  }, [criteria, mergeEventComponentIds]);

  const componentById = useMemo(() => {
    const map = new Map<number, CriterionComponent>();

    (createdComponentsByEvent[selectedEventKey] ?? []).forEach((component) => {
      map.set(component.id, component);
    });

    allComponents.forEach((component) => {
      map.set(component.id, component);
    });
    criteria.forEach((criterion) => {
      if (criterion.component?.id && !map.has(criterion.component.id)) {
        map.set(criterion.component.id, criterion.component);
      }
    });
    return map;
  }, [allComponents, createdComponentsByEvent, criteria, selectedEventKey]);

  const availableComponents = useMemo(() => {
    if (!selectedEventKey) return [];

    const tracked = new Set<number>([
      ...allComponents.map((component) => component.id),
      ...(createdComponentsByEvent[selectedEventKey] ?? []).map(
        (component) => component.id
      ),
    ]);

    (eventComponentIds[selectedEventKey] ?? []).forEach((componentId) => {
      tracked.add(componentId);
    });

    criteria.forEach((criterion) => {
      if (criterion.component?.id) {
        tracked.add(criterion.component.id);
      }
    });

    return Array.from(tracked)
      .map((componentId) => componentById.get(componentId))
      .filter((component): component is CriterionComponent => !!component)
      .sort((left, right) => left.name.localeCompare(right.name));
  }, [
    allComponents,
    componentById,
    createdComponentsByEvent,
    criteria,
    eventComponentIds,
    selectedEventKey,
  ]);

  const criteriaByComponent = useMemo(() => {
    const map = new Map<number, Criterion[]>();
    criteria.forEach((criterion) => {
      const componentId = criterion.component?.id;
      if (!componentId) return;

      if (!map.has(componentId)) {
        map.set(componentId, []);
      }
      map.get(componentId)?.push(criterion);
    });
    return map;
  }, [criteria]);

  const totalWeightPercent = useMemo(
    () =>
      criteria.reduce(
        (total, criterion) => total + Number(criterion.weight || 0) * 100,
        0
      ),
    [criteria]
  );

  const componentSummaryRows = useMemo(
    () =>
      availableComponents.map((component) => {
        const componentCriteria = criteriaByComponent.get(component.id) ?? [];
        const totalCriteriaWeight = componentCriteria.reduce(
          (sum, criterion) => sum + Number(criterion.weight || 0) * 100,
          0
        );

        return {
          id: component.id,
          name: component.name,
          weightPercent: Number(component.weight || 0) * 100,
          criteriaCount: componentCriteria.length,
          criteriaWeightPercent: totalCriteriaWeight,
        };
      }),
    [availableComponents, criteriaByComponent]
  );

  const canSave = !!selectedEventKey && mode !== "neutral" && mode !== "mixed";

  const handleEventChange = useCallback((keys: any) => {
    const eventKey = getSingleSelectionKey(keys);
    const validEventId = toPositiveInt(eventKey);

    if (!validEventId) {
      setSelectedEventKey("");
      setSelectedCategoryKey("");
      setAssignmentByCriterion({});
      return;
    }

    setSelectedEventKey(eventKey);
    setSelectedCategoryKey("");
    setAssignmentByCriterion({});
  }, []);

  const handleCategoryChange = useCallback((keys: any) => {
    const nextKey = getSingleSelectionKey(keys);

    if (!nextKey) {
      setSelectedCategoryKey("");
      return;
    }

    const validCategoryId = toPositiveInt(nextKey);
    if (!validCategoryId) {
      setSelectedCategoryKey("");
      return;
    }

    setSelectedCategoryKey(String(validCategoryId));
  }, []);

  const handleAssignToComponent = useCallback(
    async (criterion: Criterion) => {
      const selectedComponent = assignmentByCriterion[criterion.id];
      if (!selectedComponent) return;

      try {
        await updateCriteriaMutation.mutateAsync({
          criterionId: criterion.id,
          data: {
            componentId: Number(selectedComponent),
            categoryIds: criterion.categoryIds,
            eventId: criterion.eventId,
            ...(criterion.name ? { name: criterion.name } : {}),
            ...(criterion.description ? { description: criterion.description } : {}),
            ...(criterion.category ? { category: criterion.category } : {}),
            ...(typeof criterion.weight === "number"
              ? { weight: criterion.weight }
              : {}),
          },
        });

        setAssignmentByCriterion((previous) => {
          const next = { ...previous };
          delete next[criterion.id];
          return next;
        });

        addNotification({
          type: "success",
          title: "Criterio asignado",
          message: "El criterio fue asignado correctamente al componente.",
        });
      } catch (error: any) {
        addNotification({
          type: "error",
          title: "Error",
          message: error?.message || "No se pudo asignar el criterio.",
        });
      }
    },
    [addNotification, assignmentByCriterion, updateCriteriaMutation]
  );

  const handleDeleteComponent = useCallback(
    async (component: CriterionComponent) => {
      const criteriaCount = criteriaByComponent.get(component.id)?.length ?? 0;
      const warning =
        criteriaCount > 0
          ? `Este componente tiene ${criteriaCount} criterio(s). Al eliminarlo, esos criterios quedarán sueltos y el evento puede quedar en estado de mezcla. ¿Deseas continuar?`
          : "¿Deseas eliminar este componente?";

      const confirmed = window.confirm(warning);
      if (!confirmed) return;

      try {
        await deleteComponentMutation.mutateAsync({
          componentId: component.id,
        });

        if (selectedEventKey) {
          setCreatedComponentsByEvent((previous) => {
            const current = previous[selectedEventKey] ?? [];
            return {
              ...previous,
              [selectedEventKey]: current.filter((item) => item.id !== component.id),
            };
          });

          setEventComponentIds((previous) => {
            const current = previous[selectedEventKey] ?? [];
            return {
              ...previous,
              [selectedEventKey]: current.filter((id) => id !== component.id),
            };
          });
        }

        addNotification({
          type: "success",
          title: "Componente eliminado",
          message: "El componente fue eliminado correctamente.",
        });
      } catch (error: any) {
        addNotification({
          type: "error",
          title: "Error",
          message: error?.message || "No se pudo eliminar el componente.",
        });
      }
    },
    [
      addNotification,
      criteriaByComponent,
      deleteComponentMutation,
      selectedEventKey,
    ]
  );

  const validationBarClassName =
    validationState.tone === "success"
      ? "border-success/30 bg-success/10 text-success"
      : validationState.tone === "danger"
        ? "border-danger/30 bg-danger/10 text-danger"
        : "border-default-200 bg-default-50/60 text-default-700";

  const ValidationIcon =
    validationState.tone === "success"
      ? CheckCircle2
      : validationState.tone === "danger"
        ? AlertTriangle
        : Info;

  const renderCriterionCard = (
    criterion: Criterion,
    options?: {
      showAssignment?: boolean;
      hideComponentBadge?: boolean;
      emphasizeLoose?: boolean;
      compact?: boolean;
    }
  ) => {
    const showAssignment = options?.showAssignment && !criterion.component?.id;
    const hideComponentBadge = options?.hideComponentBadge;
    const emphasizeLoose = options?.emphasizeLoose;
    const compact = options?.compact;
    const selectedAssignment = assignmentByCriterion[criterion.id] || "";

    return (
      <Card
        shadow="sm"
        key={criterion.id}
        className={
          emphasizeLoose
            ? "border-danger/30 bg-danger/5"
            : "glass-card"
        }
      >
        <CardBody className={compact ? "p-3 sm:p-4" : "p-4 sm:p-6"}>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1 min-w-0">
                <h3 className="text-sm sm:text-base font-semibold line-clamp-2">
                  {criterion.name}
                </h3>
                <p className="text-xs sm:text-sm text-default-500 line-clamp-2">
                  {criterion.description || "Sin descripción"}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {criterion.category && (
                    <span className="text-default-500">
                      Categoría: <span className="font-semibold">{criterion.category}</span>
                    </span>
                  )}

                  {!!criterion.component?.name && !hideComponentBadge && (
                    <Chip size="sm" color="secondary" variant="flat">
                      {criterion.component.name}
                    </Chip>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 sm:self-start">
                <Chip size="sm" color="primary" variant="flat">
                  {(criterion.weight * 100).toFixed(0)}%
                </Chip>
                <DeleteCriteria criterionId={criterion.id} />
              </div>
            </div>

            {showAssignment && (
              <div className="rounded-lg border border-danger/30 bg-danger/10 p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <div className="sm:flex-1">
                    <Select
                      size="sm"
                      label="Asignar a componente"
                      placeholder="Selecciona un componente"
                      selectedKeys={selectedAssignment ? [selectedAssignment] : []}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0];
                        setAssignmentByCriterion((previous) => ({
                          ...previous,
                          [criterion.id]: selected ? String(selected) : "",
                        }));
                      }}
                    >
                      {availableComponents.map((component) => (
                        <SelectItem key={String(component.id)}>{component.name}</SelectItem>
                      ))}
                    </Select>
                  </div>
                  <Button
                    size="sm"
                    color="primary"
                    isDisabled={!selectedAssignment}
                    onPress={() => handleAssignToComponent(criterion)}
                    isLoading={updateCriteriaMutation.isPending}
                  >
                    Asignar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="w-full sm:w-60">
          <Select
            label="Evento"
            placeholder="Selecciona un evento"
            selectedKeys={selectedEventKey ? [selectedEventKey] : []}
            onSelectionChange={handleEventChange}
            isLoading={eventsQuery.isLoading}
          >
            {events.map((event) => (
              <SelectItem key={String(event.id)}>{event.name}</SelectItem>
            ))}
          </Select>
        </div>

        <div className="w-full sm:flex-1">
          <Select
            label="Categoría"
            placeholder={
              selectedEventKey
                ? "Selecciona una categoría (opcional)"
                : "Selecciona un evento primero"
            }
            selectedKeys={selectedCategoryKey ? [selectedCategoryKey] : []}
            onSelectionChange={handleCategoryChange}
            isDisabled={!selectedEventKey}
            isLoading={!!selectedEventKey && categoriesQuery.isLoading}
          >

            {categories.length > 0 ? (
              categories.map((c) => (
                <SelectItem key={String(c.id)}>{c.code}</SelectItem>
              ))
            ) : (
              <SelectItem key="no-categories" isDisabled>
                {selectedEventKey
                  ? "No hay categorías disponibles"
                  : "Selecciona un evento primero"}
              </SelectItem>
            )}
          </Select>
        </div>
      </div>

      <Card className={validationBarClassName}>
        <CardBody className="py-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ValidationIcon className="size-4" />
            <span>{validationState.message}</span>
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
        <Card className="glass-card shadow-sm">
          <CardHeader className="pb-2">
            <p className="text-xs font-medium text-default-500">Total de criterios</p>
          </CardHeader>
          <CardBody className="pt-0">
            <p className="text-2xl font-bold">{criteria.length}</p>
          </CardBody>
        </Card>

        <Card className="glass-card shadow-sm">
          <CardHeader className="pb-2">
            <p className="text-xs font-medium text-default-500">
              Total de componentes
            </p>
          </CardHeader>
          <CardBody className="pt-0">
            <p className="text-2xl font-bold">{availableComponents.length}</p>
          </CardBody>
        </Card>

        <Card className="glass-card shadow-sm">
          <CardHeader className="pb-2">
            <p className="text-xs font-medium text-default-500">Peso acumulado</p>
          </CardHeader>
          <CardBody className="pt-0">
            <p className="text-2xl font-bold">{totalWeightPercent.toFixed(0)}%</p>
          </CardBody>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {mode !== "components" && (
            <CreateCriteriaContextual
              defaultEventId={selectedEventKey}
              availableComponents={availableComponents}
              requireComponentSelection={availableComponents.length > 0}
              buttonDisabled={!selectedEventKey}
              onCreated={() => criteriaQuery.refetch()}
            />
          )}

          <CreateComponent
            isDisabled={!selectedEventKey}
            onCreated={(component) => {
              if (!selectedEventKey) return;

              mergeEventComponentIds([component.id]);
              setCreatedComponentsByEvent((previous) => {
                const current = previous[selectedEventKey] ?? [];
                const withoutSame = current.filter((item) => item.id !== component.id);

                return {
                  ...previous,
                  [selectedEventKey]: [...withoutSame, component],
                };
              });

              componentsQuery.refetch();
            }}
          />
        </div>

        <Button
          color="primary"
          variant="shadow"
          isDisabled={!canSave}
          onPress={() => {
            if (!canSave) return;
            addNotification({
              type: "success",
              title: "Configuración válida",
              message: "La configuración está lista. Los cambios ya se aplicaron.",
            });
          }}
        >
          <Save className="size-4" />
          Guardar configuración
        </Button>
      </div>

      {!!selectedEventKey && (
        <Card className="glass-card">
          <CardHeader className="pb-0">
            <div>
              <p className="text-sm font-semibold">Componentes del evento</p>
              <p className="text-xs text-default-500">
                Resumen rápido de componentes y criterios asociados
              </p>
            </div>
          </CardHeader>
          <CardBody>
            <Table
              aria-label="Tabla de componentes"
              classNames={{ wrapper: "shadow-none p-0 bg-transparent" }}
            >
              <TableHeader>
                <TableColumn>COMPONENTE</TableColumn>
                <TableColumn align="center">PESO</TableColumn>
                <TableColumn align="center">CRITERIOS</TableColumn>
                <TableColumn align="center">PESO CRITERIOS</TableColumn>
              </TableHeader>
              <TableBody
                items={componentSummaryRows}
                emptyContent={
                  componentsQuery.isLoading
                    ? "Cargando componentes..."
                    : "No hay componentes para este evento todavía"
                }
              >
                {(row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.name}</TableCell>
                    <TableCell align="center">{row.weightPercent.toFixed(0)}%</TableCell>
                    <TableCell align="center">{row.criteriaCount}</TableCell>
                    <TableCell align="center">
                      <Chip
                        size="sm"
                        color={
                          row.criteriaWeightPercent > row.weightPercent
                            ? "danger"
                            : "default"
                        }
                        variant="flat"
                      >
                        {row.criteriaWeightPercent.toFixed(0)}%
                      </Chip>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      )}

      {isLoading ? (
        <div className="flex h-48 w-full items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : !selectedEventKey ? (
        <div className="flex h-48 w-full items-center justify-center text-default-400">
          Selecciona un evento para ver los criterios
        </div>

      ) : mode === "neutral" ? (
        <Card className="glass-card">
          <CardBody className="py-10 text-center text-default-500">
            <p className="text-base font-medium">No hay criterios ni componentes aún</p>
            <p className="text-sm mt-1">
              Usa los botones de arriba para iniciar la configuración de evaluación.
            </p>
          </CardBody>
        </Card>
      ) : mode === "components" ? (
        <div className="space-y-3">
          {availableComponents.map((component) => {
            const componentCriteria = criteriaByComponent.get(component.id) ?? [];
            const isOpen = openByComponent[component.id] ?? true;

            return (
              <Collapsible
                key={component.id}
                open={isOpen}
                onOpenChange={(nextOpen) =>
                  persistOpenState({
                    ...openByComponent,
                    [component.id]: nextOpen,
                  })
                }
              >
                <Card className="glass-card">
                  <CardBody className="space-y-3 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="light"
                          className="justify-start h-auto px-0 py-0"
                        >
                          <div className="flex items-center gap-3">
                            <ChevronDown
                              className={`size-4 transition-transform ${
                                isOpen ? "rotate-180" : "rotate-0"
                              }`}
                            />
                            <div className="text-left">
                              <p className="font-semibold text-sm sm:text-base">
                                {component.name}
                              </p>
                              <p className="text-xs text-default-500">
                                {componentCriteria.length} criterio(s) •{" "}
                                {(component.weight * 100).toFixed(0)}%
                              </p>
                            </div>
                          </div>
                        </Button>
                      </CollapsibleTrigger>

                      <div className="flex items-center gap-2">
                        <CreateCriteriaContextual
                          defaultEventId={selectedEventKey}
                          fixedComponent={component}
                          availableComponents={availableComponents}
                          requireComponentSelection
                          buttonLabel="Agregar criterio"
                          buttonVariant="flat"
                          buttonColor="primary"
                          onCreated={() => criteriaQuery.refetch()}
                        />
                        <Button
                          size="sm"
                          variant="flat"
                          color="danger"
                          isLoading={deleteComponentMutation.isPending}
                          onPress={() => handleDeleteComponent(component)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </div>

                    <CollapsibleContent>
                      {componentCriteria.length === 0 ? (
                        <div className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning flex items-center gap-2">
                          <AlertTriangle className="size-4" />
                          Este componente aún no tiene criterios asociados.
                        </div>
                      ) : (
                        <div className="space-y-2 mt-1">
                          {componentCriteria.map((criterion) =>
                            renderCriterionCard(criterion, {
                              hideComponentBadge: true,
                              compact: true,
                            })
                          )}
                        </div>
                      )}
                    </CollapsibleContent>
                  </CardBody>
                </Card>
              </Collapsible>
            );
          })}

        </div>
      ) : (
        <div className="space-y-3">
          {criteria.map((criterion) =>
            renderCriterionCard(criterion, {
              showAssignment: mode === "mixed",
              emphasizeLoose: mode === "mixed" && !criterion.component?.id,
              compact: true,
            })
          )}
        </div>
      )}
    </div>
  );
};
