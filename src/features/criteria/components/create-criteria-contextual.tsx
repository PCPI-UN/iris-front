"use client";

import { Pencil, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@/components/ui/modal";
import { useNotifications } from "@/components/ui/notifications";
import { Select, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCategories } from "@/features/courses/api/get-categories";
import { useEventsDropdown } from "@/features/events/api/get-events-dropdown";
import { useDisclosure } from "@/hooks/use-disclosure";
import { Criterion, CriterionComponent } from "@/types/api";

import {
  createCriteriaInputSchema,
  useCreateCriteria,
} from "../api/create-criteria";
import {
  updateCriteriaInputSchema,
  useUpdateCriteria,
} from "../api/update-criteria";

const ALL_CATEGORIES_KEY = "__all_categories__";

type CreateCriteriaContextualProps = {
  defaultEventId?: string;
  fixedComponent?: CriterionComponent;
  availableComponents?: CriterionComponent[];
  requireComponentSelection?: boolean;
  buttonLabel?: string;
  buttonVariant?:
    | "solid"
    | "flat"
    | "light"
    | "shadow"
    | "ghost"
    | "bordered"
    | "faded";
  buttonColor?:
    | "default"
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger";
  buttonSize?: "sm" | "md" | "lg";
  buttonDisabled?: boolean;
  criterionToEdit?: Criterion;
  onCreated?: () => void;
  onUpdated?: () => void;
  onComponentCreated?: (component: CriterionComponent) => void;
  availableWeightPercent?: number;
};

const toKeySet = (values: number[] | undefined) =>
  new Set((values ?? []).map((value) => String(value)));

export const CreateCriteriaContextual = ({
  defaultEventId,
  fixedComponent,
  availableComponents = [],
  requireComponentSelection = false,
  buttonLabel = "Agregar criterio",
  buttonVariant = "solid",
  buttonColor = "primary",
  buttonSize = "sm",
  buttonDisabled = false,
  criterionToEdit,
  onCreated,
  onUpdated,
  onComponentCreated,
  availableWeightPercent,
}: CreateCriteriaContextualProps) => {
  const { addNotification } = useNotifications();
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const isEditing = !!criterionToEdit;
  const normalizeForUI = (raw?: number) => {
    const val = Number(raw ?? 0);
    return Math.round(val * 100);
  };

  const [selectedEventKey, setSelectedEventKey] = useState<string>(
    criterionToEdit?.eventId
      ? String(criterionToEdit.eventId)
      : defaultEventId || "",
  );
  const [selectedCategoryKeys, setSelectedCategoryKeys] = useState<Set<string>>(
    toKeySet(criterionToEdit?.categoryIds),
  );
  const [selectedComponentKey, setSelectedComponentKey] = useState<string>(
    criterionToEdit?.component?.id
      ? String(criterionToEdit.component.id)
      : fixedComponent
        ? String(fixedComponent.id)
        : "",
  );
  const [weightPercent, setWeightPercent] = useState(
    criterionToEdit ? normalizeForUI(criterionToEdit.weight) : 25,
  );
  const [weightError, setWeightError] = useState<string | null>(null);
  const [hasInitializedCategories, setHasInitializedCategories] =
    useState(false);

  useEffect(() => {
    if (!isEditing) {
      setSelectedEventKey(defaultEventId || "");
    }
  }, [defaultEventId, isEditing]);

  useEffect(() => {
    if (!isOpen) return;

    setSelectedEventKey(
      criterionToEdit?.eventId
        ? String(criterionToEdit.eventId)
        : defaultEventId || "",
    );
    setSelectedComponentKey(
      criterionToEdit?.component?.id
        ? String(criterionToEdit.component.id)
        : fixedComponent
          ? String(fixedComponent.id)
          : "",
    );
    setSelectedCategoryKeys(toKeySet(criterionToEdit?.categoryIds));
    setWeightPercent(criterionToEdit ? normalizeForUI(criterionToEdit.weight) : 25);
    setHasInitializedCategories(false);
  }, [criterionToEdit, defaultEventId, fixedComponent, isOpen]);

  useEffect(() => {
    const available = availableWeightPercent;
    if (typeof available === "number") {
      if (weightPercent > available) {
        setWeightError(
          `El peso excede el disponible. Disponible: ${available.toFixed(0)}%`,
        );
      } else {
        setWeightError(null);
      }
    } else {
      setWeightError(null);
    }
  }, [weightPercent, availableWeightPercent]);

  const createCriteriaMutation = useCreateCriteria({
    mutationConfig: {
      onSuccess: () => {
        addNotification({
          type: "success",
          title: "Criterio creado",
          message: "El criterio se agregó correctamente.",
        });
        onCreated?.();
        setSelectedCategoryKeys(new Set());
        if (!fixedComponent) {
          setSelectedComponentKey("");
        }
        setWeightPercent(25);
        onClose();
      },
      onError: (error: any) => {
        addNotification({
          type: "error",
          title: "Error",
          message: error?.message || "No se pudo crear el criterio.",
        });
      },
    },
  });
  const updateCriteriaMutation = useUpdateCriteria({
    mutationConfig: {
      onSuccess: () => {
        addNotification({
          type: "success",
          title: "Criterio actualizado",
          message: "El criterio se actualizó correctamente.",
        });
        onUpdated?.();
        onClose();
      },
      onError: (error: any) => {
        addNotification({
          type: "error",
          title: "Error",
          message: error?.message || "No se pudo actualizar el criterio.",
        });
      },
    },
  });
  const eventsQuery = useEventsDropdown();
  const categoriesQuery = useCategories({
    page: 1,
    eventId: selectedEventKey ? Number(selectedEventKey) : undefined,
    queryConfig: { enabled: !!selectedEventKey },
  });

  const events = eventsQuery.data?.data ?? [];
  const categories = categoriesQuery.data?.data ?? [];

  const componentOptions = useMemo(
    () =>
      [...availableComponents].sort((left, right) =>
        left.name.localeCompare(right.name),
      ),
    [availableComponents],
  );

  useEffect(() => {
    if (!isOpen || hasInitializedCategories || categories.length === 0) return;

    if (isEditing && criterionToEdit?.categoryIds?.length) {
      const criterionCategoryKeys = toKeySet(criterionToEdit.categoryIds);
      if (criterionCategoryKeys.size === categories.length) {
        criterionCategoryKeys.add(ALL_CATEGORIES_KEY);
      }
      setSelectedCategoryKeys(criterionCategoryKeys);
    } else {
      setSelectedCategoryKeys(
        new Set([
          ALL_CATEGORIES_KEY,
          ...categories.map((category) => String(category.id)),
        ]),
      );
    }

    setHasInitializedCategories(true);
  }, [
    categories,
    criterionToEdit,
    hasInitializedCategories,
    isEditing,
    isOpen,
  ]);

  const resolvedComponentId =
    !isEditing && fixedComponent?.id
      ? String(fixedComponent.id)
      : selectedComponentKey;

  // Show the component selector whenever there are components available
  // or when explicitly required.
  const hasComponentOptions = componentOptions.length > 0;
  const needsComponent =
    requireComponentSelection ||
    hasComponentOptions ||
    (!!fixedComponent && !isEditing);

  const isPending =
    createCriteriaMutation.isPending ||
    updateCriteriaMutation.isPending;

  const handleCategorySelectionChange = (keys: unknown) => {
    const nextKeys =
      keys instanceof Set
        ? new Set(Array.from(keys).map(String))
        : new Set(Array.from(keys as Iterable<unknown>).map(String));
    const categoryKeys = categories.map((category) => String(category.id));
    const hadAll = selectedCategoryKeys.has(ALL_CATEGORIES_KEY);
    const hasAll = nextKeys.has(ALL_CATEGORIES_KEY);

    if (hasAll && !hadAll) {
      setSelectedCategoryKeys(new Set([ALL_CATEGORIES_KEY, ...categoryKeys]));
      setHasInitializedCategories(true);
      return;
    }

    if (!hasAll && hadAll) {
      setSelectedCategoryKeys(new Set());
      setHasInitializedCategories(true);
      return;
    }

    const selectedOnlyCategories = categoryKeys.filter((key) =>
      nextKeys.has(key),
    );
    setSelectedCategoryKeys(
      new Set(
        selectedOnlyCategories.length === categoryKeys.length
          ? [ALL_CATEGORIES_KEY, ...selectedOnlyCategories]
          : selectedOnlyCategories,
      ),
    );
    setHasInitializedCategories(true);
  };

  // FIX 1: When all categories are selected (ALL_CATEGORIES_KEY is present),
  // render only "Todas" in the trigger instead of listing every category code.
  const categoryRenderValue = (items: any) => {
    if (selectedCategoryKeys.has(ALL_CATEGORIES_KEY)) {
      return "Todas";
    }
    return items
      .map((item: any) => item.textValue ?? item.rendered ?? item.key)
      .join(", ");
  };

  return (
    <>
      <Button
        size={buttonSize}
        color={buttonColor}
        variant={buttonVariant}
        onPress={onOpen}
        isDisabled={buttonDisabled}
      >
        {isEditing ? <Pencil size={16} /> : <Plus size={16} />}
        {isEditing ? "Editar" : buttonLabel}
      </Button>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="sm">
        <ModalContent>
          {(closeModal) => (
            <Form
              key={criterionToEdit?.id ?? "create-criteria-contextual"}
              id={
                isEditing
                  ? "update-criteria-contextual"
                  : "create-criteria-contextual"
              }
              onSubmit={async (event) => {
                event.preventDefault();
                const form = event.target as HTMLFormElement;
                const formData = new FormData(form);
                const rawData = Object.fromEntries(formData);

                if (!selectedEventKey) {
                  addNotification({
                    type: "error",
                    title: "Evento requerido",
                    message: "Selecciona un evento para crear el criterio.",
                  });
                  return;
                }

                if (categories.length === 0) {
                  addNotification({
                    type: "error",
                    title: "Sin categorías",
                    message:
                      "El evento seleccionado no tiene categorías asociadas para aplicar este criterio.",
                  });
                  return;
                }

                if (needsComponent && requireComponentSelection && !resolvedComponentId) {
                  addNotification({
                    type: "error",
                    title: "Componente requerido",
                    message: "Debes seleccionar un componente para continuar.",
                  });
                  return;
                }

                // Normalize and clamp weightPercent to integer 0..100 before sending.
                const normalizedWeightPercent = Math.max(
                  0,
                  Math.min(100, Math.round(Number(weightPercent) || 0)),
                );

                const payload = {
                  eventId: Number(selectedEventKey),
                  name: String(rawData.name || "").trim(),
                  description: String(rawData.description || "").trim(),
                  weight: normalizedWeightPercent / 100,
                  categoryIds: Array.from(selectedCategoryKeys)
                    .map((categoryId) => Number(categoryId))
                    .filter((categoryId) => Number.isFinite(categoryId)),
                  componentId: resolvedComponentId
                    ? Number(resolvedComponentId)
                    : undefined,
                };

                try {
                  if (isEditing && criterionToEdit) {
                    const values =
                      await updateCriteriaInputSchema.parseAsync(payload);
                    await updateCriteriaMutation.mutateAsync({
                      criterionId: criterionToEdit.id,
                      data: values,
                    });
                  } else {
                    const values =
                      await createCriteriaInputSchema.parseAsync(payload);
                    await createCriteriaMutation.mutateAsync({ data: values });
                  }
                } catch (error: any) {
                  addNotification({
                    type: "error",
                    title: "Error de validación",
                    message: error?.message || "Revisa los datos ingresados.",
                  });
                }
              }}
            >
              <ModalHeader className="flex flex-col gap-1">
                {isEditing ? "Editar criterio" : "Crear criterio"}
                <p className="text-sm font-normal text-default-500">
                  {isEditing
                    ? "Actualiza la información del criterio de evaluación."
                    : "Completa la información para agregar un nuevo criterio de evaluación."}
                </p>
              </ModalHeader>

              <ModalBody className="py-1 sm:py-2">
                <div className="mx-auto flex w-full max-w-sm sm:max-w-md lg:max-w-lg flex-col gap-1">
                  <Input
                    name="name"
                    label="Nombre"
                    placeholder="Ej: Calidad técnica"
                    defaultValue={criterionToEdit?.name ?? ""}
                    isRequired
                  />

                  <Select
                    label="Evento"
                    placeholder="Selecciona un evento"
                    selectedKeys={selectedEventKey ? [selectedEventKey] : []}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0];
                      setSelectedEventKey(selected ? String(selected) : "");
                      setSelectedCategoryKeys(new Set());
                      setHasInitializedCategories(false);
                    }}
                    isLoading={eventsQuery.isLoading}
                    isRequired
                  >
                    {events.map((eventOption) => (
                      <SelectItem key={String(eventOption.id)}>
                        {eventOption.name}
                      </SelectItem>
                    ))}
                  </Select>

                  {/* FIX 1: renderValue collapses the list to "Todas" when all are selected */}
                  <Select
                    label="Categorías"
                    placeholder={
                      categories.length > 0
                        ? "Selecciona una o más categorías"
                        : "Sin categorías disponibles"
                    }
                    selectionMode="multiple"
                    selectedKeys={selectedCategoryKeys}
                    onSelectionChange={handleCategorySelectionChange}
                    isDisabled={!selectedEventKey || categories.length === 0}
                    isLoading={!!selectedEventKey && categoriesQuery.isLoading}
                    renderValue={categoryRenderValue}
                  >
                    {categories.length > 0 ? (
                      [
                        <SelectItem key={ALL_CATEGORIES_KEY}>Todas</SelectItem>,
                        ...categories.map((category) => (
                          <SelectItem key={String(category.id)}>
                            {category.code}
                          </SelectItem>
                        )),
                      ]
                    ) : (
                      <SelectItem key="no-categories" isDisabled>
                        No hay categorías configuradas
                      </SelectItem>
                    )}
                  </Select>

                  {/* FIX 2: show component selector whenever there are components available,
                      not only when requireComponentSelection is true.
                      If fixedComponent is set and not editing, show readonly input instead. */}
                  {fixedComponent && !isEditing ? (
                    <Input
                      label="Componente"
                      value={fixedComponent.name}
                      isReadOnly
                    />
                  ) : needsComponent ? (
                    <Select
                      label="Componente"
                      placeholder="Selecciona un componente"
                      selectedKeys={
                        selectedComponentKey ? [selectedComponentKey] : []
                      }
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0];
                        setSelectedComponentKey(
                          selected ? String(selected) : "",
                        );
                      }}
                      isRequired={requireComponentSelection}
                    >
                      {componentOptions.map((component) => (
                        <SelectItem key={String(component.id)}>
                          {component.name}
                        </SelectItem>
                      ))}
                    </Select>
                  ) : null}

                  <Textarea
                    name="description"
                    label="Descripción"
                    placeholder="Descripción breve del criterio"
                    defaultValue={criterionToEdit?.description ?? ""}
                  />
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-default-600">Peso (sobre el total del evento)</span>
                      <span className="font-semibold text-default-800">{weightPercent}%</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={1}
                        value={weightPercent}
                        onChange={(event) => setWeightPercent(Number(event.target.value))}
                        className="w-full accent-primary"
                        aria-label="Peso del criterio"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={weightPercent}
                      />
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step={1}
                        value={String(weightPercent)}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        onChange={(e: any) => {
                          const next = e.target.value;
                          if (/^-?\d*$/.test(next)) {
                            setWeightPercent(next === "" ? 0 : Number(next));
                          }
                        }}
                        onBlur={() => {
                          if (!Number.isFinite(Number(weightPercent))) return setWeightPercent(0);
                          if (weightPercent < 0) setWeightPercent(0);
                          if (weightPercent > 100) setWeightPercent(100);
                        }}
                        className="w-20"
                      />
                    </div>
                    <p className="text-xs text-default-500">Rango permitido: 0% a 100%.</p>
                    {typeof availableWeightPercent === "number" && (
                      <p className="text-xs text-default-500">Disponible: {availableWeightPercent.toFixed(0)}%</p>
                    )}
                    {weightError && (
                      <p className="text-xs text-danger">{weightError}</p>
                    )}
                  </div>
                </div>
              </ModalBody>

              <ModalFooter>
                <Button
                  color="danger"
                  variant="flat"
                  onPress={closeModal}
                  isDisabled={isPending}
                >
                  Cancelar
                </Button>
                <Button type="submit" color="primary" isLoading={isPending} isDisabled={isPending || !!weightError}>
                  {isEditing ? "Guardar cambios" : "Crear criterio"}
                </Button>
              </ModalFooter>
            </Form>
          )}
        </ModalContent>
      </Modal>

    </>
  );
};