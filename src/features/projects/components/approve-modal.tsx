import { Button } from "@/components/ui/button";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/modal";
import { useDisclosure } from "@/hooks/use-disclosure";
import { useNotifications } from "@/components/ui/notifications";
import { useApproveProject } from "../api/approve-project";

export const ApproveProjectModal = ({ projectId }: { projectId: number }) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { addNotification } = useNotifications();
  const approveMutation = useApproveProject();

  return (
    <>
      <Button size="sm" color="warning" onPress={onOpen} className="bg-transparent border border-[#ffffff30] py-5 text-white hover:bg-emerald-500/40">
        Aprobar
      </Button>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="md">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Confirmar Aprobación</ModalHeader>
              <ModalBody>¿Seguro que deseas aprobar este proyecto?</ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancelar
                </Button>
                <Button
                  color="primary"
                  isLoading={approveMutation.isPending}
                  onPress={() =>
                    approveMutation.mutate(projectId, {
                      onSuccess: (res) => {
                        addNotification({ type: "success", title: "Proyecto aprobado", message: res.message });
                        onClose();
                      },
                      onError: () => {
                        addNotification({ type: "error", title: "Error", message: "No se pudo aprobar el proyecto" });
                      },
                    })
                  }
                >
                  Aprobar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};