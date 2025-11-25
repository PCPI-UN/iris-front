"use client";

import { Plus } from "lucide-react";
import { useState, useEffect, useMemo, useRef } from "react";
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
import { canInviteJury } from "@/lib/authorization";
import { createJuryInputSchema, useCreateJury } from "../api/create-jury";
import { Input } from "@/components/ui/input";
import { Select, SelectItem } from "@/components/ui/select";
import { useEventsDropdown } from "@/features/events/api/get-events-dropdown";
import { useProjects } from "@/features/projects/api/get-projects";

export const InviteModal = () => {
  const { addNotification } = useNotifications();
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [selectedEventKeys, setSelectedEventKeys] = useState<Set<string>>(
    new Set()
  );
  const [selectedProjectKeys, setSelectedProjectKeys] = useState<Set<string>>(
    new Set()
  );
  const queryClient = useQueryClient();

  const eventsQuery = useEventsDropdown();
  const events = eventsQuery.data?.data || [];

  // Track eventIds as a string to ensure React Query detects changes
  const [eventIdsParam, setEventIdsParam] = useState<string | undefined>(undefined);
  const prevEventKeysStrRef = useRef<string>("");
  
  // Update eventIdsParam when selectedEventKeys changes
  // Serialize the Set to detect content changes
  useEffect(() => {
    const ids = Array.from(selectedEventKeys).sort();
    const newParam = ids.length > 0 ? ids.join(",") : undefined;
    const newParamStr = newParam || "";
    
    // Only update if the value actually changed
    if (prevEventKeysStrRef.current !== newParamStr) {
      prevEventKeysStrRef.current = newParamStr;
      setEventIdsParam(newParam);
    }
  }, [selectedEventKeys]);
  
  const selectedEventIds = useMemo(() => {
    if (!eventIdsParam) return [];
    return eventIdsParam.split(',').map(id => id.trim());
  }, [eventIdsParam]);
  
  // Fetch all projects for selected events (no pagination for dropdown)
  const projectsQuery = useProjects({
    eventId: Number(eventIdsParam),
    page: 1,
    queryConfig: {
      enabled: !!eventIdsParam, // Only fetch when events are selected
    },
  });
  
  const allProjects = projectsQuery.data?.data || [];
  
  // The handler already filters projects by eventId, so we can use them directly
  // But we'll still filter to ensure only projects from selected events are shown
  const availableProjects = useMemo(() => {
    if (!eventIdsParam || allProjects.length === 0) return [];
    
    // The handler already filtered by eventId, but we'll double-check
    // Convert selectedEventIds to strings for comparison
    const eventIdStrings = selectedEventIds.map(id => String(id));
    
    // Filter projects that belong to any of the selected events
    return allProjects.filter((project) => {
      const projectEventId = String(project.eventId);
      return eventIdStrings.includes(projectEventId);
    });
  }, [allProjects, eventIdsParam, selectedEventIds]);

  const createJuryMutation = useCreateJury({
    mutationConfig: {
      onSuccess: async () => {
        addNotification({ type: "success", title: "Jurado invitado" });
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["juries"] }),
          eventsQuery.refetch(),
        ]);
        setSelectedEventKeys(new Set());
        setSelectedProjectKeys(new Set());
        onClose();
      },
    },
  });

  // Reset form state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedEventKeys(new Set());
      setSelectedProjectKeys(new Set());
    }
  }, [isOpen]);

  // Reset projects when events change
  useEffect(() => {
    setSelectedProjectKeys(new Set());
  }, [selectedEventKeys]);

  const user = useUser();
  if (!canInviteJury(user?.data)) return null;

  return (
    <>
      <Button size="md" onPress={onOpen} color="primary">
        <Plus size={16} />
        Invitar Jurado
      </Button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
        <ModalContent>
          {(onClose) => (
            <Form
              id="invite-jurors"
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
                  const values = await createJuryInputSchema.parseAsync(data);
                  await createJuryMutation.mutateAsync({ data: values });
                } catch (error) {
                  // Validation errors are handled by the schema
                }
              }}
            >
              <ModalHeader className="flex flex-col gap-1">
                Invitar Jurado
              </ModalHeader>
              <ModalBody className="space-y-4 w-full">
                <Input label="Correo" name="email" isRequired />
                <Select
                  label="Eventos"
                  placeholder="Selecciona uno o más eventos"
                  selectionMode="multiple"
                  isRequired
                  selectedKeys={selectedEventKeys}
                  onSelectionChange={(keys) => {
                    const nextSet = keys instanceof Set ? keys : new Set(Array.from(keys));
                    setSelectedEventKeys(nextSet as Set<string>);
                    // Update eventIdsParam immediately when events change
                    const ids = Array.from(nextSet).sort();
                    const newParam = ids.length > 0 ? ids.join(",") : undefined;
                    setEventIdsParam(newParam);
                    prevEventKeysStrRef.current = newParam || "";
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
                    setSelectedProjectKeys(nextSet as Set<string>);
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
                  type="submit"
                  isLoading={createJuryMutation.isPending}
                  disabled={createJuryMutation.isPending || selectedEventKeys.size === 0}
                >
                  Invitar Jurado
                </Button>
              </ModalFooter>
            </Form>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};
