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
  createComponentInputSchema,
  useCreateComponent,
} from "../api/create-component";
import {
  updateCriteriaInputSchema,
  useUpdateCriteria,
} from "../api/update-criteria";

const ALL_CATEGORIES_KEY = "__all_categories__";
const ADD_COMPONENT_KEY = "__add_component__";

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
}: CreateCriteriaContextualProps) => {
  const { addNotification } = useNotifications();
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const isEditing = !!criterionToEdit;
  const [isComponentFormOpen, setIsComponentFormOpen] = useState(false);
  const [componentWeightPercent, setComponentWeightPercent] = useState(25);
  const [localComponents, setLocalComponents] = useState<CriterionComponent[]>(
    [],
  );

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
    criterionToEdit
      ? Math.round(Number(criterionToEdit.weight || 0) * 100)
      : 25,
  );
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
    setWeightPercent(
      criterionToEdit
        ? Math.round(Number(criterionToEdit.weight || 0) * 100)
        : 25,
    );
    setHasInitializedCategories(false);
  }, [criterionToEdit, defaultEventId, fixedComponent, isOpen]);

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
  const createComponentMutation = useCreateComponent({
    mutationConfig: {
      onSuccess: (componentResponse: any) => {
        const component = componentResponse?.data ?? componentResponse;
        const parsedId = Number(component?.id);
        const normalizedComponent: CriterionComponent | null =
          Number.isFinite(parsedId) && parsedId > 0
            ? {
                id: parsedId,
                name: String(component?.name ?? "").trim(),
                description: component?.description,
                weight: Number(component?.weight ?? 0),
              }
            : null;

        if (normalizedComponent) {
          setLocalComponents((previous) => {
            const withoutSame = previous.filter(
              (item) => item.id !== normalizedComponent.id,
            );
            return [...withoutSame, normalizedComponent];
          });
          setSelectedComponentKey(String(normalizedComponent.id));
          onComponentCreated?.(normalizedComponent);
        }

        addNotification({
          type: "success",
          title: "Componente creado",
          message: "El componente fue creado y quedó seleccionado.",
        });
        setComponentWeightPercent(25);
        setIsComponentFormOpen(false);
      },
      onError: (error: any) => {
        addNotification({
          type: "error",
          title: "Error",
          message: error?.message || "No se pudo crear el componente.",
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

  const componentOptions = useMemo(() => {
    const map = new Map<number, CriterionComponent>();
    availableComponents.forEach((component) =>
      map.set(component.id, component),
    );
    localComponents.forEach((component) => map.set(component.id, component));
    return Array.from(map.values()).sort((left, right) =>
      left.name.localeCompare(right.name),
    );
  }, [availableComponents, localComponents]);

  const componentSelectOptions = useMemo(
    () => [
      ...componentOptions.map((component) => ({
        key: String(component.id),
        label: component.name,
      })),
      {
        key: ADD_COMPONENT_KEY,
        label: "➕ Añadir nuevo componente",
      },
    ],
    [componentOptions],
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
  // (either passed in or created locally in this session), or when explicitly required.
  const hasComponentOptions = componentOptions.length > 0;
  const needsComponent =
    requireComponentSelection ||
    hasComponentOptions ||
    (!!fixedComponent && !isEditing);

  const isPending =
    createCriteriaMutation.isPending ||
    updateCriteriaMutation.isPending ||
    createComponentMutation.isPending;

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

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
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

                const payload = {
                  eventId: Number(selectedEventKey),
                  name: String(rawData.name || "").trim(),
                  description: String(rawData.description || "").trim(),
                  weight: Number(weightPercent) / 100,
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

              <ModalBody className="space-y-4">
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
                      if (selected === ADD_COMPONENT_KEY) {
                        setIsComponentFormOpen(true);
                        return;
                      }
                      setSelectedComponentKey(
                        selected ? String(selected) : "",
                      );
                    }}
                    isRequired={requireComponentSelection}
                  >
                    {componentSelectOptions.map((component) => (
                      <SelectItem key={component.key}>
                        {component.label}
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

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-default-600">Peso</span>
                    <span className="font-semibold text-default-800">
                      {weightPercent}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={100}
                    step={5}
                    value={weightPercent}
                    onChange={(event) =>
                      setWeightPercent(Number(event.target.value))
                    }
                    className="w-full accent-primary"
                  />
                  <p className="text-xs text-default-500">
                    Este peso aplica al criterio dentro de la evaluación.
                  </p>
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
                <Button type="submit" color="primary" isLoading={isPending}>
                  {isEditing ? "Guardar cambios" : "Crear criterio"}
                </Button>
              </ModalFooter>
            </Form>
          )}
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isComponentFormOpen}
        onOpenChange={setIsComponentFormOpen}
        size="xl"
      >
        <ModalContent>
          {(closeComponentForm) => (
            <Form
              id="create-component-from-criteria"
              onSubmit={async (event) => {
                event.preventDefault();
                const form = event.target as HTMLFormElement;
                const formData = new FormData(form);
                const rawData = Object.fromEntries(formData);
                const payload = {
                  name: String(rawData.name || "").trim(),
                  description: String(rawData.description || "").trim(),
                  weight: Number(componentWeightPercent) / 100,
                };

                try {
                  const values =
                    await createComponentInputSchema.parseAsync(payload);
                  await createComponentMutation.mutateAsync({ data: values });
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
                Añadir nuevo componente
                <p className="text-sm font-normal text-default-500">
                  Al guardarlo quedará seleccionado para este criterio.
                </p>
              </ModalHeader>
              <ModalBody className="space-y-4">
                <Input
                  name="name"
                  label="Nombre"
                  placeholder="Ej: Innovación"
                  isRequired
                />
                <Textarea
                  name="description"
                  label="Descripción"
                  placeholder="Descripción breve (opcional)"
                />
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-default-600">Peso</span>
                    <span className="font-semibold text-default-800">
                      {componentWeightPercent}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={100}
                    step={5}
                    value={componentWeightPercent}
                    onChange={(event) =>
                      setComponentWeightPercent(Number(event.target.value))
                    }
                    className="w-full accent-primary"
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="flat"
                  color="danger"
                  onPress={closeComponentForm}
                  isDisabled={createComponentMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  color="primary"
                  isLoading={createComponentMutation.isPending}
                >
                  Crear componente
                </Button>
              </ModalFooter>
            </Form>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};