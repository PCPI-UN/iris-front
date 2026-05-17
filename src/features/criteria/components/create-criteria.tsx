"use client";

import { Plus } from "lucide-react";
import { useState, useEffect } from "react";

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
import { useEventsDropdown } from "@/features/events/api/get-events-dropdown";
import { useCategories } from "@/features/courses/api/get-categories";

import {
  createCriteriaInputSchema,
  useCreateCriteria,
} from "../api/create-criteria";
import { Input } from "@/components/ui/input";

type CreateCriteriaProps = {
  availableWeightPercent?: number;
};

export const CreateCriteria = ({ availableWeightPercent }: CreateCriteriaProps) => {
  const { addNotification } = useNotifications();
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [selectedEventKey, setSelectedEventKey] = useState<string>("");
  const [selectedCategoryKeys, setSelectedCategoryKeys] = useState<Set<string>>(
    new Set()
  );
  const user = useUser();

  const normalizeForUI = (raw?: number) => {
    const val = Number(raw ?? 0);
    if (val > 1) return Math.round(val);
    return Math.round(val * 100);
  };
  const [weightPercent, setWeightPercent] = useState(25);
  const [weightError, setWeightError] = useState<string | null>(null);
  const createCriteriaMutation = useCreateCriteria({
    mutationConfig: {
      onSuccess: () => {
        addNotification({
          type: "success",
          title: "Criterio Creado",
          message: "El criterio de evaluación ha sido creado exitosamente.",
        });
        setSelectedEventKey("");
        setSelectedCategoryKeys(new Set());
        onClose();
      },
      onError: (error: any) => {
        addNotification({
          type: "error",
          title: "Error",
          message: error?.message || "Error al crear el criterio",
        });
      },
    },
  });

  const eventsQuery = useEventsDropdown();
  const events = eventsQuery.data?.data ?? [];
  const categoriesQuery = useCategories({
    page: 1,
    eventId: selectedEventKey ? Number(selectedEventKey) : undefined,
    queryConfig: { enabled: !!selectedEventKey },
  });
  const categories = categoriesQuery.data?.data ?? [];

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

  return (
    <>
      <Button size="sm" onPress={() => onOpen()}>
        <Plus size={16} />
        Crear Criterio
      </Button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="sm">
        <ModalContent>
          {(onClose) => (
            <Form
              id="create-criteria"
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const formData = new FormData(form);

                const rawData = Object.fromEntries(formData);

                if (!selectedEventKey) {
                  addNotification({
                    type: "error",
                    title: "Error de validación",
                    message: "Por favor selecciona un evento",
                  });
                  return;
                }

                if (selectedCategoryKeys.size === 0) {
                  addNotification({
                    type: "error",
                    title: "Error de validación",
                    message: "Por favor selecciona al menos una categoría",
                  });
                  return;
                }

                // Normalize and clamp weightPercent to integer 0..100 before sending.
                const normalizedWeightPercent = Math.max(
                  0,
                  Math.min(100, Math.round(Number(weightPercent) || 0)),
                );

                const data = {
                  eventId: Number(selectedEventKey),
                  name: rawData.name as string,
                  description: rawData.description as string,
                  weight: normalizedWeightPercent / 100,
                  categoryIds: Array.from(selectedCategoryKeys).map(Number),
                };

                try {
                  const values =
                    await createCriteriaInputSchema.parseAsync(data);
                  await createCriteriaMutation.mutateAsync({ data: values });
                } catch (error: any) {
                  addNotification({
                    type: "error",
                    title: "Error de validación",
                    message: error?.message || "Datos inválidos",
                  });
                }
              }}
            >
              <ModalHeader className="flex flex-col gap-1">
                Crear nuevo criterio
                <p className="text-sm font-normal text-gray-500">
                  Agrega un nuevo criterio de evaluación
                </p>
              </ModalHeader>
              <ModalBody className="py-1 sm:py-2">
                <div className="mx-auto flex w-full max-w-sm sm:max-w-md lg:max-w-lg flex-col gap-1">
                  <Select
                    label="Evento"
                    placeholder="Selecciona un evento"
                    selectedKeys={selectedEventKey ? [selectedEventKey] : []}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0];
                      setSelectedEventKey(selected ? String(selected) : "");
                      setSelectedCategoryKeys(new Set());
                    }}
                    isRequired
                    isLoading={eventsQuery.isLoading}
                  >
                    {events.map((event) => (
                      <SelectItem key={String(event.id)}>{event.name}</SelectItem>
                    ))}
                  </Select>

                  <Select
                    label="Categorías"
                    placeholder={
                      selectedEventKey
                        ? "Selecciona una o más categorías"
                        : "Selecciona un evento primero"
                    }
                    selectionMode="multiple"
                    selectedKeys={selectedCategoryKeys}
                    onSelectionChange={(keys) => {
                      const stringSet = new Set(Array.from(keys).map(String));
                      setSelectedCategoryKeys(stringSet);
                    }}
                    isDisabled={!selectedEventKey}
                    isLoading={!!selectedEventKey && categoriesQuery.isLoading}
                  >
                    {categories.length > 0 ? (
                      categories.map((category) => (
                        <SelectItem key={String(category.id)}>
                          {category.code}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem key="no-categories" isDisabled>
                        {selectedEventKey
                          ? "No hay categorías"
                          : "Selecciona un evento primero"}
                      </SelectItem>
                    )}
                  </Select>
                  <Input
                    label="Nombre"
                    name="name"
                    placeholder="ej: Calidad Técnica"
                    isRequired
                  />

                  <Textarea
                    label="Descripción"
                    name="description"
                    placeholder="Breve descripción del criterio"
                    isRequired
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
                <Button color="danger" variant="flat" onPress={onClose}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  color="primary"
                  isLoading={createCriteriaMutation.isPending}
                  disabled={
                    createCriteriaMutation.isPending ||
                    !selectedEventKey ||
                    selectedCategoryKeys.size === 0 ||
                    !!weightError
                  }
                >
                  Crear Criterio
                </Button>
              </ModalFooter>
            </Form>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};
