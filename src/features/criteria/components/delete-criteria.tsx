"use client";

import { Trash } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/components/ui/modal";
import { useNotifications } from "@/components/ui/notifications";

import { useDeleteCriteria } from "../api/delete-criteria";
import { useDisclosure } from "@/hooks/use-disclosure";

type DeleteCriteriaProps = {
  criterionId: number;
  onDeleted?: () => void;
};

export const DeleteCriteria = ({
  criterionId,
  onDeleted,
}: DeleteCriteriaProps) => {
  const { addNotification } = useNotifications();
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const deleteCriteriaMutation = useDeleteCriteria({
    mutationConfig: {
      onSuccess: () => {
        addNotification({
          type: "success",
          title: "Criterio eliminado",
          message: "El criterio de evaluación fue eliminado correctamente.",
        });
        onDeleted?.();
        onClose();
      },
      onError: (error: any) => {
        addNotification({
          type: "error",
          title: "Error",
          message: error?.message || "No se pudo eliminar el criterio.",
        });
      },
    },
  });

  return (
    <>
      <Button
        variant="flat"
        size="sm"
        color="danger"
        isIconOnly
        aria-label="Eliminar criterio"
        onPress={() => onOpen()}
      >
        <Trash size={16} />
      </Button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="sm">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h2 className="text-lg font-bold">Eliminar criterio</h2>
                <p className="text-sm font-normal text-gray-500">
                  ¿Seguro que deseas eliminar este criterio? Esta acción no se
                  puede deshacer.
                </p>
              </ModalHeader>
              <ModalBody>
                <p className="text-sm text-gray-500">
                  Esto eliminará permanentemente el criterio de evaluación. Las
                  evaluaciones que lo referencien pueden verse afectadas.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancelar
                </Button>
                <Button
                  color="primary"
                  isLoading={deleteCriteriaMutation.isPending}
                  onPress={() => deleteCriteriaMutation.mutate({ criterionId })}
                  startContent={<Trash className="size-4" />}
                >
                  Eliminar criterio
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};
