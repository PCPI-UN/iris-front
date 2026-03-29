"use client";

import { parseDate } from "@internationalized/date";
import { useEffect } from "react";
import { SquarePen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
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
import { canUpdateEvent } from "@/lib/authorization";

import { useEvent } from "../api/get-event";
import { updateEventInputSchema, useUpdateEvent } from "../api/update-event";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/utils/cn";

type UpdateEventProps = {
  eventId: number;
};

export const UpdateEvent = ({ eventId }: UpdateEventProps) => {
  const { addNotification } = useNotifications();
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();  
  const eventQuery = useEvent({ eventId });
  const updateEventMutation = useUpdateEvent({
    mutationConfig: {
      onSuccess: () => {
        addNotification({
          type: "success",
          title: "Event Updated",
        });
        onClose();
      },
    },
  });

  const user = useUser();

  if (!canUpdateEvent(user?.data)) {
    return null;
  }

  const event = eventQuery.data?.data;


  return (
    <>
      <Button
        variant="shadow"
        className="w-full"
        size="sm"
        onPress={() => {
          eventQuery.refetch();
          onOpen();
        }}
      >
        <SquarePen size={16} />
        Update Event
      </Button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
        <ModalContent>
          {(onClose) => {
            if (eventQuery.isLoading) {
              return (
                <>
                  <ModalHeader>Update Event</ModalHeader>
                  <ModalBody className="flex items-center justify-center py-12">
                    <Spinner size="lg" />
                  </ModalBody>
                </>
              );
            }

            if (!event) {
              return (
                <>
                  <ModalHeader>Update Event</ModalHeader>
                  <ModalBody>
                    <p>Event not found</p>
                  </ModalBody>
                  <ModalFooter>
                    <Button onPress={onClose}>Close</Button>
                  </ModalFooter>
                </>
              );
            }

            return (
            <Form
              key={`update-event-${eventId}-${event?.updatedAt}`}
              id="update-event"
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const formData = new FormData(form);

                const rawData = Object.fromEntries(formData);
                const data = {
                  id: Number(eventId),
                  name: rawData.name as string,
                  description: rawData.description as string,
                  accessCode: rawData.accessCode as string,
                  isPublic: rawData.isPublic === "true",
                  startDate: rawData.startDate as string,
                  endDate: rawData.endDate as string,
                  inscriptionDeadline: rawData.inscriptionDeadline as string,
                  evaluationsStatus:
                    rawData.evaluationsStatus === "open" ? "open" : "closed",
                  active: rawData.active === "true",
                  location: rawData.location as string,
                };

                const values = await updateEventInputSchema.parseAsync(data);
                await updateEventMutation.mutateAsync({
                  data: values,
                });
              }}
            >
              <ModalHeader className="flex flex-col gap-1">
                Update Event
              </ModalHeader>
              <ModalBody className="space-y-4 w-full">
                <Input
                  id="update-event-name"
                  label="Name"
                  name="name"
                  defaultValue={event?.name ?? ""}
                />
                <Textarea
                  id="update-event-description"
                  label="Description"
                  name="description"
                  defaultValue={event?.description ?? ""}
                />
                <Input
                  id="update-event-location"
                  label="Location"
                  name="location"
                  defaultValue={event?.location ?? ""}
                />
                <Input
                  id="update-event-access-code"
                  label="Access Code"
                  name="accessCode"
                  defaultValue={event?.accessCode ?? ""}
                />
                <DatePicker
                  id="update-event-start-date"
                  label="Start Date"
                  name="startDate"
                  defaultValue={
                    event?.startDate ? parseDate(event.startDate.split('T')[0]) : undefined
                  }
                  isRequired
                />
                <DatePicker
                  id="update-event-end-date"
                  label="End Date"
                  name="endDate"
                  defaultValue={
                    event?.endDate ? parseDate(event.endDate.split('T')[0]) : undefined
                  }
                  isRequired
                />
                <DatePicker
                  id="update-event-inscription-deadline"
                  label="Inscription Deadline"
                  name="inscriptionDeadline"
                  defaultValue={
                    event?.inscriptionDeadline
                      ? parseDate(event.inscriptionDeadline.split('T')[0])
                      : undefined
                  }
                  isRequired
                />
                <div className="flex flex-row gap-50">
                <Switch
                  id="update-event-evaluations-opened"
                  name="evaluationsStatus"
                  value="open"
                  defaultSelected={event?.evaluationsOpened}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2`}
                >
                  <div className="flex flex-col gap-1">
                    <p className="text-medium">Evaluations Open</p>
                  </div>
                </Switch>

                <Switch
                  id="update-event-is-publicly-joinable"
                  name="isPublic"
                  value="true"
                  defaultSelected={event?.isPubliclyJoinable}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2`}
                >
                    <div className="flex flex-col gap-1">
                    <p className="text-medium">Publicly Joinable</p>
                  </div>
                </Switch>

                <Switch
                  id="update-event-active"
                  name="active"
                  value="true"
                  defaultSelected={event?.active}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2`}
                >
                  <div className="flex flex-col gap-1">
                    <p className="text-medium">Active</p>
                  </div>
                </Switch>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button
                  type="submit"
                  isLoading={updateEventMutation.isPending}
                  disabled={updateEventMutation.isPending}
                >
                  Save Changes
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
