"use client";

import { Trash } from "lucide-react";

import { useDeleteEvent } from "../api/delete-event";

import { Button } from "@/components/ui/button";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/components/ui/modal";
import { useNotifications } from "@/components/ui/notifications";
import { useUser } from "@/lib/auth";
import { canDeleteEvent } from "@/lib/authorization";
import { useDisclosure } from "@/hooks/use-disclosure";

type DeleteEventProps = {
  id: number;
};

export const DeleteEvent = ({ id }: DeleteEventProps) => {
  const user = useUser();
  const { addNotification } = useNotifications();
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const deleteEventMutation = useDeleteEvent({
    mutationConfig: {
      onSuccess: () => {
        addNotification({
          type: "success",
          title: "Evento eliminado",
        });
        onClose();
      },
    },
  });

  if (!canDeleteEvent(user?.data)) {
    return null;
  }

  return (
    <>
      <Button
        className="w-full"
        color="danger"
        size="sm"
        variant="shadow"
        onPress={() => onOpen()}
      >
        <Trash size={16} />
        Eliminar evento
      </Button>
      <Modal isOpen={isOpen} size="2xl" onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h2 className="text-lg font-bold">Eliminar evento</h2>
              </ModalHeader>
              <ModalBody>
                <p className="text-sm text-gray-500">
                  ¿Estás seguro de que deseas eliminar este evento? Esta acción
                  no se puede deshacer.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancelar
                </Button>
                <Button
                  color="primary"
                  isLoading={deleteEventMutation.isPending}
                  startContent={<Trash className="size-4" />}
                  onPress={() => deleteEventMutation.mutate({ eventId: id })}
                >
                  Eliminar evento
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};
