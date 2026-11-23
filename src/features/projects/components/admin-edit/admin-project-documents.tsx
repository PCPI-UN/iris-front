"use client";

import { ExternalLink, FileText, Plus, Upload } from "lucide-react";
import { ChangeEvent, useRef, useState } from "react";

import {
  ADMIN_DOCUMENT_MAX_FILE_SIZE,
  AdminDocumentType,
  AdminProjectDocument,
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_TYPE_LIMITS,
  normalizeDocumentState,
  normalizeDocumentType,
  useAddProjectDocument,
  useAdminProjectDocuments,
  useChangeProjectDocumentState,
  useReplaceProjectDocument,
} from "../../api/admin-project-documents";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNotifications } from "@/components/ui/notifications";
import { Spinner } from "@/components/ui/spinner";

const TYPE_ORDER: AdminDocumentType[] = [
  "LOGO",
  "POSTER",
  "SUPPORTING_DOCUMENT",
];

/** Files the submission form accepts for each type */
const ACCEPT: Record<AdminDocumentType, string> = {
  LOGO: "image/*",
  POSTER: "image/*,application/pdf",
  SUPPORTING_DOCUMENT: "application/pdf,image/*",
};

type AddDocumentButtonProps = {
  type: AdminDocumentType;
  isBusy: boolean;
  isLoading: boolean;
  onAdd: (type: AdminDocumentType, file: File) => void;
};

/** Uploads a document of a type the project still has room for */
const AddDocumentButton = ({
  type,
  isBusy,
  isLoading,
  onAdd,
}: AddDocumentButtonProps) => {
  const fileInput = useRef<HTMLInputElement>(null);
  const label = DOCUMENT_TYPE_LABELS[type];

  return (
    <>
      <input
        ref={fileInput}
        accept={ACCEPT[type]}
        aria-label={`Archivo de ${label} para agregar`}
        className="hidden"
        type="file"
        onChange={(event) => {
          const file = event.target.files?.[0];

          event.target.value = "";
          if (file) onAdd(type, file);
        }}
      />
      <Button
        isDisabled={isBusy}
        isLoading={isLoading}
        size="sm"
        startContent={isLoading ? null : <Plus className="h-4 w-4" />}
        variant="flat"
        onPress={() => fileInput.current?.click()}
      >
        Agregar {label.toLowerCase()}
      </Button>
    </>
  );
};

type DocumentRowProps = {
  document: AdminProjectDocument;
  type: AdminDocumentType;
  isBusy: boolean;
  onReplace: (document: AdminProjectDocument, file: File) => void;
  onToggleState: (document: AdminProjectDocument) => void;
};

const DocumentRow = ({
  document,
  type,
  isBusy,
  onReplace,
  onToggleState,
}: DocumentRowProps) => {
  const fileInput = useRef<HTMLInputElement>(null);
  const isActive = normalizeDocumentState(document.state) === "ACTIVE";
  const label = DOCUMENT_TYPE_LABELS[type];

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    event.target.value = "";
    if (file) onReplace(document, file);
  };

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 p-3 text-sm">
      <div className="flex items-center gap-3">
        {type === "LOGO" && document.url ? (
          // The signed url changes with every replacement, so the new logo shows at once
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={`${label} del proyecto`}
            className="h-12 w-12 rounded object-cover"
            src={document.url}
          />
        ) : (
          <FileText className="h-5 w-5 text-primary" />
        )}
        <div>
          <p className="font-medium">{label}</p>
          <p
            className={`text-xs ${isActive ? "text-success" : "text-default-500"}`}
          >
            {isActive ? "Activo" : "Inactivo: no se muestra en el proyecto"}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {document.url && (
          <Button
            as="a"
            href={document.url}
            rel="noreferrer"
            size="sm"
            startContent={<ExternalLink className="h-4 w-4" />}
            target="_blank"
            variant="light"
          >
            Abrir
          </Button>
        )}
        <input
          ref={fileInput}
          accept={ACCEPT[type]}
          aria-label={`Archivo nuevo de ${label}`}
          className="hidden"
          type="file"
          onChange={handleFile}
        />
        <Button
          isDisabled={isBusy}
          size="sm"
          startContent={<Upload className="h-4 w-4" />}
          variant="flat"
          onPress={() => fileInput.current?.click()}
        >
          Reemplazar archivo
        </Button>
        <Button
          color={isActive ? "danger" : "success"}
          isDisabled={isBusy}
          size="sm"
          variant="flat"
          onPress={() => onToggleState(document)}
        >
          {isActive ? "Desactivar" : "Activar"}
        </Button>
      </div>
    </li>
  );
};

type AdminProjectDocumentsProps = {
  projectId: number;
};

export const AdminProjectDocuments = ({
  projectId,
}: AdminProjectDocumentsProps) => {
  const { addNotification } = useNotifications();
  const documentsQuery = useAdminProjectDocuments(projectId);
  const replaceMutation = useReplaceProjectDocument();
  const stateMutation = useChangeProjectDocumentState();
  const addMutation = useAddProjectDocument();

  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isBusy =
    replaceMutation.isPending ||
    stateMutation.isPending ||
    addMutation.isPending;

  const handleAdd = (type: AdminDocumentType, file: File) => {
    const label = DOCUMENT_TYPE_LABELS[type];

    setError(null);
    if (file.size > ADMIN_DOCUMENT_MAX_FILE_SIZE) {
      setError("El archivo no puede superar 5 MB");

      return;
    }
    addMutation.mutate(
      { projectId, type, file },
      {
        onSuccess: () =>
          addNotification({
            type: "success",
            title: "Documento agregado",
            message: `El ${label.toLowerCase()} quedó agregado al proyecto.`,
          }),
        onError: (mutationError) =>
          setError(mutationError.message || "No se pudo agregar el documento"),
      },
    );
  };

  const handleReplace = (document: AdminProjectDocument, file: File) => {
    const type = normalizeDocumentType(document.type);
    const label = type ? DOCUMENT_TYPE_LABELS[type] : "documento";

    setError(null);
    if (file.size > ADMIN_DOCUMENT_MAX_FILE_SIZE) {
      setError("El archivo no puede superar 5 MB");

      return;
    }
    replaceMutation.mutate(
      { projectId, documentId: Number(document.id), file, reason },
      {
        onSuccess: () => {
          setReason("");
          addNotification({
            type: "success",
            title: "Archivo reemplazado",
            message: `El ${label.toLowerCase()} del proyecto quedó actualizado.`,
          });
        },
        onError: (mutationError) =>
          setError(mutationError.message || "No se pudo reemplazar el archivo"),
      },
    );
  };

  const handleToggleState = (document: AdminProjectDocument) => {
    const nextState =
      normalizeDocumentState(document.state) === "ACTIVE"
        ? "INACTIVE"
        : "ACTIVE";

    setError(null);
    stateMutation.mutate(
      { projectId, documentId: Number(document.id), state: nextState, reason },
      {
        onSuccess: () => {
          setReason("");
          addNotification({
            type: "success",
            title:
              nextState === "ACTIVE"
                ? "Documento activado"
                : "Documento desactivado",
            message:
              nextState === "ACTIVE"
                ? "El documento vuelve a mostrarse en el proyecto."
                : "El documento ya no se muestra en el proyecto.",
          });
        },
        onError: (mutationError) =>
          setError(
            mutationError.message ||
              "No se pudo cambiar el estado del documento",
          ),
      },
    );
  };

  if (documentsQuery.isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Spinner size="sm" />
      </div>
    );
  }
  if (documentsQuery.isError) {
    return (
      <p className="text-sm text-danger" role="alert">
        No se pudieron cargar los documentos del proyecto.
      </p>
    );
  }

  const documents = documentsQuery.data ?? [];
  const groups = TYPE_ORDER.map((type) => ({
    type,
    documents: documents.filter(
      (document) => normalizeDocumentType(document.type) === type,
    ),
  }));

  return (
    <div className="space-y-4">
      <Input
        description="Opcional. Queda en el historial con cada reemplazo o cambio de estado (agregar un documento todavía no se registra en el historial)."
        isDisabled={isBusy}
        label="Motivo"
        maxLength={1000}
        value={reason}
        onValueChange={setReason}
      />
      {groups.map((group) => (
        <section
          key={group.type}
          aria-label={DOCUMENT_TYPE_LABELS[group.type]}
          className="space-y-2"
        >
          <h3 className="text-sm font-semibold">
            {DOCUMENT_TYPE_LABELS[group.type]}
          </h3>
          {group.documents.length === 0 ? (
            <p className="text-xs text-default-500">
              El proyecto no tiene este documento.
            </p>
          ) : (
            <ul className="space-y-2">
              {group.documents.map((document) => (
                <DocumentRow
                  key={document.id}
                  document={document}
                  isBusy={isBusy}
                  type={group.type}
                  onReplace={handleReplace}
                  onToggleState={handleToggleState}
                />
              ))}
            </ul>
          )}
          {/* Inactive documents count: reactivate or replace them instead of adding another */}
          {group.documents.length < DOCUMENT_TYPE_LIMITS[group.type] && (
            <AddDocumentButton
              isBusy={isBusy}
              isLoading={
                addMutation.isPending &&
                addMutation.variables?.type === group.type
              }
              type={group.type}
              onAdd={handleAdd}
            />
          )}
        </section>
      ))}
      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
