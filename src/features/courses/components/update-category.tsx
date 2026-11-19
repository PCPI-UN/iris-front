"use client";

import { SquarePen } from "lucide-react";

import { useCategory } from "../api/get-category";
import {
  updateCategoryInputSchema,
  useUpdateCategory,
} from "../api/update-category";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/components/ui/modal";
import { useDisclosure } from "@/hooks/use-disclosure";
import { useNotifications } from "@/components/ui/notifications";
import { Select, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useEvents } from "@/features/events/api/get-events";

type UpdateCategoryProps = {
  categoryId: number;
};

export const UpdateCategory = ({ categoryId }: UpdateCategoryProps) => {
  const { addNotification } = useNotifications();
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();

  const categoryQuery = useCategory({
    categoryId,
    queryConfig: {
      enabled: isOpen,
    },
  });
  const updateCategoryMutation = useUpdateCategory({
    mutationConfig: {
      onSuccess: () => {
        addNotification({
          type: "success",
          title: "Categoría actualizada",
        });
        onClose();
      },
    },
  });

  const eventsQuery = useEvents({ page: 1 });

  const category = categoryQuery.data?.data;
  const events = eventsQuery.data?.data || [];

  return (
    <>
      <Button
        className="w-full"
        size="sm"
        startContent={<SquarePen size={16} />}
        variant="shadow"
        onPress={() => {
          onOpen();
        }}
      >
        Editar categoría
      </Button>

      <Modal isOpen={isOpen} size="2xl" onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => {
            if (categoryQuery.isLoading) {
              return (
                <>
                  <ModalHeader>Actualizar categoría</ModalHeader>
                  <ModalBody className="flex items-center justify-center py-12">
                    <div>Cargando...</div>
                  </ModalBody>
                </>
              );
            }

            if (!category) {
              return (
                <>
                  <ModalHeader>Actualizar categoría</ModalHeader>
                  <ModalBody>
                    <p>Categoría no encontrada</p>
                  </ModalBody>
                  <ModalFooter>
                    <Button onPress={onClose}>Cerrar</Button>
                  </ModalFooter>
                </>
              );
            }

            return (
              <Form
                key={`update-category-${categoryId}-${category?.id}`}
                id="update-category"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const formData = new FormData(form);

                  const rawData = Object.fromEntries(formData);

                  const data = {
                    id: category.id,
                    code: rawData.code,
                    description: rawData.description,
                    active: rawData.active === "true",
                  };

                  const values =
                    await updateCategoryInputSchema.parseAsync(data);

                  await updateCategoryMutation.mutateAsync({
                    data: values,
                  });
                  // Notificación y cierre ahora se manejan en onSuccess
                }}
              >
                <ModalHeader className="flex flex-col gap-1">
                  Actualizar categoría
                </ModalHeader>

                <ModalBody className="space-y-4 w-full">
                  {/* Event Select */}
                  <Select
                    defaultSelectedKeys={
                      category?.eventId ? [String(category.eventId)] : []
                    }
                    isLoading={eventsQuery.isLoading}
                    label="Evento"
                    name="eventId"
                    placeholder="Selecciona un evento"
                  >
                    {events.map((event) => (
                      <SelectItem key={event.id}>{event.name}</SelectItem>
                    ))}
                  </Select>

                  <Input
                    isRequired
                    defaultValue={category?.code ?? ""}
                    label="Nombre de la categoría"
                    name="code"
                  />

                  <Textarea
                    isRequired
                    defaultValue={category?.description ?? ""}
                    label="Descripción"
                    name="description"
                  />

                  <Switch
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2`}
                    defaultSelected={category?.active}
                    name="active"
                    value="true"
                  >
                    <div className="flex flex-col gap-1">
                      <p className="text-medium">Activa</p>
                    </div>
                  </Switch>
                </ModalBody>

                <ModalFooter>
                  <Button color="danger" variant="light" onPress={onClose}>
                    Cancelar
                  </Button>
                  <Button
                    disabled={updateCategoryMutation.isPending}
                    isLoading={updateCategoryMutation.isPending}
                    type="submit"
                  >
                    Guardar cambios
                  </Button>
                </ModalFooter>
              </Form>
            );
          }}
        </ModalContent>
      </Modal>
    </>
  );
};
