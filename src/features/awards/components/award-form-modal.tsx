"use client";

import type { CategoryAward } from "../types";

import { Trophy } from "lucide-react";
import { useEffect, useState } from "react";

import {
  useCreateCategoryAward,
  useUpdateCategoryAward,
} from "../api/category-awards";
import {
  type AwardFormDraft,
  type AwardFormErrors,
  awardToDraft,
  emptyAwardDraft,
  parseAwardForm,
} from "../utils/award-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@/components/ui/modal";
import { useNotifications } from "@/components/ui/notifications";
import { Textarea } from "@/components/ui/textarea";

type AwardFormModalProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: number;
  /** Award to edit; without it the modal creates a new one */
  award?: CategoryAward;
  /** Position suggested for a new award */
  nextPosition: number;
};

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

export const AwardFormModal = ({
  isOpen,
  onOpenChange,
  categoryId,
  award,
  nextPosition,
}: AwardFormModalProps) => {
  const { addNotification } = useNotifications();
  const isEditing = Boolean(award);
  const [draft, setDraft] = useState<AwardFormDraft>(() =>
    award ? awardToDraft(award) : emptyAwardDraft(nextPosition),
  );
  const [errors, setErrors] = useState<AwardFormErrors>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  // Every opening starts from the award (or an empty form), not from the last draft
  useEffect(() => {
    if (!isOpen) return;
    setDraft(award ? awardToDraft(award) : emptyAwardDraft(nextPosition));
    setErrors({});
    setSaveError(null);
  }, [isOpen, award, nextPosition]);

  const createAward = useCreateCategoryAward();
  const updateAward = useUpdateCategoryAward();
  const isSaving = createAward.isPending || updateAward.isPending;

  const setField = (field: keyof AwardFormDraft) => (value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async (onClose: () => void) => {
    const parsed = parseAwardForm(draft);

    if (parsed.errors) {
      setErrors(parsed.errors);

      return;
    }

    setSaveError(null);
    try {
      if (award) {
        await updateAward.mutateAsync({
          awardId: award.id,
          categoryId,
          values: parsed.values,
        });
        addNotification({ type: "success", title: "Premio actualizado" });
      } else {
        await createAward.mutateAsync({ categoryId, values: parsed.values });
        addNotification({ type: "success", title: "Premio creado" });
      }
      onClose();
    } catch (error) {
      setSaveError(
        errorMessage(
          error,
          isEditing
            ? "No se pudo actualizar el premio"
            : "No se pudo crear el premio",
        ),
      );
    }
  };

  return (
    <Modal
      className="m-auto mx-5 lg:max-w-lg"
      isOpen={isOpen}
      onOpenChange={onOpenChange}
    >
      <ModalContent>
        {(onClose) => (
          <form
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              void handleSubmit(onClose);
            }}
          >
            <ModalHeader className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              <h2 className="text-lg font-bold">
                {isEditing ? "Editar premio" : "Nuevo premio"}
              </h2>
            </ModalHeader>

            <ModalBody className="space-y-3">
              <Input
                isRequired
                errorMessage={errors.title}
                isInvalid={Boolean(errors.title)}
                label="Nombre del premio"
                placeholder="Ej. Primer puesto, Mención de honor"
                value={draft.title}
                onValueChange={setField("title")}
              />
              <Textarea
                errorMessage={errors.description}
                isInvalid={Boolean(errors.description)}
                label="Descripción"
                placeholder="Qué recibe el ganador (opcional)"
                value={draft.description}
                onValueChange={setField("description")}
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input
                  isRequired
                  description="Orden del premio en la categoría"
                  errorMessage={errors.position}
                  isInvalid={Boolean(errors.position)}
                  label="Posición"
                  min={1}
                  type="number"
                  value={draft.position}
                  onValueChange={setField("position")}
                />
                <Input
                  description="Vacío si no tiene valor monetario"
                  errorMessage={errors.value}
                  inputMode="numeric"
                  isInvalid={Boolean(errors.value)}
                  label="Valor (COP)"
                  placeholder="Opcional"
                  value={draft.value}
                  onValueChange={setField("value")}
                />
              </div>

              {saveError && (
                <p className="text-sm text-danger-500" role="alert">
                  {saveError}
                </p>
              )}
            </ModalBody>

            <ModalFooter>
              <Button isDisabled={isSaving} variant="light" onPress={onClose}>
                Cancelar
              </Button>
              <Button color="primary" isLoading={isSaving} type="submit">
                {isEditing ? "Guardar cambios" : "Crear premio"}
              </Button>
            </ModalFooter>
          </form>
        )}
      </ModalContent>
    </Modal>
  );
};
