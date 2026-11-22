"use client";

import { Can } from "@/components/auth/can";
import { PERMISSIONS } from "@/lib/authorization";
import { Plus } from "lucide-react";
import { useState } from "react";

import {
  createCategoryInputSchema,
  useCreateCategory,
} from "../api/create-category";

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
import { Select, SelectItem } from "@/components/ui/select";
import { useEvents } from "@/features/events/api/get-events";
import { Input } from "@/components/ui/input";

const CreateCategoryContent = () => {
  const { addNotification } = useNotifications();
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [selectedEvent, setSelectedEvent] = useState<string>("");

  const createCategoryMutation = useCreateCategory({
    mutationConfig: {
      onSuccess: () => {
        addNotification({
          type: "success",
          title: "Categoría creada",
        });
        setSelectedEvent("");
        onClose();
      },
    },
  });

  const eventsQuery = useEvents({ page: 1 });

  const events = eventsQuery.data?.data || [];

  return (
    <>
      <Button size="sm" onPress={() => onOpen()}>
        <Plus size={16} />
        Crear categoría
      </Button>
      <Modal isOpen={isOpen} size="2xl" onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <Form
              id="create-category"
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const formData = new FormData(form);

                const rawData = Object.fromEntries(formData);

                // Validar que se haya seleccionado un evento
                if (!selectedEvent) {
                  addNotification({
                    type: "error",
                    title: "Evento requerido",
                    message:
                      "Debes seleccionar un evento antes de crear una categoría",
                  });

                  return;
                }

                const data = {
                  code: rawData.code as string,
                  description: rawData.description as string,
                  eventId: Number(selectedEvent),
                  status: "active" as const,
                };

                if (Number.isNaN(data.eventId)) {
                  addNotification({
                    type: "error",
                    title: "Evento inválido",
                    message:
                      "El ID del evento seleccionado no es válido. Intenta recargar la página.",
                  });

                  return;
                }

                const values = await createCategoryInputSchema.parseAsync(data);

                await createCategoryMutation.mutateAsync({ data: values });
              }}
            >
              <ModalHeader className="flex flex-col gap-1">
                Crear nueva categoría
                <p className="text-sm font-normal text-gray-500">
                  Agrega una nueva categoría a un evento
                </p>
              </ModalHeader>
              <ModalBody className="space-y-4 w-full">
                <Select
                  isRequired
                  isLoading={eventsQuery.isLoading}
                  label="Evento"
                  placeholder="Selecciona un evento"
                  selectedKeys={selectedEvent ? [selectedEvent] : []}
                  onSelectionChange={(keys) => {
                    const keysArray = Array.from(keys);

                    setSelectedEvent((keysArray[0] as string) || "");
                  }}
                >
                  {events.map((event) => (
                    <SelectItem key={event.id}>{event.name}</SelectItem>
                  ))}
                </Select>

                <Input
                  isRequired
                  label="Nombre de la categoría"
                  name="code"
                  placeholder="ej: Dpto. Ingeniería de Sistemas"
                />

                <Textarea
                  isRequired
                  label="Descripción"
                  name="description"
                  placeholder="Breve descripción de la categoría"
                />
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="flat" onPress={onClose}>
                  Cancelar
                </Button>
                <Button
                  color="primary"
                  disabled={createCategoryMutation.isPending}
                  isLoading={createCategoryMutation.isPending}
                  type="submit"
                >
                  Crear categoría
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
export const CreateCategory = () => (
  <Can permission={PERMISSIONS.createEventMembers}>
    <CreateCategoryContent />
  </Can>
);
