"use client";

import { useRef, useState } from "react";
import { Button } from "@heroui/button";
import {
  ExternalLink,
  FileText,
  FileArchive,
  FileBox,
  Upload,
  Route,
} from "lucide-react";
import { ProjectDocument } from "@/types/api";
import { StudentDashboardSectionCard } from "./student-dashboard-section-card";
import { useNotifications } from "@/components/ui/notifications";
import { api } from "@/lib/api-client";
import { useRouter } from "next/dist/client/components/navigation";
import ca from "zod/v4/locales/ca.cjs";

type StudentDashboardDocumentsSectionProps = {
  docsProject: ProjectDocument[];
  canEdit: boolean;
  projectId: number;
  eventId: number;
};

export const StudentDashboardDocumentsSection = ({
  docsProject,
  canEdit,
  projectId,
  eventId,
}: StudentDashboardDocumentsSectionProps) => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const secondaryFileInputRef = useRef<HTMLInputElement>(null);
  const secondaryReplaceInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSecondaryLoading, setIsSecondaryLoading] = useState(false);
  const [replacingDocumentId, setReplacingDocumentId] = useState<string | null>(
    null,
  );
  const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(
    null,
  );
  const { addNotification } = useNotifications();
  const primaryDocument =
    docsProject.find((doc) => doc.type === "POSTER") ?? docsProject[0];
  const secondaryDocuments = docsProject.filter((doc) => doc.type !== "POSTER");

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSecondaryUploadClick = () => {
    secondaryFileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      // If there is already a primary document, replace it via PATCH
      if (primaryDocument && primaryDocument.id) {
        const formData = new FormData();
        // Backend expects single `file` field for PATCH
        formData.append("file", file);
        // Keep type the same (POSTER) to avoid changing metadata
        formData.append("type", primaryDocument.type || "POSTER");

        await api.patch(`/projects/documents/${primaryDocument.id}`, formData);
      } else {
        // No existing primary: create via POST
        const formData = new FormData();
        formData.append("files", file);
        formData.append(
          "documents",
          JSON.stringify([
            {
              type: primaryDocument ? primaryDocument.type : "POSTER",
            },
          ]),
        );
        await api.post(`/projects/${projectId}/documents`, formData);
      }

      addNotification({
        type: "success",
        title: "Documento cargado",
        message:
          "El documento será revisado, necesitará confirmar los cambios.",
      });

      // Limpiar input para permitir subir el mismo archivo de nuevo
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      addNotification({
        type: "error",
        title: "Error al cargar documento",
        message: "No se pudo subir el documento. Intenta de nuevo.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSecondaryFilesChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsSecondaryLoading(true);
    try {
      const formData = new FormData();

      files.forEach((file) => {
        formData.append("files", file);
      });

      formData.append(
        "documents",
        JSON.stringify(
          files.map(() => ({
            type: "SUPPORTING_DOCUMENT",
          })),
        ),
      );

      await api.post(`/projects/${projectId}/documents`, formData);

      addNotification({
        type: "success",
        title: "Documentos secundarios cargados",
        message: "Los documentos se han subido correctamente.",
      });

      router.push(`/app/events/${eventId}/dashboard`);

      if (secondaryFileInputRef.current) {
        secondaryFileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error uploading secondary documents:", error);
      addNotification({
        type: "error",
        title: "Error al cargar documentos secundarios",
        message: "No se pudieron subir los documentos. Intenta de nuevo.",
      });
    } finally {
      setIsSecondaryLoading(false);
    }
  };

  const handleReplaceSecondaryFileClick = (documentId: string) => {
    setReplacingDocumentId(documentId);
    secondaryReplaceInputRef.current?.click();
  };

  const handleReplaceSecondaryFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    const documentId = replacingDocumentId;
    if (!file || !documentId) return;

    // Show loading state for the specific document being replaced
    setIsSecondaryLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      await api.patch(`/projects/documents/${documentId}`, formData);

      addNotification({
        type: "success",
        title: "Documento reemplazado",
        message: "El documento secundario fue reemplazado correctamente.",
      });

      if (secondaryReplaceInputRef.current) {
        secondaryReplaceInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error replacing secondary document:", error);
      addNotification({
        type: "error",
        title: "Error al reemplazar documento",
        message: "No se pudo reemplazar el documento. Intenta de nuevo.",
      });
    } finally {
      setIsSecondaryLoading(false);
      setReplacingDocumentId(null);
    }
  };

  const organizeSecondaryDocuments = () => {
    return [...secondaryDocuments].sort((a, b) => {
      if (a.createdAt !== b.createdAt) {
        return a.createdAt - b.createdAt;
      }

      return a.id.localeCompare(b.id);
    });
  };
  const orderedSecondaryDocuments = organizeSecondaryDocuments();

  return (
    <StudentDashboardSectionCard
      title="Documentos del proyecto"
      icon={FileText}
      ariaLabel="Documentacion del proyecto"
      className="space-y-4"
      action={
        canEdit ? (
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.png"
              aria-label="Seleccionar archivo de documento"
            />
          </div>
        ) : null
      }
    >
      <div className="space-y-3 border-t border-default-200/60 pt-4 mb-8">
        <div className="sm:flex xs:flex-col justify-between w-full">
          <p className="text-md font-semibold text-default-600">
            Documento principal
          </p>
          {canEdit && (
            <Button
              size="md"
              variant="flat"
              className="flex w-full items-center justify-center gap-1.5 text-sm font-semibold bg-sky-200/20 text-sky-300 hover:bg-sky-300/20 dark:hover:text-sky-400 sm:w-auto selected"
              aria-label="Subir documentos del proyecto"
              onPress={handleUploadClick}
              isLoading={isLoading}
              disabled={isLoading}
            >
              <Upload className="size-4" />
              {isLoading
                ? "Subiendo..."
                : primaryDocument
                  ? "Subir Poster"
                  : "Subir Poster"}
            </Button>
          )}
        </div>

        {primaryDocument ? (
          <a
            href={primaryDocument.url}
            target="_blank"
            rel="noreferrer"
            aria-label={`Ver documentación del proyecto: ${primaryDocument.type || "Documentación"} (abre en nueva pestaña)`}
            className="group flex w-full items-center justify-between gap-3 rounded-xl border border-default-200 bg-default-50/50 px-4 py-4 transition-colors hover:border-primary/50 hover:bg-primary/5"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div
                className="rounded-lg bg-primary/10 p-2 text-primary transition-transform group-hover:scale-105"
                aria-hidden="true"
              >
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-default-500">
                  Documentación del proyecto
                </p>
                <p className="truncate text-base font-semibold">
                  {primaryDocument.type || "Poster"}
                </p>
              </div>
            </div>
            <div
              className="rounded-lg bg-default-100 p-2 transition-colors group-hover:bg-primary/15"
              aria-hidden="true"
            >
              <ExternalLink className="h-4 w-4" />
            </div>
          </a>
        ) : (
          <p className="rounded-xl border border-default-200 bg-background p-4 text-sm text-default-500">
            No hay documentación principal registrada.
          </p>
        )}
      </div>

      {canEdit && (
        <div className="flex items-center justify-between gap-3 xs:flex-col xs:items-start">
          <div className="sm:flex xs:flex-col justify-between w-full">
            <p className="text-md font-semibold text-default-600 w-full">
              Documentos secundarios
            </p>
            <input
              ref={secondaryFileInputRef}
              type="file"
              multiple
              onChange={handleSecondaryFilesChange}
              className="hidden"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.png"
              aria-label="Seleccionar documentos secundarios"
            />

            <input
              ref={secondaryReplaceInputRef}
              type="file"
              onChange={handleReplaceSecondaryFileChange}
              className="hidden"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.png"
              aria-label="Seleccionar archivo de reemplazo"
            />
            <Button
              size="md"
              variant="flat"
              className="font-semibold flex w-full items-center justify-center text-sm bg-fuchsia-300/20 text-fuchsia-700 hover:bg-fuchsia-300/20 dark:text-fuchsia-300 dark:hover:text-fuchsia-200 sm:w-auto px-10"
              aria-label="Subir documentos secundarios"
              onPress={handleSecondaryUploadClick}
              isLoading={isSecondaryLoading}
              disabled={isSecondaryLoading}
            >
              <div className="flex items-center gap-1.5 p-2.5">
                <Upload className="size-4" />
                {isSecondaryLoading ? "Subiendo..." : "Subir secundarios"}
              </div>
            </Button>
          </div>
        </div>
      )}
      <div className="space-y-3 border-t border-default-200/60 pt-4">
        {orderedSecondaryDocuments.length > 0 ? (
          <ul className="space-y-3">
            {orderedSecondaryDocuments.map((document, idx) => (
              <li key={document.id}>
                <article className="flex items-center justify-between gap-3 rounded-xl border border-default-200 bg-default-50/50 px-4 py-3 transition-colors hover:border-fuchsia-200/50 hover:bg-fuchsia-300/10">
                  <a
                    href={document.url}
                    target="_blank"
                    rel="noreferrer"
                    className="min-w-0 flex-1"
                    aria-label={`Abrir documento secundario ${document.type || document.id}`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className="rounded-lg bg-primary/10 p-2 text-primary transition-transform group-hover:scale-105"
                        aria-hidden="true"
                      >
                        <FileBox className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-default-500">
                          Documentación del proyecto
                        </p>
                        <p className="truncate text-md font-semibold text-default-700">
                          {`${document.type} - ${idx + 1}` ||
                            "Documento secundario"}
                        </p>
                      </div>
                    </div>
                  </a>

                  {canEdit ? (
                    <div className="flex items-center gap-2">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="flat"
                        aria-label={`Reemplazar documento secundario ${document.type || document.id}`}
                        onPress={() =>
                          handleReplaceSecondaryFileClick(document.id)
                        }
                        isLoading={
                          replacingDocumentId === document.id &&
                          isSecondaryLoading
                        }
                        disabled={
                          replacingDocumentId === document.id &&
                          isSecondaryLoading
                        }
                      >
                        <Upload className="size-4" />
                      </Button>
                    </div>
                  ) : null}
                </article>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-dashed border-default-200 bg-background p-4 text-sm text-default-500">
            No hay documentos secundarios. Puedes añadirlos cuando lo necesites.
          </p>
        )}
      </div>
    </StudentDashboardSectionCard>
  );
};
