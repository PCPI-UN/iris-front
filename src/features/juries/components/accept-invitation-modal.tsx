"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/components/ui/modal";
import { useDisclosure } from "@/hooks/use-disclosure";
import { useNotifications } from "@/components/ui/notifications";
import { useAcceptInvitation } from "../api/accept-jury";
import { Input } from "@/components/ui/input";
import type { JuryInvitation } from "@/types/api";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/lib/auth";

type AcceptInvitationModalProps = {
  invitation: JuryInvitation;
};

export const AcceptInvitationModal = ({
  invitation,
}: AcceptInvitationModalProps) => {
  const { addNotification } = useNotifications();
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const queryClient = useQueryClient();
  const user = useUser();
  const studentCode = user.data?.studentCode;

  const acceptInvitationMutation = useAcceptInvitation({
    mutationConfig: {
      onSuccess: async () => {
        addNotification({
          type: "success",
          title: "Invitación aceptada",
          message: "La invitación ha sido aceptada exitosamente",
        });
        await queryClient.invalidateQueries({ queryKey: ["jury-invitations"] });
        onClose();
      },
      onError: (error) => {
        addNotification({
          type: "error",
          title: "Error al aceptar invitación",
          message: error.message,
        });
      },
    },
  });

  return (
    <>
      <Button
        size="sm"
        variant="light"
        color="success"
        onPress={onOpen}
        isIconOnly
        title="Aceptar invitación"
      >
        <Check size={16} />
      </Button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="md">
        <ModalContent>
          {(onClose) => (
            <Form
              id="accept-invitation"
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const formData = new FormData(form);

                const data: any = {
                  token: invitation.token,
                  password: formData.get("password") as string,
                  firstName: formData.get("firstName") as string,
                  lastName: formData.get("lastName") as string,
                  ...(studentCode ? { studentCode } : {}),
                };

                if (!data.password || !data.firstName || !data.lastName) {
                  addNotification({
                    type: "error",
                    title: "Error",
                    message: "Todos los campos son requeridos",
                  });
                  return;
                }

                await acceptInvitationMutation.mutateAsync({ data });
              }}
            >
              <ModalHeader className="flex flex-col gap-1">
                Aceptar Invitación
              </ModalHeader>
              <ModalBody className="space-y-4 w-full">
                <p className="text-sm text-default-600">
                  Aceptando invitación para: <strong>{invitation.email}</strong>
                </p>
                <Input label="Nombre" name="firstName" isRequired />
                <Input label="Apellido" name="lastName" isRequired />
                <Input
                  label="Contraseña"
                  name="password"
                  type="password"
                  isRequired
                  description="Mínimo 8 caracteres"
                />
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="flat"
                  onPress={onClose}
                  disabled={acceptInvitationMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  color="success"
                  isLoading={acceptInvitationMutation.isPending}
                  disabled={acceptInvitationMutation.isPending}
                >
                  Aceptar Invitación
                </Button>
              </ModalFooter>
            </Form>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};
