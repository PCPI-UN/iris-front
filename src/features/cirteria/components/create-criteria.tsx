"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/components/ui/modal";
import { useDisclosure } from "@/hooks/use-disclosure";
import { useNotifications } from "@/components/ui/notifications";
import { useUser } from "@/lib/auth";
import { Select, SelectItem } from "@/components/ui/select";
import { useEventsDropdown } from "@/features/events/api/get-events-dropdown";
import { useCategories } from "@/features/courses/api/get-courses";

import {
  createCriteriaInputSchema,
  useCreateCriteria,
} from "../api/create-criteria";
import { Input } from "@/components/ui/input";

export const CreateCriteria = () => {
  const { addNotification } = useNotifications();
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [selectedEventKey, setSelectedEventKey] = useState<string>("");
  const [selectedCategoryKeys, setSelectedCategoryKeys] = useState<Set<string>>(
    new Set()
  );
  const user = useUser();

  const createCriteriaMutation = useCreateCriteria({
    mutationConfig: {
      onSuccess: () => {
        addNotification({
          type: "success",
          title: "Criterio Creado",
          message: "El criterio de evaluación ha sido creado exitosamente.",
        });
        setSelectedEventKey("");
        setSelectedCategoryKeys(new Set());
        onClose();
      },
      onError: (error: any) => {
        addNotification({
          type: "error",
          title: "Error",
          message: error?.message || "Error al crear el criterio",
        });
      },
    },
  });

  const eventsQuery = useEventsDropdown();
  const events = eventsQuery.data?.data ?? [];
  const categoriesQuery = useCategories({
    page: 1,
    eventId: selectedEventKey ? Number(selectedEventKey) : undefined,
    queryConfig: { enabled: !!selectedEventKey },
  });
  const categories = categoriesQuery.data?.data ?? [];

  return (
    <>
      <Button size="sm" onPress={() => onOpen()}>
        <Plus size={16} />
        Crear Criterio
      </Button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
        <ModalContent>
          {(onClose) => (
            <Form
              id="create-criteria"
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const formData = new FormData(form);

                const rawData = Object.fromEntries(formData);

                if (!selectedEventKey) {
                  addNotification({
                    type: "error",
                    title: "Error de validación",
                    message: "Por favor selecciona un evento",
                  });
                  return;
                }

                if (selectedCategoryKeys.size === 0) {
                  addNotification({
                    type: "error",
                    title: "Error de validación",
                    message: "Por favor selecciona al menos una categoría",
                  });
                  return;
                }

                const data = {
                  eventId: Number(selectedEventKey),
                  name: rawData.name as string,
                  description: rawData.description as string,
                  weight: Number(rawData.weight),
                  categoryIds: Array.from(selectedCategoryKeys).map(Number),
                };

                try {
                  const values =
                    await createCriteriaInputSchema.parseAsync(data);
                  await createCriteriaMutation.mutateAsync({ data: values });
                } catch (error: any) {
                  addNotification({
                    type: "error",
                    title: "Error de validación",
                    message: error?.message || "Datos inválidos",
                  });
                }
              }}
            >
              <ModalHeader className="flex flex-col gap-1">
                Crear nuevo criterio
                <p className="text-sm font-normal text-gray-500">
                  Agrega un nuevo criterio de evaluación
                </p>
              </ModalHeader>
              <ModalBody className="space-y-4 w-full">
                <Select
                  label="Evento"
                  placeholder="Selecciona un evento"
                  selectedKeys={selectedEventKey ? [selectedEventKey] : []}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0];
                    setSelectedEventKey(selected ? String(selected) : "");
                    setSelectedCategoryKeys(new Set());
                  }}
                  isRequired
                  isLoading={eventsQuery.isLoading}
                >
                  {events.map((event) => (
                    <SelectItem key={String(event.id)}>{event.name}</SelectItem>
                  ))}
                </Select>

                <Select
                  label="Categorías"
                  placeholder={
                    selectedEventKey
                      ? "Selecciona una o más categorías"
                      : "Selecciona un evento primero"
                  }
                  selectionMode="multiple"
                  selectedKeys={selectedCategoryKeys}
                  onSelectionChange={(keys) => {
                    const stringSet = new Set(Array.from(keys).map(String));
                    setSelectedCategoryKeys(stringSet);
                  }}
                  isDisabled={!selectedEventKey}
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
                      {selectedEventKey
                        ? "No hay categorías"
                        : "Selecciona un evento primero"}
                    </SelectItem>
                  )}
                </Select>
                <Input
                  label="Nombre"
                  name="name"
                  placeholder="ej: Calidad Técnica"
                  isRequired
                />

                <Textarea
                  label="Descripción"
                  name="description"
                  placeholder="Breve descripción del criterio"
                  isRequired
                />

                <Input
                  type="number"
                  label="Peso"
                  name="weight"
                  placeholder="0.0"
                  min="0"
                  max="1"
                  step="0.01"
                  isRequired
                  description="Peso de este criterio en la evaluación (ej: 0.25 para 25%)"
                />
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="flat" onPress={onClose}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  color="primary"
                  isLoading={createCriteriaMutation.isPending}
                  disabled={
                    createCriteriaMutation.isPending ||
                    !selectedEventKey ||
                    selectedCategoryKeys.size === 0
                  }
                >
                  Crear Criterio
                </Button>
              </ModalFooter>
            </Form>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};
