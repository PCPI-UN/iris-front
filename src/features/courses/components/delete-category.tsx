"use client";

import { Trash } from "lucide-react";

import { useDeleteCategory } from "../api/delete-category";

import { Button } from "@/components/ui/button";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/components/ui/modal";
import { useNotifications } from "@/components/ui/notifications";
import { useDisclosure } from "@/hooks/use-disclosure";

type DeleteCategoryProps = {
  id: number;
  eventId?: number;
  totalCategoriesPerEvent: number;
};

export const DeleteCategory = ({
  id,
  eventId,
  totalCategoriesPerEvent,
}: DeleteCategoryProps) => {
  const { addNotification } = useNotifications();
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const deleteCategoryMutation = useDeleteCategory({
    mutationConfig: {
      onSuccess: () => {
        addNotification({
          type: "success",
          title: "Categoría eliminada",
        });
        onClose();
      },
    },
  });

  return (
    <>
      <Button
        className="w-full"
        color="danger"
        size="sm"
        variant="shadow"
        onPress={() => {
          if (totalCategoriesPerEvent <= 1) {
            addNotification({
              type: "error",
              title: "No se puede eliminar",
              message: "Debe existir al menos 1 categoría por evento.",
            });

            return;
          }

          onOpen();
        }}
      >
        <Trash size={16} />
        Eliminar categoría
      </Button>
      <Modal isOpen={isOpen} size="2xl" onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h2 className="text-lg font-bold">Eliminar categoría</h2>
              </ModalHeader>
              <ModalBody>
                <p className="text-sm text-gray-500">
                  ¿Estás seguro de que deseas eliminar esta categoría? Esta
                  acción no se puede deshacer.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancelar
                </Button>
                <Button
                  color="primary"
                  isLoading={deleteCategoryMutation.isPending}
                  startContent={<Trash className="size-4" />}
                  onPress={() =>
                    deleteCategoryMutation.mutate({ categoryId: id })
                  }
                >
                  Eliminar categoría
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};
