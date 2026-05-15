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

import { useDeleteCategory } from "../api/delete-category";
import { useDisclosure } from '@/hooks/use-disclosure';

type DeleteCategoryProps = {
  id: number;
  eventId?: number;
  totalCategoriesPerEvent: number;
};

export const DeleteCategory = ({ id, eventId, totalCategoriesPerEvent }: DeleteCategoryProps) => {
  const { addNotification } = useNotifications();
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const deleteCategoryMutation = useDeleteCategory({
    mutationConfig: {
      onSuccess: () => {
        addNotification({
          type: "success",
          title: "Category Deleted",
        });
        onClose();
      },
    },
  });


  return (
    <>
      <Button
        variant="shadow"
        className="w-full"
        size="sm"
        color="danger"
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
        Delete Category
      </Button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h2 className="text-lg font-bold">Delete Category</h2>
              </ModalHeader>
              <ModalBody>
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this category? This action cannot be undone.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  color="primary"
                  isLoading={deleteCategoryMutation.isPending}
                  onPress={() => deleteCategoryMutation.mutate({ categoryId: id })}
                  startContent={<Trash className="size-4" />}
                >
                  Delete Category
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};
