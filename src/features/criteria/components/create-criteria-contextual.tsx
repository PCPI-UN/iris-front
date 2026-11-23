"use client";

import type { ComponentProps } from "react";
import { Can } from "@/components/auth/can";
import { PERMISSIONS } from "@/lib/authorization";
import { Pencil, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ZodError } from "zod";

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
import {
  DEFAULT_RELATIVE_WEIGHT,
  parseRelativeWeight,
} from "../utils/criterion-weights";

const ALL_CATEGORIES_KEY = "__all_categories__";
const NO_LOCKED_CATEGORIES: number[] = [];
const CRITERION_NAME_MAX_LENGTH = 100;

type CreateCriteriaContextualProps = {
  defaultEventId?: string;
  /** Component the new criterion is created in; criteria are only created from their component */
  fixedComponent?: CriterionComponent;
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
  /** Categories of the event with evaluations: they cannot be added to or removed from a criterion */
  lockedCategoryIds?: number[];
  onCreated?: () => void;
  onUpdated?: () => void;
};

const toKeySet = (values: number[] | undefined) =>
  new Set((values ?? []).map((value) => String(value)));

const initialWeightInput = (criterion?: Criterion) =>
  String(criterion ? Number(criterion.weight) : DEFAULT_RELATIVE_WEIGHT);

const CreateCriteriaContextualContent = ({
  defaultEventId,
  fixedComponent,
  buttonLabel = "Agregar criterio",
  buttonVariant = "solid",
  buttonColor = "primary",
  buttonSize = "sm",
  buttonDisabled = false,
  criterionToEdit,
  lockedCategoryIds = NO_LOCKED_CATEGORIES,
  onCreated,
  onUpdated,
}: CreateCriteriaContextualProps) => {
  const { addNotification } = useNotifications();
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const isEditing = !!criterionToEdit;
  const lockedCategoryKeys = useMemo(
    () => new Set(lockedCategoryIds.map(String)),
    [lockedCategoryIds],
  );
  // A criterion of a category with evaluations only accepts changes of name and description
  const isCriterionLocked =
    isEditing &&
    (criterionToEdit.categoryIds ?? []).some((categoryId) =>
      lockedCategoryKeys.has(String(categoryId)),
    );
  // A criterion keeps its component: loose criteria are assigned from the list
  const component = isEditing ? criterionToEdit.component : fixedComponent;

  const [selectedEventKey, setSelectedEventKey] = useState<string>(
    criterionToEdit?.eventId
      ? String(criterionToEdit.eventId)
      : defaultEventId || "",
  );
  const [selectedCategoryKeys, setSelectedCategoryKeys] = useState<Set<string>>(
    toKeySet(criterionToEdit?.categoryIds),
  );
  const [weightInput, setWeightInput] = useState<string>(
    initialWeightInput(criterionToEdit),
  );
  const [nameLength, setNameLength] = useState(
    criterionToEdit?.name.length ?? 0,
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
    setSelectedCategoryKeys(toKeySet(criterionToEdit?.categoryIds));
    setWeightInput(initialWeightInput(criterionToEdit));
    setNameLength(criterionToEdit?.name.length ?? 0);
    setHasInitializedCategories(false);
  }, [criterionToEdit, defaultEventId, isOpen]);

  const weight = parseRelativeWeight(weightInput);
  const weightError =
    weight === null ? "El peso debe ser un número mayor que 0." : null;

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

  useEffect(() => {
    if (!isOpen || hasInitializedCategories || categories.length === 0) return;

    if (isEditing && criterionToEdit?.categoryIds?.length) {
      const criterionCategoryKeys = toKeySet(criterionToEdit.categoryIds);
      if (criterionCategoryKeys.size === categories.length) {
        criterionCategoryKeys.add(ALL_CATEGORIES_KEY);
      }
      setSelectedCategoryKeys(criterionCategoryKeys);
    } else {
      // A new criterion starts with no category: the admin picks the ones it applies to
      setSelectedCategoryKeys(new Set());
    }

    setHasInitializedCategories(true);
  }, [
    categories,
    criterionToEdit,
    hasInitializedCategories,
    isEditing,
    isOpen,
    lockedCategoryKeys,
  ]);

  const isPending =
    createCriteriaMutation.isPending || updateCriteriaMutation.isPending;

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
        isIconOnly={isEditing}
        aria-label={isEditing ? "Editar criterio" : undefined}
        onPress={onOpen}
        isDisabled={buttonDisabled}
      >
        {isEditing ? <Pencil size={16} /> : <Plus size={16} />}
        {!isEditing && buttonLabel}
      </Button>

      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="sm"
        scrollBehavior="inside"
        classNames={{
          base: "mx-3 my-4 max-h-[88dvh] sm:mx-0 sm:my-0 sm:max-h-none",
          body: "max-h-[60dvh] overflow-y-auto px-4 sm:max-h-none sm:overflow-visible sm:px-6",
        }}
      >
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
                const rawName = String(rawData.name || "");

                if (rawName.length > CRITERION_NAME_MAX_LENGTH) {
                  addNotification({
                    type: "error",
                    title: "Nombre muy largo",
                    message: `El nombre del criterio no puede superar ${CRITERION_NAME_MAX_LENGTH} caracteres.`,
                  });
                  return;
                }

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

                if (!isEditing && !fixedComponent) {
                  addNotification({
                    type: "error",
                    title: "Componente requerido",
                    message: "Crea el criterio desde su componente.",
                  });

                  return;
                }

                if (weight === null) return;

                const categoryIds = Array.from(selectedCategoryKeys)
                  .map((categoryId) => Number(categoryId))
                  .filter((categoryId) => Number.isFinite(categoryId));

                if (categoryIds.length === 0) {
                  addNotification({
                    type: "error",
                    title: "Categoría requerida",
                    message:
                      "Selecciona al menos una categoría para el criterio.",
                  });
                  return;
                }

                // The component of an existing criterion is not sent, so it never changes from here
                const payload = {
                  eventId: Number(selectedEventKey),
                  name: rawName.trim(),
                  description: String(rawData.description || "").trim(),
                  weight,
                  categoryIds,
                  ...(!isEditing && fixedComponent
                    ? { componentId: fixedComponent.id }
                    : {}),
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
                } catch (error) {
                  // Backend errors are already notified by onError
                  if (error instanceof ZodError) {
                    addNotification({
                      type: "error",
                      title: "Error de validación",
                      message:
                        error.issues[0]?.message ??
                        "Revisa los datos ingresados.",
                    });
                  }
                }
              }}
            >
              <ModalHeader className="px-4 pb-1 sm:px-6">
                <div className="mx-auto flex w-full max-w-sm flex-col gap-1">
                  <span>
                    {isEditing ? "Editar criterio" : "Crear criterio"}
                  </span>
                  <p className="text-sm font-normal leading-snug text-default-500">
                    {isEditing ? (
                      "Actualiza la información del criterio de evaluación."
                    ) : (
                      <>
                        Agregar
                        <br />
                        un nuevo criterio de evaluación.
                      </>
                    )}
                  </p>
                </div>
              </ModalHeader>

              <ModalBody className="py-2">
                <div className="mx-auto flex w-full max-w-sm min-w-0 flex-col gap-2.5">
                  <Textarea
                    name="name"
                    label="Nombre"
                    placeholder="Ej: Calidad técnica"
                    defaultValue={criterionToEdit?.name ?? ""}
                    maxLength={CRITERION_NAME_MAX_LENGTH}
                    minRows={2}
                    maxRows={3}
                    description={`${nameLength}/${CRITERION_NAME_MAX_LENGTH} caracteres`}
                    isInvalid={nameLength > CRITERION_NAME_MAX_LENGTH}
                    errorMessage={`Máximo ${CRITERION_NAME_MAX_LENGTH} caracteres`}
                    onChange={(event) =>
                      setNameLength(event.target.value.length)
                    }
                    classNames={{ input: "max-h-24 overflow-y-auto" }}
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
                    // The criterion belongs to the event of its component
                    isDisabled={!!component}
                    isRequired
                  >
                    {events.map((eventOption) => (
                      <SelectItem key={String(eventOption.id)}>
                        {eventOption.name}
                      </SelectItem>
                    ))}
                  </Select>

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
                    disabledKeys={[...lockedCategoryKeys]}
                    description={
                      lockedCategoryKeys.size > 0
                        ? "Las categorías con evaluaciones no se pueden agregar ni quitar."
                        : undefined
                    }
                    isDisabled={!selectedEventKey || categories.length === 0}
                    isLoading={!!selectedEventKey && categoriesQuery.isLoading}
                    renderValue={categoryRenderValue}
                  >
                    {categories.length > 0 ? (
                      [
                        // "Todas" would add or remove the categories with evaluations too
                        ...(lockedCategoryKeys.size === 0
                          ? [
                              <SelectItem key={ALL_CATEGORIES_KEY}>
                                Todas
                              </SelectItem>,
                            ]
                          : []),
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

                  <Input
                    isReadOnly
                    description={
                      component
                        ? undefined
                        : "Asígnalo a un componente desde la lista de criterios."
                    }
                    label="Componente"
                    value={component?.name ?? "Sin componente"}
                  />

                  <Textarea
                    name="description"
                    label="Descripción"
                    placeholder="Descripción breve del criterio"
                    defaultValue={criterionToEdit?.description ?? ""}
                    minRows={2}
                    maxRows={3}
                    classNames={{ input: "max-h-24 overflow-y-auto" }}
                  />
                  <Input
                    isRequired
                    description={
                      isCriterionLocked
                        ? "Una de sus categorías ya tiene evaluaciones: el peso no se puede cambiar."
                        : `Frente a los otros criterios de ${component?.name ?? "su componente"} en la misma categoría. Con 1 en todos se reparten el componente por igual.`
                    }
                    errorMessage={weightError ?? undefined}
                    inputMode="decimal"
                    isInvalid={!!weightError}
                    isReadOnly={isCriterionLocked}
                    label="Peso relativo"
                    name="weight"
                    type="text"
                    value={weightInput}
                    onValueChange={setWeightInput}
                  />
                </div>
              </ModalBody>

              <ModalFooter className="px-4 pt-2 sm:px-6">
                <Button
                  color="danger"
                  variant="flat"
                  onPress={closeModal}
                  isDisabled={isPending}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  color="primary"
                  isLoading={isPending}
                  isDisabled={
                    isPending ||
                    !!weightError ||
                    nameLength > CRITERION_NAME_MAX_LENGTH
                  }
                >
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

// Only sessions that can call the endpoint see the action
export const CreateCriteriaContextual = (
  props: ComponentProps<typeof CreateCriteriaContextualContent>,
) => (
  <Can permission={PERMISSIONS.manageEvents}>
    <CreateCriteriaContextualContent {...props} />
  </Can>
);
