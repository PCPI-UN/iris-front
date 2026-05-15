"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@/components/ui/modal";
import { useNotifications } from "@/components/ui/notifications";
import { useDisclosure } from "@/hooks/use-disclosure";
import { CriterionComponent } from "@/types/api";

import {
  createComponentInputSchema,
  useCreateComponent,
} from "../api/create-component";

type CreateComponentProps = {
  onCreated?: (component: CriterionComponent) => void;
  isDisabled?: boolean;
};

export const CreateComponent = ({
  onCreated,
  isDisabled = false,
}: CreateComponentProps) => {
  const { addNotification } = useNotifications();
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [weightPercent, setWeightPercent] = useState(25);

  const createComponentMutation = useCreateComponent({
    mutationConfig: {
      onSuccess: (componentResponse: any) => {
        const component = componentResponse?.data ?? componentResponse;
        const parsedId = Number(component?.id);

        const normalizedComponent: CriterionComponent | null =
          Number.isFinite(parsedId) && parsedId > 0
            ? {
                id: parsedId,
                name: String(component?.name ?? "").trim(),
                weight: Number(component?.weight ?? 0),
              }
            : null;

        addNotification({
          type: "success",
          title: "Componente creado",
          message: "El componente fue creado correctamente.",
        });

        if (normalizedComponent) {
          onCreated?.(normalizedComponent);
        }

        setWeightPercent(25);
        onClose();
      },
      onError: (error: any) => {
        addNotification({
          type: "error",
          title: "Error",
          message: error?.message || "No se pudo crear el componente.",
        });
      },
    },
  });

  return (
    <>
      <Button
        size="sm"
        variant="flat"
        color="secondary"
        onPress={onOpen}
        isDisabled={isDisabled}
      >
        <Plus size={16} />
        Agregar componente
      </Button>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
        <ModalContent>
          {(closeModal) => (
            <Form
              id="create-component"
              onSubmit={async (event) => {
                event.preventDefault();
                const form = event.target as HTMLFormElement;
                const formData = new FormData(form);
                const rawData = Object.fromEntries(formData);

                const payload = {
                  name: String(rawData.name || "").trim(),
                  weight: Number(weightPercent) / 100,
                };

                try {
                  const values = await createComponentInputSchema.parseAsync(payload);
                  await createComponentMutation.mutateAsync({ data: values });
                } catch (error: any) {
                  addNotification({
                    type: "error",
                    title: "Error de validación",
                    message: error?.message || "Revisa los datos ingresados.",
                  });
                }
              }}
            >
              <ModalHeader className="flex flex-col gap-1">
                Crear componente
                <p className="text-sm font-normal text-default-500">
                  Configura un componente y luego agrega criterios dentro del acordeón.
                </p>
              </ModalHeader>

              <ModalBody className="space-y-4">
                <Input
                  name="name"
                  label="Nombre"
                  placeholder="Ej: Innovación"
                  isRequired
                />

                <Textarea
                  name="description"
                  label="Descripción"
                  placeholder="Descripción breve (opcional)"
                />

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-default-600">Peso</span>
                    <span className="font-semibold text-default-800">
                      {weightPercent}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={100}
                    step={5}
                    value={weightPercent}
                    onChange={(event) =>
                      setWeightPercent(Number(event.target.value))
                    }
                    className="w-full accent-primary"
                  />
                  <p className="text-xs text-default-500">
                    Rango permitido: 5% a 100%, en pasos de 5%.
                  </p>
                </div>
              </ModalBody>

              <ModalFooter>
                <Button
                  color="danger"
                  variant="flat"
                  onPress={closeModal}
                  isDisabled={createComponentMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  color="primary"
                  isLoading={createComponentMutation.isPending}
                >
                  Crear componente
                </Button>
              </ModalFooter>
            </Form>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};
