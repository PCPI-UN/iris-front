"use client";

import type { Selection } from "@react-types/shared";

import { UserMinus, UserPlus } from "lucide-react";
import { FormEvent, useState } from "react";

import {
  AdminPendingParticipantInput,
  AdminRemoveParticipantInput,
  useAdminAddParticipant,
  useAdminRemoveParticipant,
} from "../../api/admin-project-participants";

import {
  CAREER_OPTIONS,
  SEMESTER_OPTIONS,
} from "@/features/projects-public/components/wizard-steps/constants-carrers-semesters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNotifications } from "@/components/ui/notifications";
import { Select, SelectItem } from "@/components/ui/select";

type EnrolledParticipant = {
  userId: number;
  studentCode?: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
};

type PendingParticipant = {
  pendingId: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  studentCode?: string;
  status?: string | number;
};

const PENDING_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  INVITED: "Invitado",
};

const EMPTY_PARTICIPANT: AdminPendingParticipantInput = {
  firstName: "",
  lastName: "",
  email: "",
  studentCode: "",
  semester: "",
  career: "",
};

type ParticipantErrors = Partial<
  Record<keyof AdminPendingParticipantInput, string>
>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateParticipant = (
  participant: AdminPendingParticipantInput,
): ParticipantErrors => {
  const errors: ParticipantErrors = {};

  if (!participant.firstName.trim())
    errors.firstName = "El nombre es obligatorio";
  if (!participant.email.trim()) {
    errors.email = "El correo es obligatorio";
  } else if (!EMAIL_PATTERN.test(participant.email.trim())) {
    errors.email = "El formato del correo no es válido";
  }
  if (!participant.studentCode.trim()) {
    errors.studentCode = "El código de estudiante es obligatorio";
  } else if (participant.studentCode.trim().length > 20) {
    errors.studentCode =
      "El código de estudiante no puede superar 20 caracteres";
  }
  if (!participant.career.trim()) errors.career = "Selecciona la carrera";
  if (!/^\d+$/.test(participant.semester.trim())) {
    errors.semester = "Selecciona el semestre";
  }

  return errors;
};

/** First key of a single selection of a HeroUI Select ("" when cleared) */
const firstKey = (keys: Selection) =>
  keys === "all" ? "" : String(Array.from(keys)[0] ?? "");

/** JOINED pending rows are the same people as the enrolled ones: they are removed as enrolled */
const isStillPending = (participant: PendingParticipant) => {
  const status = String(participant.status ?? "PENDING").toUpperCase();

  return status !== "JOINED" && status !== "3";
};

const fullName = (participant: {
  firstName?: string | null;
  lastName?: string | null;
}) =>
  `${participant.firstName ?? ""} ${participant.lastName ?? ""}`.trim() ||
  "Sin nombre";

type AdminProjectParticipantsProps = {
  projectId: number;
  participants: EnrolledParticipant[];
  pendingParticipants: PendingParticipant[];
};

export const AdminProjectParticipants = ({
  projectId,
  participants,
  pendingParticipants,
}: AdminProjectParticipantsProps) => {
  const { addNotification } = useNotifications();
  const addMutation = useAdminAddParticipant();
  const removeMutation = useAdminRemoveParticipant();

  const [reason, setReason] = useState("");
  const [draft, setDraft] =
    useState<AdminPendingParticipantInput>(EMPTY_PARTICIPANT);
  const [draftErrors, setDraftErrors] = useState<ParticipantErrors>({});
  const [addError, setAddError] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  /** Key of the row waiting for the removal confirmation */
  const [confirmingKey, setConfirmingKey] = useState<string | null>(null);

  const pending = pendingParticipants.filter(isStillPending);

  const setDraftField = (
    field: keyof AdminPendingParticipantInput,
    value: string,
  ) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setDraftErrors((current) => ({ ...current, [field]: undefined }));
    setAddError(null);
  };

  const handleAdd = (event: FormEvent) => {
    event.preventDefault();
    const errors = validateParticipant(draft);

    setDraftErrors(errors);
    if (Object.keys(errors).length > 0) return;

    addMutation.mutate(
      { projectId, participant: draft, reason },
      {
        onSuccess: (response) => {
          setDraft(EMPTY_PARTICIPANT);
          setReason("");
          addNotification(
            response?.warning
              ? {
                  type: "warning",
                  title: "Integrante agregado con advertencias",
                  message: response.warning,
                }
              : {
                  type: "success",
                  title: "Integrante agregado",
                  message: `${fullName(draft)} quedó como integrante pendiente del proyecto.`,
                },
          );
        },
        onError: (error) =>
          setAddError(error.message || "No se pudo agregar el integrante"),
      },
    );
  };

  const handleRemove = (
    name: string,
    target: { userId: number } | { pendingId: number },
  ) => {
    setRemoveError(null);
    removeMutation.mutate(
      { projectId, reason, ...target } as AdminRemoveParticipantInput,
      {
        onSuccess: () => {
          setConfirmingKey(null);
          setReason("");
          addNotification({
            type: "success",
            title: "Integrante quitado",
            message: `${name} ya no es integrante del proyecto.`,
          });
        },
        onError: (error) => {
          setConfirmingKey(null);
          setRemoveError(error.message || "No se pudo quitar el integrante");
        },
      },
    );
  };

  const rows = [
    ...participants.map((participant) => ({
      key: `user-${participant.userId}`,
      name: fullName(participant),
      detail: [participant.email, participant.studentCode]
        .filter(Boolean)
        .join(" · "),
      status: "Inscrito",
      target: { userId: participant.userId } as
        | { userId: number }
        | { pendingId: number },
    })),
    ...pending.map((participant) => ({
      key: `pending-${participant.pendingId}`,
      name: fullName(participant),
      detail: [participant.email, participant.studentCode]
        .filter(Boolean)
        .join(" · "),
      status:
        PENDING_STATUS_LABELS[
          String(participant.status ?? "PENDING").toUpperCase()
        ] ?? "Pendiente",
      target: { pendingId: participant.pendingId } as
        | { userId: number }
        | { pendingId: number },
    })),
  ];

  const isBusy = addMutation.isPending || removeMutation.isPending;

  return (
    <div className="space-y-4">
      <Input
        description="Opcional. Queda en el historial con cada alta o baja."
        isDisabled={isBusy}
        label="Motivo"
        maxLength={1000}
        value={reason}
        onValueChange={setReason}
      />

      <section aria-label="Integrantes del proyecto" className="space-y-2">
        {rows.length === 0 ? (
          <p className="text-sm text-default-500">
            El proyecto no tiene integrantes.
          </p>
        ) : (
          <ul className="space-y-2">
            {rows.map((row) => (
              <li
                key={row.key}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 p-3 text-sm"
              >
                <div>
                  <p className="font-medium">{row.name}</p>
                  <p className="text-xs text-default-500">
                    {row.status}
                    {row.detail ? ` · ${row.detail}` : ""}
                  </p>
                </div>
                {confirmingKey === row.key ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs">¿Quitar a {row.name}?</span>
                    <Button
                      isDisabled={removeMutation.isPending}
                      size="sm"
                      variant="light"
                      onPress={() => setConfirmingKey(null)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      color="danger"
                      isLoading={removeMutation.isPending}
                      size="sm"
                      onPress={() => handleRemove(row.name, row.target)}
                    >
                      Confirmar
                    </Button>
                  </div>
                ) : (
                  <Button
                    aria-label={`Quitar a ${row.name}`}
                    isDisabled={isBusy}
                    size="sm"
                    startContent={<UserMinus className="h-4 w-4" />}
                    variant="flat"
                    onPress={() => {
                      setRemoveError(null);
                      setConfirmingKey(row.key);
                    }}
                  >
                    Quitar
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
        {removeError && (
          <p className="text-sm text-danger" role="alert">
            {removeError}
          </p>
        )}
      </section>

      <form
        noValidate
        aria-label="Agregar integrante pendiente"
        className="space-y-3 rounded-lg border border-white/10 p-3"
        onSubmit={handleAdd}
      >
        <h3 className="text-sm font-semibold">Agregar integrante pendiente</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            isRequired
            errorMessage={draftErrors.firstName}
            isDisabled={isBusy}
            isInvalid={Boolean(draftErrors.firstName)}
            label="Nombre"
            value={draft.firstName}
            onValueChange={(value) => setDraftField("firstName", value)}
          />
          <Input
            isDisabled={isBusy}
            label="Apellido"
            value={draft.lastName}
            onValueChange={(value) => setDraftField("lastName", value)}
          />
          <Input
            isRequired
            errorMessage={draftErrors.email}
            isDisabled={isBusy}
            isInvalid={Boolean(draftErrors.email)}
            label="Correo"
            type="email"
            value={draft.email}
            onValueChange={(value) => setDraftField("email", value)}
          />
          <Input
            isRequired
            errorMessage={draftErrors.studentCode}
            isDisabled={isBusy}
            isInvalid={Boolean(draftErrors.studentCode)}
            label="Código de estudiante"
            value={draft.studentCode}
            onValueChange={(value) => setDraftField("studentCode", value)}
          />
          {/* Same lists as the registration form, which stores the career key */}
          <Select
            isRequired
            errorMessage={draftErrors.career}
            isDisabled={isBusy}
            isInvalid={Boolean(draftErrors.career)}
            label="Carrera"
            placeholder="Seleccionar carrera"
            selectedKeys={draft.career ? [draft.career] : []}
            onSelectionChange={(keys) =>
              setDraftField("career", firstKey(keys))
            }
          >
            {CAREER_OPTIONS.map((option) => (
              <SelectItem key={option.key}>{option.label}</SelectItem>
            ))}
          </Select>
          <Select
            isRequired
            errorMessage={draftErrors.semester}
            isDisabled={isBusy}
            isInvalid={Boolean(draftErrors.semester)}
            label="Semestre"
            placeholder="Seleccionar semestre"
            selectedKeys={draft.semester ? [draft.semester] : []}
            onSelectionChange={(keys) =>
              setDraftField("semester", firstKey(keys))
            }
          >
            {SEMESTER_OPTIONS.map((option) => (
              <SelectItem key={option.key}>{option.label}</SelectItem>
            ))}
          </Select>
        </div>
        {addError && (
          <p className="text-sm text-danger" role="alert">
            {addError}
          </p>
        )}
        <div className="flex justify-end">
          <Button
            color="primary"
            isDisabled={isBusy}
            isLoading={addMutation.isPending}
            startContent={<UserPlus className="h-4 w-4" />}
            type="submit"
          >
            Agregar integrante
          </Button>
        </div>
      </form>
    </div>
  );
};
