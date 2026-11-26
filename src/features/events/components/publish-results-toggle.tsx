"use client";

import { useState } from "react";

import { Can } from "@/components/auth/can";
import { PERMISSIONS } from "@/lib/authorization";

import { Button } from "@/components/ui/button";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@/components/ui/modal";
import { useNotifications } from "@/components/ui/notifications";
import { Switch } from "@/components/ui/switch";
import { ApiError } from "@/lib/api-client";

import { useUpdateResultsPublished } from "../api/update-results-published";

type PublishResultsToggleProps = {
  eventId: number;
  resultsPublished: boolean;
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof ApiError && error.status === 403) {
    return "No tienes permiso para cambiar la publicación de resultados.";
  }
  if (error instanceof ApiError && error.status === 404) {
    return "No encontramos el evento.";
  }
  return "No se pudo cambiar la publicación de resultados. Intenta de nuevo.";
};

/**
 * Lets the admin publish or hide the results of an event. Publishing asks for
 * confirmation because students start seeing their score, feedback, position
 * and awards; hiding them again does not.
 */
export const PublishResultsToggle = ({
  eventId,
  resultsPublished,
}: PublishResultsToggleProps) => {
  const { addNotification } = useNotifications();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const mutation = useUpdateResultsPublished({
    mutationConfig: {
      onSuccess: (_data, { resultsPublished: published }) => {
        setIsConfirmOpen(false);
        addNotification({
          type: "success",
          title: published ? "Resultados publicados" : "Resultados ocultos",
          message: published
            ? "Los estudiantes ya pueden ver su puntaje, retroalimentación, posición y premios."
            : "Los estudiantes ya no ven su puntaje, retroalimentación, posición ni premios.",
        });
      },
      onError: (error) => {
        setIsConfirmOpen(false);
        addNotification({
          type: "error",
          title: "Error",
          message: getErrorMessage(error),
        });
      },
    },
  });

  const setPublished = (published: boolean) =>
    mutation.mutate({ eventId, resultsPublished: published });

  return (
    <>
      <div className="flex items-center justify-between gap-3 p-1">
        <div className="flex flex-col">
          <span className="text-sm text-default-400">Resultados:</span>
          <span
            className={`text-sm font-medium ${
              resultsPublished ? "text-green-600" : "text-gray-400"
            }`}
          >
            {resultsPublished ? "Publicados" : "No publicados"}
          </span>
        </div>
        {/* Read-only roles see the status but cannot change it (PATCH requires manage:events) */}
        <Can permission={PERMISSIONS.manageEvents}>
          <Switch
            size="sm"
            aria-label="Publicar resultados"
            isSelected={resultsPublished}
            isDisabled={mutation.isPending}
            onValueChange={(published) => {
              if (published) {
                setIsConfirmOpen(true);
              } else {
                setPublished(false);
              }
            }}
          />
        </Can>
      </div>

      <Modal
        isOpen={isConfirmOpen}
        onOpenChange={(open) => {
          if (!mutation.isPending) setIsConfirmOpen(open);
        }}
      >
        <ModalContent>
          <ModalHeader>¿Publicar los resultados?</ModalHeader>
          <ModalBody>
            <p className="text-sm text-default-500">
              Los estudiantes del evento podrán ver su puntaje,
              retroalimentación, posición y premios. Puedes ocultarlos de nuevo
              en cualquier momento.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="flat"
              onPress={() => setIsConfirmOpen(false)}
              isDisabled={mutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              color="primary"
              onPress={() => setPublished(true)}
              isLoading={mutation.isPending}
            >
              Publicar resultados
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};
