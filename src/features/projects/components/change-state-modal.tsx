"use client";

import { Checkbox } from "@heroui/react";
import { Radio, RadioGroup } from "@heroui/radio";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";

import {
  getStateChangeBlockedDetails,
  isConcurrentStateChange,
  PROJECT_STATE_LABELS,
  PROJECT_STATES,
  ProjectState,
  StateChangeBlockedDetails,
  useAdminChangeProjectState,
} from "../api/admin-change-project-state";

import { Button } from "@/components/ui/button";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@/components/ui/modal";
import { useNotifications } from "@/components/ui/notifications";
import { Textarea } from "@/components/ui/textarea";

const REASON_MAX_LENGTH = 1000;

/** Spanish lines that explain why the backend asked for a confirmation */
export const describeBlockedChange = (
  details: StateChangeBlockedDetails,
): string[] => {
  const lines: string[] = [];

  if (details.hasEvaluations) {
    lines.push(
      details.evaluationCount === 1
        ? "El proyecto ya tiene 1 evaluación de jurados."
        : `El proyecto ya tiene ${details.evaluationCount} evaluaciones de jurados.`,
    );
  }
  if (details.resultsPublished) {
    lines.push("El evento ya tiene resultados publicados.");
  }
  if (details.leavesApproved) {
    lines.push(
      "Al dejar de estar aprobado, el proyecto sale del ranking y de la plantilla e importación de jurados; sus evaluaciones se conservan.",
    );
  }

  return lines;
};

type ChangeProjectStateModalProps = {
  project: { id: number; name?: string; state: ProjectState };
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export const ChangeProjectStateModal = ({
  project,
  isOpen,
  onOpenChange,
}: ChangeProjectStateModalProps) => {
  const { addNotification } = useNotifications();
  const changeStateMutation = useAdminChangeProjectState();

  const [targetState, setTargetState] = useState<ProjectState | "">("");
  const [reason, setReason] = useState("");
  const [notify, setNotify] = useState(false);
  /** Set when the backend answered 409 PROJECT_STATE_CHANGE_BLOCKED for the current form */
  const [blocked, setBlocked] = useState<{
    details: StateChangeBlockedDetails;
    message: string;
  } | null>(null);

  const targetStates = PROJECT_STATES.filter(
    (state) => state !== project.state,
  );
  const isPending = changeStateMutation.isPending;
  const canSubmit =
    Boolean(targetState) && reason.trim().length > 0 && !isPending;

  const reset = () => {
    setTargetState("");
    setReason("");
    setNotify(false);
    setBlocked(null);
    changeStateMutation.reset();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) reset();
    onOpenChange(open);
  };

  const submit = (force: boolean) => {
    if (!targetState || !reason.trim()) return;

    changeStateMutation.mutate(
      { projectId: project.id, state: targetState, reason, notify, force },
      {
        onSuccess: (response) => {
          if (response?.warning) {
            addNotification({
              type: "warning",
              title: "Estado cambiado con advertencias",
              message: response.warning,
            });
          } else {
            addNotification({
              type: "success",
              title: "Estado cambiado",
              message: `El proyecto quedó en "${PROJECT_STATE_LABELS[targetState]}".`,
            });
          }
          handleOpenChange(false);
        },
        onError: (error) => {
          const details = getStateChangeBlockedDetails(error);

          if (details) {
            setBlocked({ details, message: error.message });

            return;
          }
          addNotification({
            type: "error",
            title: "No se cambió el estado",
            message: isConcurrentStateChange(error)
              ? "Otro cambio se guardó antes. Revisa el estado actual del proyecto y vuelve a intentarlo."
              : error.message || "Error al cambiar el estado del proyecto",
          });
        },
      },
    );
  };

  const blockedLines = blocked ? describeBlockedChange(blocked.details) : [];

  return (
    <Modal isOpen={isOpen} size="md" onOpenChange={handleOpenChange}>
      <ModalContent>
        {() => (
          <>
            <ModalHeader>Cambiar estado</ModalHeader>
            <ModalBody className="space-y-3">
              <p className="text-sm">
                {project.name ? (
                  <span className="font-semibold">{project.name}</span>
                ) : (
                  "El proyecto"
                )}{" "}
                está en{" "}
                <span className="font-semibold">
                  {PROJECT_STATE_LABELS[project.state]}
                </span>
                .
              </p>

              <RadioGroup
                isDisabled={isPending}
                label="Nuevo estado"
                value={targetState}
                onValueChange={(value) => {
                  setTargetState(value as ProjectState);
                  setBlocked(null);
                }}
              >
                {targetStates.map((state) => (
                  <Radio key={state} value={state}>
                    {PROJECT_STATE_LABELS[state]}
                  </Radio>
                ))}
              </RadioGroup>

              <Textarea
                isRequired
                description="Queda en el historial del proyecto. Si el estado es Rechazado o Cambios solicitados, también se muestra a los integrantes."
                isDisabled={isPending}
                label="Motivo"
                maxLength={REASON_MAX_LENGTH}
                placeholder="Explica por qué se corrige el estado..."
                rows={4}
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setBlocked(null);
                }}
              />

              <Checkbox
                isDisabled={isPending}
                isSelected={notify}
                onValueChange={setNotify}
              >
                Notificar a los integrantes
              </Checkbox>
              <p className="text-xs text-default-500">
                {notify
                  ? "Los integrantes pendientes recibirán el correo del nuevo estado (no hay correo para En revisión)."
                  : "No se enviará correo. Si el proyecto pasa a Aprobado, los tutores se activan igualmente."}
              </p>

              {blocked && (
                <div
                  className="space-y-2 rounded-lg border border-warning-400/40 bg-warning-400/10 p-3 text-sm"
                  role="alert"
                >
                  <div className="flex items-center gap-2 font-semibold text-warning-500">
                    <AlertTriangle className="h-4 w-4" />
                    <span>El cambio necesita confirmación</span>
                  </div>
                  {blockedLines.length > 0 ? (
                    <ul className="list-disc space-y-1 pl-5">
                      {blockedLines.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>{blocked.message}</p>
                  )}
                  <p>
                    No se ha cambiado nada. ¿Quieres aplicar el cambio de todas
                    formas?
                  </p>
                </div>
              )}
            </ModalBody>
            <ModalFooter className="space-x-2">
              <Button
                isDisabled={isPending}
                variant="light"
                onPress={() => handleOpenChange(false)}
              >
                Cancelar
              </Button>
              {blocked ? (
                <Button
                  color="danger"
                  isDisabled={!canSubmit}
                  isLoading={isPending}
                  onPress={() => submit(true)}
                >
                  Cambiar de todas formas
                </Button>
              ) : (
                <Button
                  color="primary"
                  isDisabled={!canSubmit}
                  isLoading={isPending}
                  onPress={() => submit(false)}
                >
                  Cambiar estado
                </Button>
              )}
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};
