"use client";

import { useState, useEffect, useMemo } from "react";
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
import { updateJuryInputSchema, useUpdateJury } from "../api/update-jury";
import { Input } from "@/components/ui/input";
import { Select, SelectItem } from "@/components/ui/select";
import { useEvents } from "@/features/events/api/get-events";
import { useProjects } from "@/features/projects/api/get-projects";
import { Jury } from "@/types/api";
import { Edit } from "lucide-react";

type EditModalProps = {
  jury: Jury;
};

export const EditModal = ({ jury }: EditModalProps) => {
  const { addNotification } = useNotifications();
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [selectedEventKeys, setSelectedEventKeys] = useState<Set<number>>(
    new Set(jury.eventIds || [])
  );
  const [selectedProjectKeys, setSelectedProjectKeys] = useState<Set<number>>(
    new Set(jury.projectIds || [])
  );
  const queryClient = useQueryClient();

  const eventsQuery = useEvents({ page: 1 });
  const events = eventsQuery.data?.data || [];

  // Get projects for selected events
  const selectedEventIds = useMemo(() => Array.from(selectedEventKeys), [selectedEventKeys]);
  const eventIdsParam = selectedEventIds.length > 0 ? selectedEventIds.join(",") : undefined;
  
  const projectsQuery = useProjects({
    eventId: Number(eventIdsParam),
    page: 1,
    queryConfig: {
      enabled: selectedEventIds.length > 0, // Only fetch when events are selected
    },
  });
  
  const allProjects = projectsQuery.data?.data || [];
  
  // Filter projects to only show those from selected events
  const availableProjects = useMemo(() => {
    if (selectedEventIds.length === 0) return [];
    return allProjects.filter((project) => 
      selectedEventIds.includes(project.eventId)
    );
  }, [allProjects, selectedEventIds]);

  const updateJuryMutation = useUpdateJury({
    mutationConfig: {
      onSuccess: async () => {
        addNotification({ type: "success", title: "Jurado actualizado" });
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["juries"] }),
          eventsQuery.refetch(),
        ]);
        onClose();
      },
    },
  });

  // Reset form state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedEventKeys(new Set(jury.eventIds || []));
      setSelectedProjectKeys(new Set(jury.projectIds || []));
    } else {
      // Reset when modal closes
      setSelectedEventKeys(new Set());
      setSelectedProjectKeys(new Set());
    }
  }, [isOpen, jury.id]); // Only depend on jury.id to avoid unnecessary updates

  // Note: We don't automatically clean up projects when events change to avoid infinite loops
  // The user can manually deselect invalid projects if needed

  return (
    <>
      <Button
        size="sm"
        variant="light"
        onPress={onOpen}
        isIconOnly
      >
        <Edit size={16} />
      </Button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
        <ModalContent>
          {(onClose) => (
            <Form
              id="edit-jury"
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const formData = new FormData(form);
                const rawData = Object.fromEntries(formData);
                const eventIds = Array.from(selectedEventKeys);
                const projectIds = Array.from(selectedProjectKeys);
                
                if (eventIds.length === 0) {
                  addNotification({
                    type: "error",
                    title: "Error",
                    message: "Por favor selecciona al menos un evento",
                  });
                  return;
                }
                
                const data = {
                  ...rawData,
                  eventIds,
                  projectIds,
                };
                
                try {
                  const values = await updateJuryInputSchema.parseAsync(data);
                  await updateJuryMutation.mutateAsync({ 
                    juryId: jury.id,
                    data: values 
                  });
                } catch (error) {
                  // Validation errors are handled by the schema
                }
              }}
            >
              <ModalHeader className="flex flex-col gap-1">
                Editar Jurado
              </ModalHeader>
              <ModalBody className="space-y-4 w-full">
                <Input 
                  label="Correo" 
                  name="email" 
                  defaultValue={jury.email}
                  isRequired 
                />
                <Select
                  label="Eventos"
                  placeholder="Selecciona uno o más eventos"
                  selectionMode="multiple"
                  isRequired
                  selectedKeys={selectedEventKeys}
                  onSelectionChange={(keys) => {
                    const nextSet = keys instanceof Set ? keys : new Set(Array.from(keys));
                    setSelectedEventKeys(nextSet as Set<number>);
                  }}
                  isLoading={eventsQuery.isLoading}
                >
                  {events.map((event) => (
                    <SelectItem key={String(event.id)}>
                      {event.name}
                    </SelectItem>
                  ))}
                </Select>
                <Select
                  label="Proyectos"
                  placeholder={
                    selectedEventKeys.size === 0
                      ? "Selecciona eventos primero"
                      : "Selecciona uno o más proyectos (opcional)"
                  }
                  selectionMode="multiple"
                  selectedKeys={selectedProjectKeys}
                  onSelectionChange={(keys) => {
                    const nextSet = keys instanceof Set ? keys : new Set(Array.from(keys));
                    setSelectedProjectKeys(nextSet as Set<number>);
                  }}
                  isDisabled={selectedEventKeys.size === 0}
                  isLoading={selectedEventKeys.size > 0 && projectsQuery.isLoading}
                >
                  {availableProjects.length > 0 ? (
                    availableProjects.map((project) => (
                      <SelectItem key={String(project.id)}>
                        {project.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem key="no-projects" isDisabled>
                      {selectedEventKeys.size === 0
                        ? "Selecciona eventos primero"
                        : "No hay proyectos disponibles"}
                    </SelectItem>
                  )}
                </Select>
              </ModalBody>
              <ModalFooter>
                <Button
                  color="danger"
                  variant="light"
                  onPress={onClose}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  isLoading={updateJuryMutation.isPending}
                  disabled={updateJuryMutation.isPending || selectedEventKeys.size === 0}
                >
                  Guardar
                </Button>
              </ModalFooter>
            </Form>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

