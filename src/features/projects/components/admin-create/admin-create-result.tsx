"use client";

import { AlertTriangle, CheckCircle2, FileUp } from "lucide-react";
import NextLink from "next/link";
import { useState } from "react";

import {
  ADMIN_INITIAL_STATE_LABELS,
  AdminInitialProjectState,
  CreateProjectAdminResponse,
  getFailedEffectLabel,
  hasFailedDocuments,
} from "../../api/create-project-admin";
import { AdminProjectDocuments } from "../admin-edit/admin-project-documents";

import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
} from "@/components/ui/modal";
import { paths } from "@/config/paths";

type AdminCreateResultProps = {
  result: CreateProjectAdminResponse;
  eventId: number;
  state: AdminInitialProjectState;
  onCreateAnother: () => void;
};

/**
 * Outcome of POST /projects/admin. The project is created even when some
 * effects failed after saving it (documents, tutors, emails): those are listed
 * so the admin can fix them, with a shortcut to upload the documents again.
 */
export const AdminCreateResult = ({
  result,
  eventId,
  state,
  onCreateAnother,
}: AdminCreateResultProps) => {
  const [isDocumentsOpen, setIsDocumentsOpen] = useState(false);
  const { project, failedEffects, warning } = result;
  const hasFailures = failedEffects.length > 0;
  const projectsHref = `${paths.app.projects.getHref()}?event=${eventId}&state=${state}`;

  return (
    <div className="glass-card space-y-5 rounded-2xl border border-border/30 p-6">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 h-7 w-7 shrink-0 text-success" />
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-foreground">Proyecto creado</h2>
          <p className="text-sm text-muted-foreground">
            «{project?.name}» quedó registrado en el evento con estado{" "}
            <Chip
              color={state === "APPROVED" ? "success" : "warning"}
              size="sm"
              variant="flat"
            >
              {ADMIN_INITIAL_STATE_LABELS[state]}
            </Chip>
            . La creación quedó en el historial del proyecto.
          </p>
        </div>
      </div>

      {hasFailures && (
        <div
          className="space-y-2 rounded-lg border border-warning-400/40 bg-warning-400/10 p-4 text-sm"
          role="alert"
        >
          <div className="flex items-center gap-2 font-semibold text-warning-500">
            <AlertTriangle className="h-4 w-4" />
            Algunas acciones fallaron después de crear el proyecto
          </div>
          {warning && <p className="text-foreground/90">{warning}</p>}
          <ul className="list-inside list-disc text-foreground/80">
            {failedEffects.map((effect) => (
              <li key={effect}>{getFailedEffectLabel(effect)}</li>
            ))}
          </ul>
          {hasFailedDocuments(failedEffects) && project?.id && (
            <Button
              color="warning"
              size="sm"
              startContent={<FileUp className="h-4 w-4" />}
              variant="flat"
              onPress={() => setIsDocumentsOpen(true)}
            >
              Volver a subir documentos
            </Button>
          )}
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="bordered" onPress={onCreateAnother}>
          Crear otro proyecto
        </Button>
        <Button as={NextLink} color="primary" href={projectsHref}>
          Ver proyectos del evento
        </Button>
      </div>

      {project?.id && (
        <Modal
          isOpen={isDocumentsOpen}
          scrollBehavior="inside"
          size="3xl"
          onOpenChange={setIsDocumentsOpen}
        >
          <ModalContent>
            <ModalHeader>Documentos de «{project.name}»</ModalHeader>
            <ModalBody className="pb-6">
              <AdminProjectDocuments projectId={Number(project.id)} />
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </div>
  );
};
