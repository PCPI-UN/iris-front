"use client";

import { SquarePen } from "lucide-react";

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
import { useUser } from "@/lib/auth";
import { Select, SelectItem } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { useEvents } from "@/features/events/api/get-events";
import { useCourses } from "@/features/courses/api/get-courses";
import { useCriterion } from "../api/get-criterion";
import {
  updateCriteriaInputSchema,
  useUpdateCriteria,
} from "../api/update-criteria";
import { Input } from "@/components/ui/input";

type UpdateCriteriaProps = {
  criterionId: number;
};

export const UpdateCriteria = ({ criterionId }: UpdateCriteriaProps) => {
  const { addNotification } = useNotifications();
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(
    new Set()
  );

  const criterionQuery = useCriterion({ criterionId });
  const updateCriteriaMutation = useUpdateCriteria({
    mutationConfig: {
      onSuccess: () => {
        addNotification({
          type: "success",
          title: "Criteria Updated",
          message: "The evaluation criteria has been updated successfully.",
        });
        onClose();
      },
      onError: (error: any) => {
        addNotification({
          type: "error",
          title: "Error",
          message: error?.message || "Failed to update criteria",
        });
      },
    },
  });

  const user = useUser();
  const criterion = criterionQuery.data?.data;

  // Initialize local state when opening modal or when criterion loads
  useEffect(() => {
    if (isOpen && criterion) {
      setSelectedEvent(criterion.eventId ? String(criterion.eventId) : "");
      const preselected = criterion.courseIds
        ? new Set(criterion.courseIds.map((id) => String(id)))
        : new Set<string>();
      setSelectedCourses(preselected);
    }
  }, [isOpen, criterion]);

  const eventsQuery = useEvents({ page: 1 });
  const coursesQuery = useCourses({
    eventId: selectedEvent ? Number(selectedEvent) : undefined,
    page: 1,
  });
  const events = eventsQuery.data?.data ?? [];
  const courses = coursesQuery.data?.data ?? [];

  return (
    <>
      <Button
        className="w-full"
        variant="shadow"
        size="sm"
        onPress={() => {
          criterionQuery.refetch();
          onOpen();
        }}
        startContent={<SquarePen size={16} />}
      >
        Edit
      </Button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
        <ModalContent>
          {(onClose) => {
            if (criterionQuery.isLoading) {
              return (
                <>
                  <ModalHeader>Update Criteria</ModalHeader>
                  <ModalBody className="flex items-center justify-center py-12">
                    <div>Loading...</div>
                  </ModalBody>
                </>
              );
            }

            if (!criterion) {
              return (
                <>
                  <ModalHeader>Update Criteria</ModalHeader>
                  <ModalBody>
                    <p>Criteria not found</p>
                  </ModalBody>
                  <ModalFooter>
                    <Button onPress={onClose}>Close</Button>
                  </ModalFooter>
                </>
              );
            }

            return (
              <Form
                key={`update-criteria-${criterionId}-${criterion?.id}`}
                id="update-criteria"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const formData = new FormData(form);

                  const rawData = Object.fromEntries(formData);

                  const data: any = {};
                  if (rawData.name) data.name = rawData.name;
                  if (rawData.description)
                    data.description = rawData.description;
                  if (rawData.weight) data.weight = Number(rawData.weight);
                  if (selectedEvent) data.eventId = Number(selectedEvent);
                  if (selectedCourses && selectedCourses.size) {
                    data.courseIds = Array.from(selectedCourses).map((id) =>
                      Number(id)
                    );
                  }

                  try {
                    const values =
                      await updateCriteriaInputSchema.parseAsync(data);
                    await updateCriteriaMutation.mutateAsync({
                      data: values,
                      criterionId,
                    });
                  } catch (error) {
                    // Validation errors are handled by the schema
                  }
                }}
              >
                <ModalHeader className="flex flex-col gap-1">
                  Update Criteria
                  <p className="text-sm font-normal text-gray-500">
                    Update the evaluation criteria
                  </p>
                </ModalHeader>
                <ModalBody className="space-y-4 w-full">
                  <Select
                    label="Event"
                    placeholder="Select an event"
                    defaultSelectedKeys={
                      criterion?.eventId ? [String(criterion.eventId)] : []
                    }
                    onSelectionChange={(keys) => {
                      const id = Array.from(keys)[0] as string;
                      setSelectedEvent(id || "");
                      setSelectedCourses(new Set());
                    }}
                    isLoading={eventsQuery.isLoading}
                    isRequired
                  >
                    {events.map((event) => (
                      <SelectItem key={event.id}>{event.name}</SelectItem>
                    ))}
                  </Select>

                  <Select
                    label="Courses"
                    placeholder={
                      selectedEvent
                        ? "Select one or more courses"
                        : "Select event first"
                    }
                    selectionMode="multiple"
                    selectedKeys={selectedCourses}
                    onSelectionChange={(keys) => {
                      const set =
                        keys instanceof Set ? keys : new Set(Array.from(keys));
                      setSelectedCourses(set as Set<string>);
                    }}
                    isDisabled={!selectedEvent}
                    isLoading={!!selectedEvent && coursesQuery.isLoading}
                  >
                    {selectedEvent ? (
                      courses.length ? (
                        courses.map((c) => (
                          <SelectItem key={String(c.id)}>{c.code}</SelectItem>
                        ))
                      ) : (
                        <SelectItem key="no-courses" isDisabled>
                          No courses
                        </SelectItem>
                      )
                    ) : (
                      <SelectItem key="select-event" isDisabled>
                        Select event first
                      </SelectItem>
                    )}
                  </Select>
                  <Input
                    label="Name"
                    name="name"
                    defaultValue={criterion?.name ?? ""}
                    placeholder="e.g., Technical Quality"
                  />

                  <Textarea
                    label="Description"
                    name="description"
                    defaultValue={criterion?.description ?? ""}
                    placeholder="Brief description of the criteria"
                  />

                  <Input
                    type="number"
                    label="Weight"
                    name="weight"
                    defaultValue={criterion?.weight?.toString() ?? "0"}
                    min="0"
                    max="1"
                    step="0.01"
                    description="Weight of this criteria in the evaluation (e.g., 0.25 for 25%)"
                  />
                </ModalBody>
                <ModalFooter>
                  <Button color="danger" variant="light" onPress={onClose}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    isLoading={updateCriteriaMutation.isPending}
                    disabled={updateCriteriaMutation.isPending}
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
