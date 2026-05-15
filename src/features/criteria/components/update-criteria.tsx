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
import { useCategories } from "@/features/courses/api/get-categories";
import { useCriterion } from "../api/get-criterion";
import {
  updateCriteriaInputSchema,
  useUpdateCriteria,
} from "../api/update-criteria";
import { Input } from "@/components/ui/input";

type UpdateCriteriaProps = {
  criterionId: number;
  availableWeightPercent?: number;
};

export const UpdateCriteria = ({ criterionId, availableWeightPercent }: UpdateCriteriaProps) => {
  const { addNotification } = useNotifications();
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set()
  );
  const normalizeForUI = (raw?: number) => {
    const val = Number(raw ?? 0);
    if (val > 1) return Math.round(val);
    return Math.round(val * 100);
  };
  const [weightPercent, setWeightPercent] = useState(0);
  const [weightError, setWeightError] = useState<string | null>(null);

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
      const preselected = criterion.categoryIds
        ? new Set(criterion.categoryIds.map((id) => String(id)))
        : new Set<string>();
      setSelectedCategories(preselected);
      setWeightPercent(normalizeForUI(criterion.weight));
    }
  }, [isOpen, criterion]);

  useEffect(() => {
    const available = availableWeightPercent;
    if (typeof available === "number") {
      if (weightPercent > available) {
        setWeightError(`El peso excede el disponible. Disponible: ${available.toFixed(0)}%`);
      } else {
        setWeightError(null);
      }
    } else {
      setWeightError(null);
    }
  }, [weightPercent, availableWeightPercent]);

  const eventsQuery = useEvents({ page: 1 });
  const categoriesQuery = useCategories({
    eventId: selectedEvent ? Number(selectedEvent) : undefined,
    page: 1,
  });
  const events = eventsQuery.data?.data ?? [];
  const categories = categoriesQuery.data?.data ?? [];

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
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="sm">
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
                  // Normalize and clamp weightPercent to integer 0..100 before sending.
                  const normalizedWeightPercent = Math.max(
                    0,
                    Math.min(100, Math.round(Number(weightPercent) || 0)),
                  );

                  data.weight = normalizedWeightPercent / 100;
                  if (selectedEvent) data.eventId = Number(selectedEvent);
                  if (selectedCategories && selectedCategories.size) {
                    data.categoryIds = Array.from(selectedCategories).map((id) =>
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
                <ModalBody className="py-2 sm:py-4">
                  <div className="mx-auto flex w-full max-w-sm sm:max-w-md lg:max-w-lg flex-col gap-2">
                    <Select
                      label="Event"
                      placeholder="Select an event"
                      defaultSelectedKeys={
                        criterion?.eventId ? [String(criterion.eventId)] : []
                      }
                      onSelectionChange={(keys) => {
                        const id = Array.from(keys)[0] as string;
                        setSelectedEvent(id || "");
                        setSelectedCategories(new Set());
                      }}
                      isLoading={eventsQuery.isLoading}
                      isRequired
                    >
                      {events.map((event) => (
                        <SelectItem key={event.id}>{event.name}</SelectItem>
                      ))}
                    </Select>

                    <Select
                      label="Categories"
                      placeholder={
                        selectedEvent
                          ? "Select one or more categories"
                          : "Select event first"
                      }
                      selectionMode="multiple"
                      selectedKeys={selectedCategories}
                      onSelectionChange={(keys) => {
                        const set =
                          keys instanceof Set ? keys : new Set(Array.from(keys));
                        setSelectedCategories(set as Set<string>);
                      }}
                      isDisabled={!selectedEvent}
                      isLoading={!!selectedEvent && categoriesQuery.isLoading}
                    >
                      {selectedEvent ? (
                        categories.length ? (
                          categories.map((c) => (
                            <SelectItem key={String(c.id)}>{c.code}</SelectItem>
                          ))
                        ) : (
                          <SelectItem key="no-categories" isDisabled>
                            No categories
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

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-default-600">Peso (sobre el total del evento)</span>
                        <span className="font-semibold text-default-800">{weightPercent}%</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={1}
                          value={weightPercent}
                          onChange={(event) => setWeightPercent(Number(event.target.value))}
                          className="w-full accent-primary"
                          aria-label="Peso del criterio"
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={weightPercent}
                        />
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step={1}
                          value={String(weightPercent)}
                          inputMode="numeric"
                          pattern="[0-9]*"
                          onChange={(e: any) => {
                            const next = e.target.value;
                            if (/^-?\d*$/.test(next)) {
                              setWeightPercent(next === "" ? 0 : Number(next));
                            }
                          }}
                          onBlur={() => {
                            if (!Number.isFinite(Number(weightPercent))) return setWeightPercent(0);
                            if (weightPercent < 0) setWeightPercent(0);
                            if (weightPercent > 100) setWeightPercent(100);
                          }}
                          className="w-20"
                        />
                      </div>
                      <p className="text-xs text-default-500">Rango permitido: 0% a 100%.</p>
                      {typeof availableWeightPercent === "number" && (
                        <p className="text-xs text-default-500">Disponible: {availableWeightPercent.toFixed(0)}%</p>
                      )}
                      {weightError && (
                        <p className="text-xs text-danger">{weightError}</p>
                      )}
                    </div>
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button color="danger" variant="light" onPress={onClose}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    isLoading={updateCriteriaMutation.isPending}
                    disabled={updateCriteriaMutation.isPending || !!weightError}
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
