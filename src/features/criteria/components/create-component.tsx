"use client";

import { Pencil, Plus } from "lucide-react";
import { useEffect, useState } from "react";

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
import { useEventsDropdown } from "@/features/events/api/get-events-dropdown";
import { useDisclosure } from "@/hooks/use-disclosure";
import { CriterionComponent } from "@/types/api";

import {
  createComponentInputSchema,
  useCreateComponent,
} from "../api/create-component";
import {
  updateComponentInputSchema,
  useUpdateComponent,
} from "../api/update-component";

type CreateComponentProps = {
  onCreated?: (component: CriterionComponent) => void;
  onUpdated?: (component: CriterionComponent) => void;
  componentToEdit?: CriterionComponent;
  isDisabled?: boolean;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  hideTrigger?: boolean;
  eventId?: number;
};

export const CreateComponent = ({
  onCreated,
  onUpdated,
  componentToEdit,
  isDisabled = false,
  isOpen: isOpenProp,
  onOpenChange,
  hideTrigger = false,
  eventId,
}: CreateComponentProps) => {
  const { addNotification } = useNotifications();
  const disclosure = useDisclosure();
  const isEditing = !!componentToEdit;
  const isControlled = typeof isOpenProp === "boolean";
  const isOpen = isControlled ? isOpenProp : disclosure.isOpen;
  const openModal = isControlled
    ? () => onOpenChange?.(true)
    : disclosure.onOpen;
  const closeModal = isControlled
    ? () => onOpenChange?.(false)
    : disclosure.onClose;
  const handleOpenChange = isControlled
    ? (nextOpen: boolean) => onOpenChange?.(nextOpen)
    : disclosure.onOpenChange;
  const [selectedEventKey, setSelectedEventKey] = useState<string>(
    componentToEdit?.eventId
      ? String(componentToEdit.eventId)
      : eventId
        ? String(eventId)
        : "",
  );
  const eventsQuery = useEventsDropdown();
  const events = eventsQuery.data?.data ?? [];
 

  useEffect(() => {
    if (!isOpen) return;
    setSelectedEventKey(
      componentToEdit?.eventId
        ? String(componentToEdit.eventId)
        : eventId
          ? String(eventId)
          : "",
    );
  }, [componentToEdit, eventId, isOpen]);

  const normalizeComponent = (
    componentResponse: any,
  ): CriterionComponent | null => {
    const component = componentResponse?.data ?? componentResponse;
    const parsedId = Number(component?.id ?? componentToEdit?.id);

    return Number.isFinite(parsedId) && parsedId > 0
      ? {
          id: parsedId,
          name: String(component?.name ?? componentToEdit?.name ?? "").trim(),
          description: component?.description ?? componentToEdit?.description,
          weight: Number(component?.weight ?? componentToEdit?.weight ?? 0),
          eventId:
            component?.eventId ??
            componentToEdit?.eventId ??
            Number(selectedEventKey || eventId),
        }
      : null;
  };

  const createComponentMutation = useCreateComponent({
    mutationConfig: {
      onSuccess: (componentResponse: any) => {
        const normalizedComponent = normalizeComponent(componentResponse);

        addNotification({
          type: "success",
          title: "Componente creado",
          message: "El componente fue creado correctamente.",
        });

        if (normalizedComponent) {
          onCreated?.(normalizedComponent);
        }
        closeModal();
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
  const updateComponentMutation = useUpdateComponent({
    mutationConfig: {
      onSuccess: (componentResponse: any) => {
        const normalizedComponent = normalizeComponent(componentResponse);

        addNotification({
          type: "success",
          title: "Componente actualizado",
          message: "El componente fue actualizado correctamente.",
        });

        if (normalizedComponent) {
          onUpdated?.(normalizedComponent);
        }

        closeModal();
      },
      onError: (error: any) => {
        addNotification({
          type: "error",
          title: "Error",
          message: error?.message || "No se pudo actualizar el componente.",
        });
      },
    },
  });

  const isPending =
    createComponentMutation.isPending || updateComponentMutation.isPending;

  return (
    <>
      {!hideTrigger && (
        <Button
          size="sm"
          variant="flat"
          color="secondary"
          isIconOnly={isEditing}
          aria-label={isEditing ? "Editar componente" : undefined}
          onPress={openModal}
          isDisabled={isDisabled}
        >
          {isEditing ? <Pencil size={16} /> : <Plus size={16} />}
          {!isEditing && "Agregar componente"}
        </Button>
      )}

      <Modal isOpen={isOpen} onOpenChange={handleOpenChange} size="sm">
        <ModalContent>
          {(closeModal) => (
            <Form
              key={componentToEdit?.id ?? "create-component"}
              id={isEditing ? "update-component" : "create-component"}
              onSubmit={async (event) => {
                event.preventDefault();

                if (!selectedEventKey) {
                  addNotification({
                    type: "error",
                    title: "Error",
                    message: "Debes seleccionar un evento primero.",
                  });
                  return;
                }

                const form = event.target as HTMLFormElement;
                const formData = new FormData(form);
                const rawData = Object.fromEntries(formData);

                const payload = {
                  name: String(rawData.name || "").trim(),
                  // The backend requires a small positive weight for components.
                  // Send the minimal allowed weight (0.01) so creation succeeds
                  // while the UI ignores component weight for calculations.
                  weight: 0.01,
                  eventId: Number(selectedEventKey),
                };

                try {
                  if (isEditing && componentToEdit) {
                    const values =
                      await updateComponentInputSchema.parseAsync(payload);
                    await updateComponentMutation.mutateAsync({
                      componentId: componentToEdit.id,
                      data: values,
                    });
                  } else {
                    const values =
                      await createComponentInputSchema.parseAsync(payload);
                    await createComponentMutation.mutateAsync({ data: values });
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
                {isEditing ? "Editar componente" : "Crear componente"}
                <p className="text-sm font-normal text-default-500">
                  {isEditing
                    ? "Actualiza la información del componente."
                    : "Configura un componente y luego agrega criterios dentro del acordeón."}
                </p>
              </ModalHeader>

              <ModalBody className="py-2 sm:py-4">
                <div className="mx-auto flex w-full max-w-md sm:max-w-lg lg:max-w-xl flex-col gap-2">
                  <Select
                    label="Evento"
                    placeholder="Selecciona un evento"
                    selectedKeys={selectedEventKey ? [selectedEventKey] : []}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0];
                      setSelectedEventKey(selected ? String(selected) : "");
                    }}
                    isLoading={eventsQuery.isLoading}
                    isDisabled={!!eventId}
                    isRequired
                  >
                    {events.map((eventOption) => (
                      <SelectItem key={String(eventOption.id)}>
                        {eventOption.name}
                      </SelectItem>
                    ))}
                  </Select>

                  <Input
                    name="name"
                    label="Nombre"
                    placeholder="Ej: Innovación"
                    defaultValue={componentToEdit?.name ?? ""}
                    isRequired
                  />
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
                <Button
                  type="submit"
                  color="primary"
                  isLoading={isPending}
                  isDisabled={isPending}
                >
                  {isEditing ? "Guardar cambios" : "Crear componente"}
                </Button>
              </ModalFooter>
            </Form>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};
