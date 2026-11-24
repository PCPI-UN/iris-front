import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api-client";

import type {
  JurorImportExecuteResponse,
  JurorImportPreviewResponse,
} from "../types/juror-import";
import {
  normalizeExecuteResponse,
  normalizePreviewResponse,
  parseValidEventId,
  sanitizeDownloadFileName,
  validateExcelFile,
  XLSX_MIME_TYPE,
} from "../utils/juror-import-helpers";

export const triggerBlobDownload = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

export const downloadJurorImportTemplate = async ({
  eventId,
}: {
  eventId: number;
}): Promise<string> => {
  const safeEventId = parseValidEventId(eventId);
  if (!safeEventId) {
    throw new Error("Selecciona un evento válido para descargar la plantilla.");
  }

  const { blob, fileName } = await api.download(
    `/events/${safeEventId}/juror-imports/template`,
    {
      headers: { Accept: XLSX_MIME_TYPE },
      suppressErrorNotification: true,
    },
  );

  const safeName = sanitizeDownloadFileName(
    fileName,
    `plantilla_jurados_evento_${safeEventId}.xlsx`,
  );
  triggerBlobDownload(blob, safeName);
  return safeName;
};

export const previewJurorImport = async ({
  eventId,
  file,
}: {
  eventId: number;
  file: File;
}): Promise<JurorImportPreviewResponse> => {
  const safeEventId = parseValidEventId(eventId);
  if (!safeEventId) {
    throw new Error("Selecciona un evento válido antes de validar el archivo.");
  }

  const fileError = await validateExcelFile(file);
  if (fileError) {
    throw new Error(fileError);
  }

  const formData = new FormData();
  formData.append("file", file);

  const raw = await api.post<unknown>(
    `/events/${safeEventId}/juror-imports/preview`,
    formData,
    { suppressErrorNotification: true },
  );

  return normalizePreviewResponse(raw);
};

export const executeJurorImport = async ({
  eventId,
  file,
}: {
  eventId: number;
  file: File;
}): Promise<JurorImportExecuteResponse> => {
  const safeEventId = parseValidEventId(eventId);
  if (!safeEventId) {
    throw new Error("Selecciona un evento válido antes de ejecutar la asignación.");
  }

  const fileError = await validateExcelFile(file);
  if (fileError) {
    throw new Error(fileError);
  }

  const formData = new FormData();
  formData.append("file", file);

  const raw = await api.post<unknown>(
    `/events/${safeEventId}/juror-imports/execute`,
    formData,
    { suppressErrorNotification: true },
  );

  return normalizeExecuteResponse(raw);
};

export const usePreviewJurorImport = () => {
  return useMutation({
    mutationFn: previewJurorImport,
  });
};

export const useExecuteJurorImport = () => {
  const queryClient = useQueryClient();

  const invalidateAssignmentQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["projects"] });
    queryClient.invalidateQueries({ queryKey: ["projects-with-jurors"] });
    queryClient.invalidateQueries({ queryKey: ["juries"] });
    queryClient.invalidateQueries({ queryKey: ["jury-invitations"] });
    queryClient.invalidateQueries({ queryKey: ["event-juries"] });
  };

  return useMutation({
    mutationFn: executeJurorImport,
    onSuccess: invalidateAssignmentQueries,
    onError: (error: any) => {
      // Case 400 { message, invitedJurors } already sent invitations on backend
      if (
        error?.status === 400 &&
        error?.data &&
        Array.isArray(error.data.invitedJurors)
      ) {
        invalidateAssignmentQueries();
      }
    },
  });
};

