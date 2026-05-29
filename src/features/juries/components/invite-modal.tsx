"use client";

import { Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
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
import { canInviteJury } from "@/lib/authorization";
import {
  createJuryInvitationInputSchema,
  useCreateJuryInvitation,
} from "../api/create-jury";
import { Input } from "@/components/ui/input";
import { Select, SelectItem } from "@/components/ui/select";
import { useEventsDropdown } from "@/features/events/api/get-events-dropdown";
import { toEventTypeLabel } from "@/features/events/utils/event-enums";

export const InviteModal = () => {
  const { addNotification } = useNotifications();
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [selectedEventKey, setSelectedEventKey] = useState<string>("");
  const queryClient = useQueryClient();

  const eventsQuery = useEventsDropdown();
  const events = eventsQuery.data?.data || [];

  const createJuryInvitationMutation = useCreateJuryInvitation({
    mutationConfig: {
      onSuccess: async () => {
        addNotification({
          type: "success",
          title: "Jurado invitado exitosamente",
        });
        await queryClient.invalidateQueries({ queryKey: ["jury-invitations"] });
        setSelectedEventKey("");
        onClose();
      },
      onError: (error) => {
        addNotification({
          type: "error",
          title: "Error al invitar jurado",
          message: error.message,
        });
      },
    },
  });

  useEffect(() => {
    if (!isOpen) {
      setSelectedEventKey("");
    }
  }, [isOpen]);

  const user = useUser();
  if (!canInviteJury(user?.data)) return null;

  return (
    <>
      <Button onPress={onOpen} color="primary" className="h-full">
        <Plus size={16} />
        Invitar Jurado
      </Button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
        <ModalContent>
          {(onClose) => (
            <Form
              id="invite-jurors"
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const formData = new FormData(form);
                const rawData = Object.fromEntries(formData);

                if (!selectedEventKey) {
                  addNotification({
                    type: "error",
                    title: "Error",
                    message: "Por favor selecciona un evento",
                  });
                  return;
                }

                const selectedEvent = events.find(
                  (event) => String(event.id) === selectedEventKey
                );

                if (!selectedEvent) {
                  addNotification({
                    type: "error",
                    title: "Error",
                    message: "No se pudo determinar el evento seleccionado",
                  });
                  return;
                }

                const data = {
                  email: rawData.email as string,
                  firstName: rawData.firstName as string,
                  lastName: rawData.lastName as string,
                  eventId: Number(selectedEventKey),
                  eventType: toEventTypeLabel(selectedEvent.eventType),
                };

                try {
                  const values =
                    await createJuryInvitationInputSchema.parseAsync(data);
                  await createJuryInvitationMutation.mutateAsync({
                    data: values,
                  });
                } catch (error: any) {
                  addNotification({
                    type: "error",
                    title: "Error de validación",
                    message: error.message || "Datos inválidos",
                  });
                }
              }}
            >
              <ModalHeader className="flex flex-col gap-1">
                Invitar Jurado
              </ModalHeader>
              <ModalBody className="space-y-4 w-full">
                <Input label="Correo" name="email" type="email" isRequired />
                <Input label="Nombre" name="firstName" isRequired />
                <Input label="Apellido" name="lastName" isRequired />
                <Select
                  label="Evento"
                  placeholder="Selecciona un evento"
                  selectionMode="single"
                  isRequired
                  selectedKeys={selectedEventKey ? [selectedEventKey] : []}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0];
                    setSelectedEventKey(selected ? String(selected) : "");
                  }}
                  isLoading={eventsQuery.isLoading}
                >
                  {events.map((event) => (
                    <SelectItem key={String(event.id)}>{event.name}</SelectItem>
                  ))}
                </Select>
              </ModalBody>
              <ModalFooter>
                <Button
                  type="submit"
                  isLoading={createJuryInvitationMutation.isPending}
                  disabled={
                    createJuryInvitationMutation.isPending || !selectedEventKey
                  }
                >
                  Invitar Jurado
                </Button>
              </ModalFooter>
            </Form>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};
