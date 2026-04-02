"use client";

import { Button } from "@/components/ui/button";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { useDisclosure } from "@/hooks/use-disclosure";
import { useNotifications } from "@/components/ui/notifications";
import { useState } from "react";
import { useRejectProject } from "../api/reject-project";

export const RejectProjectModal = ({ projectId, isOpenTable, onOpenChangeTable }: { projectId: number, isOpenTable?: boolean; onOpenChangeTable?: (open: boolean) => void; }) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { addNotification } = useNotifications();
  const rejectMutation = useRejectProject();

  const [reason, setReason] = useState("");
  const controlled = isOpenTable !== undefined;

  return (
    <>
      {
        !controlled && (
          <Button size="sm" color="warning" onPress={onOpen} className="bg-transparent border border-[#ffffff30] py-5 text-white hover:bg-red-500/40">
            Rechazar
          </Button>
        )
      }
      <Modal isOpen={controlled ? isOpenTable : isOpen} onOpenChange={controlled ? onOpenChangeTable : onOpenChange} size="md">
        <ModalContent>
          {(onCloseModal) => (
            <>
              <ModalHeader>Rechazar Proyecto</ModalHeader>
              <ModalBody className="space-y-2">
                <p>Ingresa el motivo del rechazo:</p>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Escribe el motivo del rechazo aquí..."
                  rows={4}
                />
              </ModalBody>
              <ModalFooter className="space-x-2">
                <Button variant="light" onPress={onCloseModal}>
                  Cancelar
                </Button>
                <Button
                  color="danger"
                  onPress={() => {
                    if (!reason.trim()) {
                      addNotification({
                        type: "error",
                        title: "Error",
                        message: "Debes ingresar un motivo",
                      });
                      return;
                    }
                    rejectMutation.mutate(
                      { projectId, reason },
                      {
                        onSuccess: (res) => {
                          addNotification({
                            type: "success",
                            title: "Proyecto rechazado",
                            message: `Motivo: ${res.reason}`,
                          });
                          setReason("");
                          onCloseModal();
                        },
                        onError: () => {
                          addNotification({
                            type: "error",
                            title: "Error",
                            message: "No se pudo rechazar el proyecto",
                          });
                        },
                      }
                    );
                  }}
                >
                  Rechazar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};
