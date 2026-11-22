"use client";

import type { ComponentProps } from "react";
import { Can } from "@/components/auth/can";
import { PERMISSIONS } from "@/lib/authorization";
import { SquarePen } from "lucide-react";
import { useEffect, useState } from "react";

import { useCriterion } from "../api/get-criterion";
import {
  updateCriteriaInputSchema,
  useUpdateCriteria,
} from "../api/update-criteria";

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
import { useEvents } from "@/features/events/api/get-events";
import { useCategories } from "@/features/courses/api/get-categories";
import { Input } from "@/components/ui/input";

type UpdateCriteriaProps = {
  criterionId: number;
  availableWeightPercent?: number;
};

const CRITERION_NAME_MAX_LENGTH = 100;

const UpdateCriteriaContent = ({
  criterionId,
  availableWeightPercent,
}: UpdateCriteriaProps) => {
  const { addNotification } = useNotifications();
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set(),
  );
  const normalizeForUI = (raw?: number) => {
    const val = Number(raw ?? 0);

    if (val > 1) return Number(val.toFixed(3));

    return Number((val * 100).toFixed(3));
  };
  // weightPercent may have up to 3 decimals; weightInput preserves raw typed text
  const [weightPercent, setWeightPercent] = useState<number>(0);
  const [weightInput, setWeightInput] = useState<string>("0");
  const [nameLength, setNameLength] = useState(0);
  const [weightError, setWeightError] = useState<string | null>(null);

  const validateWeightInput = (raw: string) => {
    if (!/^[0-9.,]*$/.test(raw)) {
      return "Solo se permiten números, punto o coma";
    }
    const dotCount = (raw.match(/\./g) || []).length;
    const commaCount = (raw.match(/,/g) || []).length;

    if (dotCount > 1 || commaCount > 1) {
      return "No puede tener más de un punto o más de una coma";
    }
    if (dotCount > 0 && commaCount > 0) {
      return "No puede mezclar punto y coma";
    }

    return null;
  };

  const criterionQuery = useCriterion({ criterionId });
  const updateCriteriaMutation = useUpdateCriteria({
    mutationConfig: {
      onSuccess: () => {
        addNotification({
          type: "success",
          title: "Criterio actualizado",
          message: "El criterio de evaluación se actualizó correctamente.",
        });
        onClose();
      },
      onError: (error: any) => {
        addNotification({
          type: "error",
          title: "Error",
          message: error?.message || "No se pudo actualizar el criterio",
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
      const initial = normalizeForUI(criterion.weight);

      setWeightPercent(initial);
      setWeightInput(String(initial));
      setNameLength(criterion.name?.length ?? 0);
    }
  }, [isOpen, criterion]);

  useEffect(() => {
    const available = availableWeightPercent;

    if (typeof available === "number") {
      if (weightPercent > available) {
        setWeightError(
          `El peso excede el disponible. Disponible: ${available.toFixed(0)}%`,
        );
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
        isIconOnly
        aria-label="Editar criterio"
        className="w-full"
        size="sm"
        variant="shadow"
        onPress={() => {
          criterionQuery.refetch();
          onOpen();
        }}
      >
        <SquarePen size={16} />
      </Button>
      <Modal
        classNames={{
          base: "mx-3 my-4 max-h-[86dvh] sm:mx-0 sm:my-0 sm:max-h-none",
          body: "max-h-[58dvh] overflow-y-auto sm:max-h-none sm:overflow-visible",
        }}
        isOpen={isOpen}
        scrollBehavior="inside"
        size="md"
        onOpenChange={onOpenChange}
      >
        <ModalContent>
          {(onClose) => {
            if (criterionQuery.isLoading) {
              return (
                <>
                  <ModalHeader>Actualizar criterio</ModalHeader>
                  <ModalBody className="flex items-center justify-center py-12">
                    <div>Cargando...</div>
                  </ModalBody>
                </>
              );
            }

            if (!criterion) {
              return (
                <>
                  <ModalHeader>Actualizar criterio</ModalHeader>
                  <ModalBody>
                    <p>Criterio no encontrado</p>
                  </ModalBody>
                  <ModalFooter>
                    <Button onPress={onClose}>Cerrar</Button>
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
                  const rawName = String(rawData.name || "");

                  if (rawName.length > CRITERION_NAME_MAX_LENGTH) {
                    addNotification({
                      type: "error",
                      title: "Nombre muy largo",
                      message: `El nombre del criterio no puede superar ${CRITERION_NAME_MAX_LENGTH} caracteres.`,
                    });

                    return;
                  }

                  const data: any = {};

                  if (rawName) data.name = rawName;
                  if (rawData.description)
                    data.description = rawData.description;
                  // Normalize and clamp weightPercent to 0..100 with up to 3 decimals.
                  let normalizedWeightPercent = Math.max(
                    0,
                    Math.min(100, Number(weightPercent) || 0),
                  );

                  normalizedWeightPercent = Number(
                    normalizedWeightPercent.toFixed(3),
                  );

                  data.weight = normalizedWeightPercent / 100;
                  if (selectedEvent) data.eventId = Number(selectedEvent);
                  if (selectedCategories && selectedCategories.size) {
                    data.categoryIds = Array.from(selectedCategories).map(
                      (id) => Number(id),
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
                  Actualizar criterio
                  <p className="text-sm font-normal text-gray-500">
                    Actualiza el criterio de evaluación
                  </p>
                </ModalHeader>
                <ModalBody className="py-2">
                  <div className="mx-auto flex w-full max-w-sm min-w-0 flex-col gap-2 sm:max-w-md">
                    <Select
                      isRequired
                      defaultSelectedKeys={
                        criterion?.eventId ? [String(criterion.eventId)] : []
                      }
                      isLoading={eventsQuery.isLoading}
                      label="Evento"
                      placeholder="Selecciona un evento"
                      onSelectionChange={(keys) => {
                        const id = Array.from(keys)[0] as string;

                        setSelectedEvent(id || "");
                        setSelectedCategories(new Set());
                      }}
                    >
                      {events.map((event) => (
                        <SelectItem key={event.id}>{event.name}</SelectItem>
                      ))}
                    </Select>

                    <Select
                      isDisabled={!selectedEvent}
                      isLoading={!!selectedEvent && categoriesQuery.isLoading}
                      label="Categorías"
                      placeholder={
                        selectedEvent
                          ? "Selecciona una o más categorías"
                          : "Selecciona primero un evento"
                      }
                      selectedKeys={selectedCategories}
                      selectionMode="multiple"
                      onSelectionChange={(keys) => {
                        const set =
                          keys instanceof Set
                            ? keys
                            : new Set(Array.from(keys));

                        setSelectedCategories(set as Set<string>);
                      }}
                    >
                      {selectedEvent ? (
                        categories.length ? (
                          categories.map((c) => (
                            <SelectItem key={String(c.id)}>{c.code}</SelectItem>
                          ))
                        ) : (
                          <SelectItem key="no-categories" isDisabled>
                            Sin categorías
                          </SelectItem>
                        )
                      ) : (
                        <SelectItem key="select-event" isDisabled>
                          Selecciona primero un evento
                        </SelectItem>
                      )}
                    </Select>
                    <Textarea
                      classNames={{ input: "max-h-24 overflow-y-auto" }}
                      defaultValue={criterion?.name ?? ""}
                      description={`${nameLength}/${CRITERION_NAME_MAX_LENGTH} caracteres`}
                      errorMessage={`Máximo ${CRITERION_NAME_MAX_LENGTH} caracteres`}
                      isInvalid={nameLength > CRITERION_NAME_MAX_LENGTH}
                      label="Nombre"
                      maxLength={CRITERION_NAME_MAX_LENGTH}
                      maxRows={3}
                      minRows={2}
                      name="name"
                      placeholder="ej. Calidad técnica"
                      onChange={(event) =>
                        setNameLength(event.target.value.length)
                      }
                    />

                    <Textarea
                      classNames={{ input: "max-h-24 overflow-y-auto" }}
                      defaultValue={criterion?.description ?? ""}
                      label="Descripción"
                      maxRows={3}
                      minRows={2}
                      name="description"
                      placeholder="Breve descripción del criterio"
                    />

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-default-600">
                          Peso (sobre el total del evento)
                        </span>
                        <span className="font-semibold text-default-800">
                          {weightPercent}%
                        </span>
                      </div>
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          aria-label="Peso del criterio"
                          aria-valuemax={100}
                          aria-valuemin={0}
                          aria-valuenow={Math.round(Number(weightPercent) || 0)}
                          className="w-full accent-primary"
                          max={100}
                          min={0}
                          step={1}
                          type="range"
                          value={Math.round(Number(weightPercent) || 0)}
                          onChange={(event) => {
                            const intVal = Math.round(
                              Number(event.target.value),
                            );

                            setWeightPercent(intVal);
                            setWeightInput(String(intVal));
                          }}
                        />
                        <Input
                          className="w-28 min-w-0 flex-shrink-0"
                          inputMode="decimal"
                          pattern="[0-9.,]*"
                          type="text"
                          value={weightInput}
                          onBlur={() => {
                            const error = validateWeightInput(weightInput);

                            if (error) {
                              setWeightError(error);

                              return;
                            }
                            const normalized = weightInput.replace(",", ".");
                            let parsed = Number(normalized);

                            if (!Number.isFinite(parsed)) parsed = 0;
                            parsed = Math.max(0, Math.min(100, parsed));
                            parsed = Number(parsed.toFixed(3));
                            setWeightPercent(parsed);
                            setWeightInput(String(parsed));
                            setWeightError(null);
                          }}
                          onChange={(e: any) => {
                            const raw = String(e.target.value);
                            const error = validateWeightInput(raw);

                            setWeightInput(raw);
                            setWeightError(error);
                            if (error) return;
                            const numeric = raw.replace(",", ".");

                            if (/^\d+(?:\.\d*)?$/.test(numeric)) {
                              const parts = numeric.split(".");

                              if (parts[1] && parts[1].length > 3) return;
                              const parsed = Number(numeric);

                              if (!Number.isNaN(parsed))
                                setWeightPercent(parsed);
                            }
                          }}
                        />
                      </div>
                      <p className="text-xs text-default-500">
                        Rango permitido: 0% a 100%.
                      </p>
                      {typeof availableWeightPercent === "number" && (
                        <p className="text-xs text-default-500">
                          Disponible: {availableWeightPercent.toFixed(0)}%
                        </p>
                      )}
                      {weightError && (
                        <p className="text-xs text-danger">{weightError}</p>
                      )}
                    </div>
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button color="danger" variant="light" onPress={onClose}>
                    Cancelar
                  </Button>
                  <Button
                    disabled={
                      updateCriteriaMutation.isPending ||
                      !!weightError ||
                      nameLength > CRITERION_NAME_MAX_LENGTH
                    }
                    isLoading={updateCriteriaMutation.isPending}
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

// Only sessions that can call the endpoint see the action
export const UpdateCriteria = (props: ComponentProps<typeof UpdateCriteriaContent>) => (
  <Can permission={PERMISSIONS.manageEvents}>
    <UpdateCriteriaContent {...props} />
  </Can>
);
