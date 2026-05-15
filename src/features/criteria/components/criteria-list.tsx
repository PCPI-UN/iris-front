"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Info,
  RotateCcw,
  Save,
  Trash,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@/components/ui/modal";
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
import { deleteComponent, useDeleteComponent } from "../api/delete-component";
import { useCriteria } from "../api/get-criteria";
import { createCriteria } from "../api/create-criteria";
import { deleteCriteria } from "../api/delete-criteria";
import { updateCriteria, useUpdateCriteria } from "../api/update-criteria";
import { createComponent } from "../api/create-component";
import { updateComponent } from "../api/update-component";
import { CreateComponent } from "./create-component";
import { CreateCriteriaContextual } from "./create-criteria-contextual";
import { DeleteCriteria } from "./delete-criteria";

type CriteriaMode = "neutral" | "flat" | "mixed" | "components";
type SavedCriteriaSnapshot = {
  criteria: Criterion[];
  components: CriterionComponent[];
};
type DeleteComponentMode = "delete-criteria" | "reassign";

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

const normalizeCriterionForCompare = (criterion: Criterion) => ({
  eventId: criterion.eventId,
  name: criterion.name,
  description: criterion.description ?? "",
  weight: Number(criterion.weight || 0),
  categoryIds: [...(criterion.categoryIds ?? [])].sort((a, b) => a - b),
  componentId: criterion.component?.id ?? null,
});

const normalizeComponentForCompare = (component: CriterionComponent) => ({
  name: component.name,
  description: component.description ?? "",
  weight: Number(component.weight || 0),
});

export const CriteriaList = () => {
  const { addNotification } = useNotifications();

  const [selectedEventKey, setSelectedEventKey] = useState<string>("");
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string>("");
  const [assignmentByCriterion, setAssignmentByCriterion] = useState<
    Record<number, string>
  >({});
  const [openByComponent, setOpenByComponent] = useState<
    Record<number, boolean>
  >({});
  const [eventComponentIds, setEventComponentIds] = useState<
    Record<string, number[]>
  >({});
  const [createdComponentsByEvent, setCreatedComponentsByEvent] = useState<
    Record<string, CriterionComponent[]>
  >({});
  const [hasUnsavedChangesByEvent, setHasUnsavedChangesByEvent] = useState<
    Record<string, boolean>
  >({});
  const [componentToDelete, setComponentToDelete] =
    useState<CriterionComponent | null>(null);
  const [deleteComponentMode, setDeleteComponentMode] =
    useState<DeleteComponentMode>("reassign");
  const [isCancelChangesOpen, setIsCancelChangesOpen] = useState(false);
  const [isRollbackPending, setIsRollbackPending] = useState(false);
  const [savedSnapshotByEvent, setSavedSnapshotByEvent] = useState<
    Record<string, SavedCriteriaSnapshot>
  >({});

  // Refs to break effect cycles — we read current values without subscribing to them
  const mergedComponentIdsRef = useRef<Record<string, Set<number>>>({});
  const snapshotCapturedRef = useRef<Record<string, boolean>>({});

  const selectedEventId = useMemo(
    () => toPositiveInt(selectedEventKey),
    [selectedEventKey],
  );

  const criteriaQuery = useCriteria({
    page: 1,
    limit: 100,
    eventId: selectedEventKey ? Number(selectedEventKey) : undefined,
    categoryId: selectedCategoryKey ? Number(selectedCategoryKey) : undefined,
  });
  const allEventCriteriaQuery = useCriteria({
    page: 1,
    limit: 100,
    eventId: selectedEventKey ? Number(selectedEventKey) : undefined,
    queryConfig: { enabled: !!selectedEventKey },
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
    criteriaQuery.isLoading ||
    eventsQuery.isLoading ||
    componentsQuery.isLoading;

  const criteria = criteriaQuery.data?.criterions ?? [];
  const allEventCriteria = allEventCriteriaQuery.data?.criterions ?? criteria;

  const hasAssigned = useMemo(
    () => criteria.some((c) => !!c.component?.id),
    [criteria],
  );

  const hasComponentsAvailable = useMemo(() => {
    if (!selectedEventKey) return false;
    return (
      allComponents.length > 0 ||
      (eventComponentIds[selectedEventKey]?.length ?? 0) > 0 ||
      criteria.some((c) => !!c.component?.id)
    );
  }, [allComponents, eventComponentIds, selectedEventKey, criteria]);

  const hasUnsavedChanges = !!(
    selectedEventKey && hasUnsavedChangesByEvent[selectedEventKey]
  );

  const mode: CriteriaMode = useMemo(() => {
    if (hasComponentsAvailable) return "components";
    if (criteria.length === 0) return "neutral";
    if (hasAssigned) return "components";
    return "flat";
  }, [criteria.length, hasAssigned, hasComponentsAvailable]);

  const looseCount = useMemo(
    () => criteria.filter((c) => !c.component?.id).length,
    [criteria],
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
    if (hasComponentsAvailable && looseCount > 0) {
      return {
        tone: "danger" as const,
        message: `Estado bloqueante: el evento está en modo componentes y quedan ${looseCount} criterio(s) suelto(s) por asignar.`,
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
  }, [selectedEventKey, mode, looseCount, hasComponentsAvailable]);

  const storageKey = useMemo(
    () =>
      selectedEventKey
        ? `criteria-component-collapsible:${selectedEventKey}:${selectedCategoryKey || "all"}`
        : "",
    [selectedEventKey, selectedCategoryKey],
  );

  // Restore collapsible state from sessionStorage when storageKey changes
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
      setOpenByComponent(JSON.parse(persisted) as Record<number, boolean>);
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
    [storageKey],
  );

  // Merge component ids from criteria into eventComponentIds.
  // Uses a ref to track already-merged ids so the effect only fires when
  // there are genuinely new ids — breaking the potential update cycle.
  useEffect(() => {
    if (!selectedEventKey) return;

    const incomingIds = criteria
      .map((c) => c.component?.id)
      .filter((id): id is number => typeof id === "number");

    if (incomingIds.length === 0) return;

    const alreadyMerged =
      mergedComponentIdsRef.current[selectedEventKey] ?? new Set<number>();
    const newIds = incomingIds.filter((id) => !alreadyMerged.has(id));

    if (newIds.length === 0) return;

    const nextSet = new Set([...alreadyMerged, ...newIds]);
    mergedComponentIdsRef.current[selectedEventKey] = nextSet;

    setEventComponentIds((prev) => {
      const current = prev[selectedEventKey] ?? [];
      const merged = Array.from(new Set([...current, ...newIds]));
      return { ...prev, [selectedEventKey]: merged };
    });
  }, [criteria, selectedEventKey]);

  const componentById = useMemo(() => {
    const map = new Map<number, CriterionComponent>();
    (createdComponentsByEvent[selectedEventKey] ?? []).forEach((c) =>
      map.set(c.id, c),
    );
    allComponents.forEach((c) => map.set(c.id, c));
    criteria.forEach((c) => {
      if (c.component?.id && !map.has(c.component.id)) {
        map.set(c.component.id, c.component);
      }
    });
    return map;
  }, [allComponents, createdComponentsByEvent, criteria, selectedEventKey]);

  const availableComponents = useMemo(() => {
    if (!selectedEventKey) return [];

    const tracked = new Set<number>([
      ...allComponents.map((c) => c.id),
      ...(createdComponentsByEvent[selectedEventKey] ?? []).map((c) => c.id),
      ...(eventComponentIds[selectedEventKey] ?? []),
    ]);

    criteria.forEach((c) => {
      if (c.component?.id) tracked.add(c.component.id);
    });

    return Array.from(tracked)
      .map((id) => componentById.get(id))
      .filter((c): c is CriterionComponent => !!c)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [
    allComponents,
    componentById,
    createdComponentsByEvent,
    criteria,
    eventComponentIds,
    selectedEventKey,
  ]);

  // Capture the initial snapshot once per event, only after all queries settle.
  // Uses a ref to ensure we only capture once and never re-run due to derived
  // value changes — this is the main fix for the update cycle.
  useEffect(() => {
    if (!selectedEventKey) return;
    if (hasUnsavedChangesByEvent[selectedEventKey]) return;
    if (
      criteriaQuery.isLoading ||
      allEventCriteriaQuery.isLoading ||
      componentsQuery.isLoading
    ) return;
    if (snapshotCapturedRef.current[selectedEventKey]) return;

    snapshotCapturedRef.current[selectedEventKey] = true;

    setSavedSnapshotByEvent((prev) => ({
      ...prev,
      [selectedEventKey]: {
        criteria: allEventCriteria,
        components: availableComponents,
      },
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedEventKey,
    criteriaQuery.isLoading,
    allEventCriteriaQuery.isLoading,
    componentsQuery.isLoading,
  ]);
  // NOTE: allEventCriteria and availableComponents are intentionally omitted
  // from deps here. We only want to capture the snapshot once per event after
  // loading finishes, not every time the derived arrays change reference.
  // snapshotCapturedRef.current guards against re-capture.

  const criteriaByComponent = useMemo(() => {
    const map = new Map<number, Criterion[]>();
    criteria.forEach((c) => {
      const id = c.component?.id;
      if (!id) return;
      if (!map.has(id)) map.set(id, []);
      map.get(id)!.push(c);
    });
    return map;
  }, [criteria]);

  const totalWeightPercent = useMemo(
    () =>
      criteria.reduce((total, c) => total + Number(c.weight || 0) * 100, 0),
    [criteria],
  );

  const componentSummaryRows = useMemo(
    () =>
      availableComponents.map((component) => {
        const componentCriteria = criteriaByComponent.get(component.id) ?? [];
        const totalCriteriaWeight = componentCriteria.reduce(
          (sum, c) => sum + Number(c.weight || 0) * 100,
          0,
        );
        return {
          id: component.id,
          name: component.name,
          weightPercent: Number(component.weight || 0) * 100,
          criteriaCount: componentCriteria.length,
          criteriaWeightPercent: totalCriteriaWeight,
        };
      }),
    [availableComponents, criteriaByComponent],
  );

  const hasValidationErrors = hasComponentsAvailable && looseCount > 0;
  const canSave = hasUnsavedChanges && !hasValidationErrors;

  const markUnsavedChanges = useCallback(() => {
    if (!selectedEventKey) return;
    setHasUnsavedChangesByEvent((prev) => ({
      ...prev,
      [selectedEventKey]: true,
    }));
  }, [selectedEventKey]);

  const refetchCriteriaState = useCallback(async () => {
    await Promise.all([
      criteriaQuery.refetch(),
      allEventCriteriaQuery.refetch(),
      componentsQuery.refetch(),
    ]);
  }, [allEventCriteriaQuery, componentsQuery, criteriaQuery]);

  // Capture a fresh snapshot using refs to avoid stale closures
  const allEventCriteriaRef = useRef(allEventCriteria);
  const availableComponentsRef = useRef(availableComponents);
  useEffect(() => { allEventCriteriaRef.current = allEventCriteria; }, [allEventCriteria]);
  useEffect(() => { availableComponentsRef.current = availableComponents; }, [availableComponents]);

  const buildSnapshot = useCallback(
    (): SavedCriteriaSnapshot => ({
      criteria: allEventCriteriaRef.current,
      components: availableComponentsRef.current,
    }),
    [],
  );

  const handleCancelChanges = useCallback(async () => {
    if (!selectedEventKey) return;

    const savedSnapshot = savedSnapshotByEvent[selectedEventKey];
    if (!savedSnapshot) {
      addNotification({
        type: "error",
        title: "Sin punto de restauración",
        message: "No hay un estado guardado reciente para restaurar.",
      });
      return;
    }

    setIsRollbackPending(true);
    try {
      const currentSnapshot = buildSnapshot();
      const savedCriteriaById = new Map(
        savedSnapshot.criteria.map((c) => [c.id, c]),
      );
      const currentCriteriaById = new Map(
        currentSnapshot.criteria.map((c) => [c.id, c]),
      );
      const savedComponentsById = new Map(
        savedSnapshot.components.map((c) => [c.id, c]),
      );
      const currentComponentsById = new Map(
        currentSnapshot.components.map((c) => [c.id, c]),
      );
      const restoredComponentIdByOldId = new Map<number, number>();

      for (const c of currentSnapshot.criteria) {
        if (!savedCriteriaById.has(c.id)) {
          await deleteCriteria({ criterionId: c.id });
        }
      }

      for (const component of savedSnapshot.components) {
        if (!currentComponentsById.has(component.id)) {
          const response = await createComponent({
            data: {
              name: component.name,
              description: component.description ?? "",
              weight: component.weight,
            },
          });
          const restored = (response as any)?.data ?? response;
          const restoredId = Number(restored?.id);
          if (Number.isFinite(restoredId) && restoredId > 0) {
            restoredComponentIdByOldId.set(component.id, restoredId);
          }
        }
      }

      for (const component of savedSnapshot.components) {
        const current = currentComponentsById.get(component.id);
        if (!current) continue;
        if (
          JSON.stringify(normalizeComponentForCompare(component)) !==
          JSON.stringify(normalizeComponentForCompare(current))
        ) {
          await updateComponent({
            componentId: component.id,
            data: {
              name: component.name,
              description: component.description ?? "",
              weight: component.weight,
            },
          });
        }
      }

      for (const criterion of savedSnapshot.criteria) {
        const current = currentCriteriaById.get(criterion.id);
        const restoredComponentId = criterion.component?.id
          ? (restoredComponentIdByOldId.get(criterion.component.id) ??
            criterion.component.id)
          : undefined;

        const payload = {
          eventId: criterion.eventId,
          name: criterion.name,
          description: criterion.description ?? "",
          weight: criterion.weight,
          categoryIds: criterion.categoryIds,
          componentId: restoredComponentId ?? null,
        };

        if (!current) {
          await createCriteria({
            data: {
              eventId: payload.eventId,
              name: payload.name,
              description: payload.description,
              weight: payload.weight,
              categoryIds: payload.categoryIds,
              ...(restoredComponentId ? { componentId: restoredComponentId } : {}),
            },
          });
          continue;
        }

        if (
          JSON.stringify(normalizeCriterionForCompare(criterion)) !==
          JSON.stringify(normalizeCriterionForCompare(current))
        ) {
          await updateCriteria({ criterionId: current.id, data: payload });
        }
      }

      for (const component of currentSnapshot.components) {
        if (!savedComponentsById.has(component.id)) {
          await deleteComponent({ componentId: component.id });
        }
      }

      setHasUnsavedChangesByEvent((prev) => ({
        ...prev,
        [selectedEventKey]: false,
      }));
      setCreatedComponentsByEvent((prev) => ({
        ...prev,
        [selectedEventKey]: [],
      }));
      setEventComponentIds((prev) => ({
        ...prev,
        [selectedEventKey]: savedSnapshot.components.map((c) => c.id),
      }));
      // Reset snapshot capture guard so a fresh one is taken after refetch
      snapshotCapturedRef.current[selectedEventKey] = false;
      mergedComponentIdsRef.current[selectedEventKey] = new Set();

      setIsCancelChangesOpen(false);
      await refetchCriteriaState();
      addNotification({
        type: "success",
        title: "Cambios descartados",
        message: "La vista se restauró al último estado guardado.",
      });
    } catch (error: any) {
      addNotification({
        type: "error",
        title: "No se pudieron cancelar los cambios",
        message:
          error?.message ||
          "Alguna operación de restauración fue rechazada por el servidor.",
      });
    } finally {
      setIsRollbackPending(false);
    }
  }, [
    addNotification,
    buildSnapshot,
    refetchCriteriaState,
    savedSnapshotByEvent,
    selectedEventKey,
  ]);

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
    if (!nextKey) { setSelectedCategoryKey(""); return; }
    const validId = toPositiveInt(nextKey);
    setSelectedCategoryKey(validId ? String(validId) : "");
  }, []);

  const handleAssignToComponent = useCallback(
    async (criterion: Criterion) => {
      const selected = assignmentByCriterion[criterion.id];
      if (!selected) return;
      try {
        await updateCriteriaMutation.mutateAsync({
          criterionId: criterion.id,
          data: {
            componentId: Number(selected),
            categoryIds: criterion.categoryIds,
            eventId: criterion.eventId,
            ...(criterion.name ? { name: criterion.name } : {}),
            ...(criterion.description ? { description: criterion.description } : {}),
            ...(criterion.category ? { category: criterion.category } : {}),
            ...(typeof criterion.weight === "number" ? { weight: criterion.weight } : {}),
          },
        });
        setAssignmentByCriterion((prev) => {
          const next = { ...prev };
          delete next[criterion.id];
          return next;
        });
        addNotification({
          type: "success",
          title: "Criterio asignado",
          message: "El criterio fue asignado correctamente al componente.",
        });
        markUnsavedChanges();
      } catch (error: any) {
        addNotification({
          type: "error",
          title: "Error",
          message: error?.message || "No se pudo asignar el criterio.",
        });
      }
    },
    [addNotification, assignmentByCriterion, markUnsavedChanges, updateCriteriaMutation],
  );

  const handleDeleteComponent = useCallback(
    async (component: CriterionComponent, mode: DeleteComponentMode = "reassign") => {
      try {
        const assignedCriteria = allEventCriteria.filter(
          (c) => c.component?.id === component.id,
        );
        if (mode === "delete-criteria") {
          for (const c of assignedCriteria) {
            await deleteCriteria({ criterionId: c.id });
          }
        }
        await deleteComponentMutation.mutateAsync({ componentId: component.id });

        if (selectedEventKey) {
          setCreatedComponentsByEvent((prev) => ({
            ...prev,
            [selectedEventKey]: (prev[selectedEventKey] ?? []).filter(
              (item) => item.id !== component.id,
            ),
          }));
          setEventComponentIds((prev) => ({
            ...prev,
            [selectedEventKey]: (prev[selectedEventKey] ?? []).filter(
              (id) => id !== component.id,
            ),
          }));
          // Remove from merge-tracking ref so it won't be re-added spuriously
          mergedComponentIdsRef.current[selectedEventKey]?.delete(component.id);
        }

        addNotification({
          type: "success",
          title: "Componente eliminado",
          message: "El componente fue eliminado correctamente.",
        });
        markUnsavedChanges();
        setComponentToDelete(null);
        setDeleteComponentMode("reassign");
        refetchCriteriaState();
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
      allEventCriteria,
      deleteComponentMutation,
      markUnsavedChanges,
      refetchCriteriaState,
      selectedEventKey,
    ],
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
    },
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
        className={emphasizeLoose ? "border-danger/30 bg-danger/5" : "glass-card"}
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
                      Categoría:{" "}
                      <span className="font-semibold">{criterion.category}</span>
                    </span>
                  )}
                  {!!criterion.component?.name && !hideComponentBadge && (
                    <Chip size="sm" color="secondary" variant="flat">
                      {criterion.component.name}
                    </Chip>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:self-start">
                <Chip size="sm" color="primary" variant="flat">
                  {(criterion.weight * 100).toFixed(0)}%
                </Chip>
                <CreateCriteriaContextual
                  defaultEventId={selectedEventKey}
                  availableComponents={availableComponents}
                  requireComponentSelection={hasComponentsAvailable}
                  criterionToEdit={criterion}
                  buttonVariant="flat"
                  buttonColor="default"
                  onUpdated={() => {
                    markUnsavedChanges();
                    refetchCriteriaState();
                  }}
                  onComponentCreated={(component) => {
                    markUnsavedChanges();
                    mergedComponentIdsRef.current[selectedEventKey] =
                      new Set([
                        ...(mergedComponentIdsRef.current[selectedEventKey] ?? new Set()),
                        component.id,
                      ]);
                    setEventComponentIds((prev) => ({
                      ...prev,
                      [selectedEventKey]: [
                        ...new Set([...(prev[selectedEventKey] ?? []), component.id]),
                      ],
                    }));
                    setCreatedComponentsByEvent((prev) => {
                      const current = prev[selectedEventKey] ?? [];
                      return {
                        ...prev,
                        [selectedEventKey]: [
                          ...current.filter((item) => item.id !== component.id),
                          component,
                        ],
                      };
                    });
                    refetchCriteriaState();
                  }}
                />
                <DeleteCriteria
                  criterionId={criterion.id}
                  onDeleted={() => {
                    markUnsavedChanges();
                    refetchCriteriaState();
                  }}
                />
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
                        setAssignmentByCriterion((prev) => ({
                          ...prev,
                          [criterion.id]: selected ? String(selected) : "",
                        }));
                      }}
                    >
                      {availableComponents.map((component) => (
                        <SelectItem key={String(component.id)}>
                          {component.name}
                        </SelectItem>
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
            <p className="text-xs font-medium text-default-500">Total de componentes</p>
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
          {!hasComponentsAvailable && (
            <CreateCriteriaContextual
              defaultEventId={selectedEventKey}
              availableComponents={availableComponents}
              requireComponentSelection={false}
              buttonDisabled={!selectedEventKey}
              onCreated={() => {
                markUnsavedChanges();
                refetchCriteriaState();
              }}
            />
          )}
          <CreateComponent
            isDisabled={!selectedEventKey}
            onCreated={(component) => {
              if (!selectedEventKey) return;
              markUnsavedChanges();
              mergedComponentIdsRef.current[selectedEventKey] = new Set([
                ...(mergedComponentIdsRef.current[selectedEventKey] ?? new Set()),
                component.id,
              ]);
              setEventComponentIds((prev) => ({
                ...prev,
                [selectedEventKey]: [
                  ...new Set([...(prev[selectedEventKey] ?? []), component.id]),
                ],
              }));
              setCreatedComponentsByEvent((prev) => {
                const current = prev[selectedEventKey] ?? [];
                return {
                  ...prev,
                  [selectedEventKey]: [
                    ...current.filter((item) => item.id !== component.id),
                    component,
                  ],
                };
              });
              refetchCriteriaState();
            }}
          />
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          {hasUnsavedChanges && (
            <Button
              variant="flat"
              color="danger"
              onPress={() => setIsCancelChangesOpen(true)}
              isDisabled={isRollbackPending}
            >
              <RotateCcw className="size-4" />
              Cancelar cambios
            </Button>
          )}
          <Button
            color="primary"
            variant="shadow"
            isDisabled={!canSave}
            onPress={() => {
              if (!canSave) return;
              const snapshot = buildSnapshot();
              setSavedSnapshotByEvent((prev) => ({
                ...prev,
                [selectedEventKey]: snapshot,
              }));
              setHasUnsavedChangesByEvent((prev) => ({
                ...prev,
                [selectedEventKey]: false,
              }));
              // Allow re-capture on next load after a real save
              snapshotCapturedRef.current[selectedEventKey] = false;
              addNotification({
                type: "success",
                title: "Configuración guardada",
                message: "La configuración quedó marcada como guardada.",
              });
            }}
          >
            <Save className="size-4" />
            Guardar configuración
          </Button>
        </div>
      </div>

      {!!selectedEventKey && availableComponents.length > 0 && (
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
              <TableBody items={componentSummaryRows} emptyContent="Cargando componentes...">
                {(row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.name}</TableCell>
                    <TableCell align="center">{row.weightPercent.toFixed(0)}%</TableCell>
                    <TableCell align="center">{row.criteriaCount}</TableCell>
                    <TableCell align="center">
                      <Chip
                        size="sm"
                        color={row.criteriaWeightPercent > row.weightPercent ? "danger" : "default"}
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
          {looseCount > 0 && (
            <div className="space-y-2">
              <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                Hay criterios sueltos. Asígnalos a un componente para poder guardar la configuración.
              </div>
              {criteria
                .filter((c) => !c.component?.id)
                .map((c) =>
                  renderCriterionCard(c, {
                    showAssignment: true,
                    emphasizeLoose: true,
                    compact: true,
                  }),
                )}
            </div>
          )}

          {availableComponents.map((component) => {
            const componentCriteria = criteriaByComponent.get(component.id) ?? [];
            const isOpen = openByComponent[component.id] ?? true;

            return (
              <Collapsible
                key={component.id}
                open={isOpen}
                onOpenChange={(nextOpen) =>
                  persistOpenState({ ...openByComponent, [component.id]: nextOpen })
                }
              >
                <Card className="glass-card">
                  <CardBody className="space-y-3 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <CollapsibleTrigger asChild>
                        <Button variant="light" className="justify-start h-auto px-0 py-0">
                          <div className="flex items-center gap-3">
                            <ChevronDown
                              className={`size-4 transition-transform ${isOpen ? "rotate-180" : "rotate-0"}`}
                            />
                            <div className="text-left">
                              <p className="font-semibold text-sm sm:text-base">{component.name}</p>
                              <p className="text-xs text-default-500">
                                {componentCriteria.length} criterio(s) •{" "}
                                {(component.weight * 100).toFixed(0)}%
                              </p>
                            </div>
                          </div>
                        </Button>
                      </CollapsibleTrigger>

                      <div className="flex flex-wrap items-center gap-2">
                        <CreateCriteriaContextual
                          defaultEventId={selectedEventKey}
                          fixedComponent={component}
                          availableComponents={availableComponents}
                          requireComponentSelection
                          buttonLabel="Agregar criterio"
                          buttonVariant="flat"
                          buttonColor="primary"
                          onCreated={() => {
                            markUnsavedChanges();
                            refetchCriteriaState();
                          }}
                        />
                        <CreateComponent
                          componentToEdit={component}
                          onUpdated={(updatedComponent) => {
                            markUnsavedChanges();
                            setCreatedComponentsByEvent((prev) => {
                              const current = prev[selectedEventKey] ?? [];
                              return {
                                ...prev,
                                [selectedEventKey]: [
                                  ...current.filter((item) => item.id !== updatedComponent.id),
                                  updatedComponent,
                                ],
                              };
                            });
                            refetchCriteriaState();
                          }}
                        />
                        <Button
                          size="sm"
                          variant="flat"
                          color="danger"
                          isLoading={deleteComponentMutation.isPending}
                          onPress={() => {
                            setDeleteComponentMode("reassign");
                            setComponentToDelete(component);
                          }}
                        >
                          <Trash className="size-4" />
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
                          {componentCriteria.map((c) =>
                            renderCriterionCard(c, {
                              hideComponentBadge: true,
                              compact: true,
                            }),
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
          {criteria.map((c) =>
            renderCriterionCard(c, {
              showAssignment: hasComponentsAvailable,
              emphasizeLoose: hasComponentsAvailable && !c.component?.id,
              compact: true,
            }),
          )}
        </div>
      )}

      <Modal
        isOpen={!!componentToDelete}
        onOpenChange={(open) => { if (!open) setComponentToDelete(null); }}
        size="md"
      >
        <ModalContent>
          {(closeModal) => {
            const criteriaCount = componentToDelete
              ? allEventCriteria.filter(
                  (c) => c.component?.id === componentToDelete.id,
                ).length
              : 0;

            return (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  Eliminar componente
                  <p className="text-sm font-normal text-default-500">
                    {componentToDelete?.name}
                  </p>
                </ModalHeader>
                <ModalBody className="space-y-2 text-sm text-default-600">
                  {criteriaCount > 0 ? (
                    <>
                      <p>
                        Este componente tiene {criteriaCount} criterio(s) asignado(s).
                        Elige qué hacer con ellos antes de eliminar el componente.
                      </p>
                      <div className="grid gap-2">
                        <button
                          type="button"
                          className={`rounded-lg border p-3 text-left transition ${
                            deleteComponentMode === "reassign"
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-default-200 bg-default-50 text-default-700"
                          }`}
                          onClick={() => setDeleteComponentMode("reassign")}
                        >
                          <span className="block text-sm font-semibold">Reasignarlos después</span>
                          <span className="block text-xs">
                            Los criterios quedarán sueltos con el selector de asignación visible.
                          </span>
                        </button>
                        <button
                          type="button"
                          className={`rounded-lg border p-3 text-left transition ${
                            deleteComponentMode === "delete-criteria"
                              ? "border-danger bg-danger/10 text-danger"
                              : "border-default-200 bg-default-50 text-default-700"
                          }`}
                          onClick={() => setDeleteComponentMode("delete-criteria")}
                        >
                          <span className="block text-sm font-semibold">
                            Eliminarlos junto con el componente
                          </span>
                          <span className="block text-xs">
                            Los criterios asignados también se eliminarán.
                          </span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <p>
                      Este componente está vacío. ¿Deseas eliminarlo? Esta acción
                      se aplicará en el backend inmediatamente.
                    </p>
                  )}
                </ModalBody>
                <ModalFooter>
                  <Button
                    variant="light"
                    onPress={closeModal}
                    isDisabled={deleteComponentMutation.isPending}
                  >
                    Cancelar
                  </Button>
                  <Button
                    color="danger"
                    isLoading={deleteComponentMutation.isPending}
                    onPress={() => {
                      if (componentToDelete) {
                        handleDeleteComponent(
                          componentToDelete,
                          criteriaCount > 0 ? deleteComponentMode : "reassign",
                        );
                      }
                    }}
                  >
                    Confirmar eliminación
                  </Button>
                </ModalFooter>
              </>
            );
          }}
        </ModalContent>
      </Modal>

      <Modal isOpen={isCancelChangesOpen} onOpenChange={setIsCancelChangesOpen} size="md">
        <ModalContent>
          {(closeModal) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Cancelar cambios
                <p className="text-sm font-normal text-default-500">
                  Se restaurará la configuración al último guardado exitoso.
                </p>
              </ModalHeader>
              <ModalBody className="space-y-2 text-sm text-default-600">
                <p>
                  Esto puede deshacer criterios y componentes creados, editados o eliminados
                  desde el último guardado. Algunas operaciones requieren llamadas de
                  restauración al servidor.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={closeModal} isDisabled={isRollbackPending}>
                  Mantener cambios
                </Button>
                <Button color="danger" isLoading={isRollbackPending} onPress={handleCancelChanges}>
                  Descartar cambios
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};