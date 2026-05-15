"use client";

import { Plus } from "lucide-react";
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
import { CriterionComponent } from "@/types/api";

import {
  createCriteriaInputSchema,
  useCreateCriteria,
} from "../api/create-criteria";

type CreateCriteriaContextualProps = {
  defaultEventId?: string;
  fixedComponent?: CriterionComponent;
  availableComponents?: CriterionComponent[];
  requireComponentSelection?: boolean;
  buttonLabel?: string;
  buttonVariant?: "solid" | "flat" | "light" | "shadow" | "ghost" | "bordered" | "faded";
  buttonColor?: "default" | "primary" | "secondary" | "success" | "warning" | "danger";
  buttonSize?: "sm" | "md" | "lg";
  buttonDisabled?: boolean;
  onCreated?: () => void;
};

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
  onCreated,
}: CreateCriteriaContextualProps) => {
  const { addNotification } = useNotifications();
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();

  const [selectedEventKey, setSelectedEventKey] = useState<string>(defaultEventId || "");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedComponentKey, setSelectedComponentKey] = useState<string>(
    fixedComponent ? String(fixedComponent.id) : ""
  );
  const [weightPercent, setWeightPercent] = useState(25);

  useEffect(() => {
    setSelectedEventKey(defaultEventId || "");
  }, [defaultEventId]);

  useEffect(() => {
    if (fixedComponent) {
      setSelectedComponentKey(String(fixedComponent.id));
    }
  }, [fixedComponent]);

  const createCriteriaMutation = useCreateCriteria({
    mutationConfig: {
      onSuccess: () => {
        addNotification({
          type: "success",
          title: "Criterio creado",
          message: "El criterio se agregó correctamente.",
        });
        onCreated?.();
        setSelectedCategory("");
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

  const eventsQuery = useEventsDropdown();
  const categoriesQuery = useCategories({
    page: 1,
    eventId: selectedEventKey ? Number(selectedEventKey) : undefined,
    queryConfig: { enabled: !!selectedEventKey },
  });

  const events = eventsQuery.data?.data ?? [];
  const categories = categoriesQuery.data?.data ?? [];

  const selectedEvent = useMemo(
    () => events.find((event) => String(event.id) === selectedEventKey),
    [events, selectedEventKey]
  );

  const resolvedComponentId = fixedComponent?.id
    ? String(fixedComponent.id)
    : selectedComponentKey;

  const needsComponent = requireComponentSelection || !!fixedComponent;

  return (
    <>
      <Button
        size={buttonSize}
        color={buttonColor}
        variant={buttonVariant}
        onPress={onOpen}
        isDisabled={buttonDisabled}
      >
        <Plus size={16} />
        {buttonLabel}
      </Button>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
        <ModalContent>
          {(closeModal) => (
            <Form
              id="create-criteria-contextual"
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

                if (needsComponent && !resolvedComponentId) {
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
                  categoryIds: selectedCategory
                    ? [Number(selectedCategory)]
                    : categories.map((category) => Number(category.id)),
                  componentId: resolvedComponentId
                    ? Number(resolvedComponentId)
                    : undefined,
                };

                try {
                  const values = await createCriteriaInputSchema.parseAsync(payload);
                  await createCriteriaMutation.mutateAsync({ data: values });
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
                Crear criterio
                <p className="text-sm font-normal text-default-500">
                  Completa la información para agregar un nuevo criterio de evaluación.
                </p>
              </ModalHeader>

              <ModalBody className="space-y-4">
                <Input
                  name="name"
                  label="Nombre"
                  placeholder="Ej: Calidad técnica"
                  isRequired
                />

                <Select
                  label="Evento"
                  placeholder="Selecciona un evento"
                  selectedKeys={selectedEventKey ? [selectedEventKey] : []}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0];
                    setSelectedEventKey(selected ? String(selected) : "");
                    setSelectedCategory("");
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

                <Select
                  label="Categoría"
                  placeholder={
                    categories.length > 0
                      ? "Selecciona una categoría"
                      : "Sin categorías disponibles"
                  }
                  selectedKeys={selectedCategory ? [selectedCategory] : []}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0];
                    setSelectedCategory(selected ? String(selected) : "");
                  }}
                  isDisabled={!selectedEventKey || categories.length === 0}
                  isLoading={!!selectedEventKey && categoriesQuery.isLoading}
                >
                  {categories.length > 0 ? (
                    categories.map((category) => (
                      <SelectItem key={String(category.id)}>
                        {category.code}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem key="no-categories" isDisabled>
                      No hay categorías configuradas
                    </SelectItem>
                  )}
                </Select>

                {fixedComponent ? (
                  <Input
                    label="Componente"
                    value={fixedComponent.name}
                    isReadOnly
                  />
                ) : (
                  needsComponent && (
                    <Select
                      label="Componente"
                      placeholder="Selecciona un componente"
                      selectedKeys={
                        selectedComponentKey ? [selectedComponentKey] : []
                      }
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0];
                        setSelectedComponentKey(selected ? String(selected) : "");
                      }}
                      isRequired
                    >
                      {availableComponents.map((component) => (
                        <SelectItem key={String(component.id)}>
                          {component.name}
                        </SelectItem>
                      ))}
                    </Select>
                  )
                )}

                <Textarea
                  name="description"
                  label="Descripción"
                  placeholder="Descripción breve del criterio"
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
                  isDisabled={createCriteriaMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  color="primary"
                  isLoading={createCriteriaMutation.isPending}
                >
                  Crear criterio
                </Button>
              </ModalFooter>
            </Form>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};
