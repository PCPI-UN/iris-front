"use client";

import { Trash } from "lucide-react";

import { useDeleteProject } from "../api/delete-project";

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
import { canDeleteProject } from "@/lib/authorization";
import { useDisclosure } from "@/hooks/use-disclosure";

type DeleteProjectProps = {
  id: string;
};

export const DeleteProject = ({ id }: DeleteProjectProps) => {
  const user = useUser();
  const { addNotification } = useNotifications();
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const deleteProjectMutation = useDeleteProject({
    mutationConfig: {
      onSuccess: () => {
        addNotification({
          type: "success",
          title: "Proyecto eliminado",
        });
        onClose();
      },
    },
  });

  if (!canDeleteProject(user?.data)) {
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
        Eliminar proyecto
      </Button>
      <Modal isOpen={isOpen} size="2xl" onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h2 className="text-lg font-bold">Eliminar proyecto</h2>
              </ModalHeader>
              <ModalBody>
                <p className="text-sm text-gray-500">
                  ¿Estás seguro de que deseas eliminar este proyecto? Esta
                  acción no se puede deshacer.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancelar
                </Button>
                <Button
                  color="primary"
                  isLoading={deleteProjectMutation.isPending}
                  startContent={<Trash className="size-4" />}
                  onPress={() =>
                    deleteProjectMutation.mutate({ projectId: id })
                  }
                >
                  Eliminar proyecto
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};
