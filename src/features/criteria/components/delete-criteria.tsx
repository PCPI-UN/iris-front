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
import { useUser } from "@/lib/auth";

import { useDeleteCriteria } from "../api/delete-criteria";
import { useDisclosure } from "@/hooks/use-disclosure";

type DeleteCriteriaProps = {
  criterionId: number;
};

export const DeleteCriteria = ({ criterionId }: DeleteCriteriaProps) => {
  const user = useUser();
  const { addNotification } = useNotifications();
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const deleteCriteriaMutation = useDeleteCriteria({
    mutationConfig: {
      onSuccess: () => {
        addNotification({
          type: "success",
          title: "Criteria Deleted",
          message: "The evaluation criteria has been deleted successfully.",
        });
        onClose();
      },
      onError: (error: any) => {
        addNotification({
          type: "error",
          title: "Error",
          message: error?.message || "Failed to delete criteria",
        });
      },
    },
  });

  return (
    <>
      <Button
        className="w-full"
        variant="shadow"
        size="sm"
        color="danger"
        onPress={() => onOpen()}
        startContent={<Trash size={16} />}
      >
        Delete
      </Button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h2 className="text-lg font-bold">Delete Criteria</h2>
                <p className="text-sm font-normal text-gray-500">
                  Are you sure you want to delete this criteria? This action
                  cannot be undone.
                </p>
              </ModalHeader>
              <ModalBody>
                <p className="text-sm text-gray-500">
                  This will permanently delete the evaluation criteria. Any
                  evaluations that reference this criteria may be affected.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  color="primary"
                  isLoading={deleteCriteriaMutation.isPending}
                  onPress={() => deleteCriteriaMutation.mutate({ criterionId })}
                  startContent={<Trash className="size-4" />}
                >
                  Delete Criteria
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};
