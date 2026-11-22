"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@/components/ui/modal";
import { useNotifications } from "@/components/ui/notifications";
import { useDisclosure } from "@/hooks/use-disclosure";
import { Can } from "@/components/auth/can";
import { PERMISSIONS } from "@/lib/authorization";
import { Project } from "@/types/api";

import { useSetProjectTutors } from "../api/set-project-tutors";
import {
  toTutorsPayload,
  tutorsValueFromProject,
  TutorsValue,
} from "../utils/tutors";
import { TutorsInput } from "./tutors-input";

type EditTutorsProps = {
  project: Project;
};

/** Lets an administrator replace the tutors of a project (PUT /projects/:id/tutors) */
export const EditTutors = ({ project }: EditTutorsProps) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { addNotification } = useNotifications();
  const [value, setValue] = useState<TutorsValue>(() =>
    tutorsValueFromProject(project.tutors),
  );

  const mutation = useSetProjectTutors({
    mutationConfig: {
      onSuccess: () => {
        addNotification({
          type: "success",
          title: "Tutores actualizados",
          message: "La lista de tutores del proyecto se guardó correctamente.",
        });
        onOpenChange();
      },
      onError: (error: unknown) => {
        addNotification({
          type: "error",
          title: "No se pudieron guardar los tutores",
          message:
            (error as Error)?.message ||
            "Revise los datos e intente nuevamente.",
        });
      },
    },
  });

  const open = () => {
    setValue(tutorsValueFromProject(project.tutors));
    onOpen();
  };

  return (
    <Can permission={PERMISSIONS.manageEvents}>
      <Button
        size="sm"
        variant="bordered"
        onPress={open}
        className="border-[#ffffff30] text-white"
      >
        <Pencil className="h-3.5 w-3.5" />
        Editar tutores
      </Button>

      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Tutores del proyecto</ModalHeader>
              <ModalBody>
                <p className="text-sm text-default-500">
                  Al guardar se reemplaza la lista completa: los tutores que
                  quite dejan de estar vinculados al proyecto y conservan sus
                  roles. Si el proyecto ya está aprobado, los tutores pendientes
                  reciben su invitación al guardar.
                </p>
                <TutorsInput
                  value={value}
                  onChange={setValue}
                  isDisabled={mutation.isPending}
                />
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancelar
                </Button>
                <Button
                  color="primary"
                  isLoading={mutation.isPending}
                  onPress={() =>
                    mutation.mutate({
                      projectId: project.id,
                      data: toTutorsPayload(value),
                    })
                  }
                >
                  Guardar tutores
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </Can>
  );
};
