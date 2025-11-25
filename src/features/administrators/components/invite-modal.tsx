"use client";

import { Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/components/ui/modal";
import { useDisclosure } from '@/hooks/use-disclosure';
import { useNotifications } from "@/components/ui/notifications";
import { useUser } from "@/lib/auth";
import { canInviteAdministrator } from "@/lib/authorization";
import { createAdministratorInputSchema, useCreateAdministrator } from "../api/create-administrator";
import { Input } from "@/components/ui/input";
import { ZodError } from "zod";

export const InviteModal = () => {
  const { addNotification } = useNotifications();
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const queryClient = useQueryClient();
  const [validationError, setValidationError] = useState<string | null>(null);

  const createAdministratorMutation = useCreateAdministrator({
    mutationConfig: {
      onSuccess: async () => {
        addNotification({ type: "success", title: "Administrador invitado" });
        await queryClient.invalidateQueries({ queryKey: ["administrators"] });
        setValidationError(null);
        onClose();
      },
      onError: (error: any) => {
        if (error?.response?.data?.message) {
          addNotification({
            type: "error",
            title: "Error",
            message: error.response.data.message,
          });
        }
      },
    },
  });

  // Reset form state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setValidationError(null);
    }
  }, [isOpen]);

  const user = useUser();
  if (!canInviteAdministrator(user?.data)) return null;

  return (
    <>
      <Button size="md" onPress={onOpen} color="primary">
        <Plus size={16} />
        Invitar Administrador
      </Button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
        <ModalContent>
          {(onClose) => (
            <Form
              id="invite-administrator"
              onSubmit={async (e) => {
                e.preventDefault();
                setValidationError(null);
                const form = e.target as HTMLFormElement;
                const formData = new FormData(form);
                const rawData = Object.fromEntries(formData);
                
                try {
                  const values = await createAdministratorInputSchema.parseAsync(rawData);
                  await createAdministratorMutation.mutateAsync({ data: values });
                } catch (error) {
                  if (error instanceof ZodError) {
                    const firstError = error.issues[0];
                    setValidationError(firstError?.message || "Error de validación");
                    addNotification({
                      type: "error",
                      title: "Error de validación",
                      message: firstError?.message || "Por favor verifica los datos ingresados",
                    });
                  }
                }
              }}
            >
              <ModalHeader className="flex flex-col gap-1">
                Invitar Administrador
              </ModalHeader>
              <ModalBody className="space-y-4 w-full">
                <Input 
                  label="Correo" 
                  name="email" 
                  type="email"
                  placeholder="ejemplo@correo.com"
                  isRequired 
                  isInvalid={!!validationError}
                  errorMessage={validationError || undefined}
                />
              </ModalBody>
              <ModalFooter>
                <Button
                  type="submit"
                  isLoading={createAdministratorMutation.isPending}
                  disabled={createAdministratorMutation.isPending}
                >
                  Invitar Administrador
                </Button>
              </ModalFooter>
            </Form>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

