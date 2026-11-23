"use client";

import { useMemo, useState } from "react";

import { useSetProjectTutors } from "../../api/set-project-tutors";
import {
  toTutorsPayload,
  TutorsPayload,
  tutorsValueFromProject,
  TutorsValue,
} from "../../utils/tutors";
import { TutorsInput } from "../tutors-input";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNotifications } from "@/components/ui/notifications";
import { ProjectTutor } from "@/types/api";

/**
 * Compares two tutor lists by what PUT /projects/:id/tutors would save: order does not matter,
 * names do (a pending tutor removed and added again with a corrected name is a change).
 */
export const tutorsSignature = (payload: TutorsPayload) =>
  JSON.stringify({
    userIds: [...payload.userIds].sort((a, b) => a - b),
    pending: payload.pending
      .map((tutor) => ({
        email: tutor.email,
        firstName: tutor.firstName,
        lastName: tutor.lastName ?? "",
      }))
      .sort((a, b) => a.email.localeCompare(b.email)),
  });

type AdminProjectTutorsProps = {
  projectId: number;
  tutors: ProjectTutor[];
};

/**
 * Tutors of the project for an administrator (manage:projects): the tutor input of the
 * submission form plus a reason, saved with PUT /projects/:id/tutors.
 */
export const AdminProjectTutors = ({
  projectId,
  tutors,
}: AdminProjectTutorsProps) => {
  const { addNotification } = useNotifications();

  const initialValue = useMemo(() => tutorsValueFromProject(tutors), [tutors]);
  const [value, setValue] = useState<TutorsValue>(initialValue);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useSetProjectTutors({
    mutationConfig: {
      onSuccess: () => {
        setReason("");
        addNotification({
          type: "success",
          title: "Tutores actualizados",
          message: "Los tutores del proyecto quedaron guardados.",
        });
      },
      onError: (mutationError: unknown) =>
        setError(
          (mutationError as Error)?.message ||
            "No se pudieron guardar los tutores",
        ),
    },
  });

  const hasChanges =
    tutorsSignature(toTutorsPayload(value)) !==
    tutorsSignature(toTutorsPayload(initialValue));
  const isPending = mutation.isPending;

  return (
    <div className="space-y-4">
      <TutorsInput
        isDisabled={isPending}
        value={value}
        onChange={(next) => {
          setError(null);
          setValue(next);
        }}
      />
      <p className="text-xs text-default-500">
        Al guardar se reemplaza la lista completa. Los tutores sin cuenta
        reciben la invitación cuando el proyecto esté aprobado.
      </p>

      <Input
        description="Opcional. Queda en el historial del proyecto."
        isDisabled={isPending}
        label="Motivo"
        maxLength={1000}
        value={reason}
        onValueChange={setReason}
      />
      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button
          isDisabled={isPending || !hasChanges}
          variant="light"
          onPress={() => setValue(initialValue)}
        >
          Descartar cambios
        </Button>
        <Button
          color="primary"
          isDisabled={!hasChanges}
          isLoading={isPending}
          onPress={() => {
            setError(null);
            mutation.mutate({
              projectId,
              data: toTutorsPayload(value),
              reason,
            });
          }}
        >
          Guardar tutores
        </Button>
      </div>
    </div>
  );
};
