"use client";

import { Button } from "@/components/ui/button";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { useDisclosure } from "@/hooks/use-disclosure";
import { useNotifications } from "@/components/ui/notifications";
import { useState } from "react";
import { useRequestChangesProject } from "../api/request-changes-project";

export const RequestProjectModal = ({ projectId, isOpenTable, onOpenChangeTable }: { projectId: number, isOpenTable?: boolean; onOpenChangeTable?: (open: boolean) => void; }) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { addNotification } = useNotifications();
  const requestChangeMutation = useRequestChangesProject();
  const [reason, setReason] = useState("");
  const controlled = isOpenTable !== undefined;

  const handleOpenChange = (open: boolean) => {
  if (!open) {
    setReason("");
  }

  if (controlled) {
    onOpenChangeTable?.(open);
  } else {
    onOpenChange();
  }
};

  return (
    <>
      {
        !controlled && (
          <Button size="sm" color="warning" onPress={onOpen} className="bg-transparent border border-[#ffffff30] py-5 text-white hover:bg-yellow-500/40">
            Pedir cambios
          </Button>
        )
      }
      <Modal isOpen={controlled ? isOpenTable : isOpen} onOpenChange={handleOpenChange} size="md">
        <ModalContent>
          {(onCloseModal) => (
            <>
              <ModalHeader>Solicitar cambios</ModalHeader>
              <ModalBody className="space-y-2">
                <p>Indica qué debe corregir el equipo:</p>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Describe los cambios requeridos..."
                  isDisabled={requestChangeMutation.isPending}
                  rows={4}
                />
              </ModalBody>
              <ModalFooter className="space-x-2">
                <Button variant="light" onPress={() => {setReason(""); onCloseModal()}}>
                  Cancelar
                </Button>
                <Button
                  color="warning"
                  isLoading = { requestChangeMutation.isPending }
                  isDisabled = { requestChangeMutation.isPending }
                  onPress={() => {
                    if (!reason.trim()) {
                      addNotification({
                        type: "error",
                        title: "Error",
                        message: "Debes ingresar un comentario",
                      });
                      return;
                    }
                    requestChangeMutation.mutate(
                      { projectId, reason },
                      {
                        onSuccess: (res) => {
                          addNotification({
                            type: "success",
                            title: "Cambios requeridos",
                          });
                          setReason("");
                          onCloseModal();
                        },
                        onError: () => {
                          addNotification({
                            type: "error",
                            title: "Error",
                            message: "Error al solicitar cambios",
                          });
                        },
                      }
                    );
                  }}
                >
                  Requerir cambios
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      
    </>
  );
};
