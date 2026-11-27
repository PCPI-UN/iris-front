import type {
  ProjectImportExecuteResponse,
  ProjectImportPreviewResponse,
} from "../types/project-import";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  MAX_PROJECT_IMPORT_FILE_SIZE_BYTES,
  normalizeProjectImportExecute,
  normalizeProjectImportPreview,
} from "../utils/project-import-helpers";

import {
  parseValidEventId,
  sanitizeDownloadFileName,
  triggerBlobDownload,
  validateExcelFile,
  XLSX_MIME_TYPE,
} from "@/features/imports/utils/excel-file";
import { api } from "@/lib/api-client";

const requireEventId = (eventId: number) => {
  const safeEventId = parseValidEventId(eventId);

  if (!safeEventId) {
    throw new Error("Selecciona un evento válido antes de continuar.");
  }

  return safeEventId;
};

const buildFileForm = async (file: File) => {
  const fileError = await validateExcelFile(
    file,
    MAX_PROJECT_IMPORT_FILE_SIZE_BYTES,
  );

  if (fileError) throw new Error(fileError);
  const formData = new FormData();

  formData.append("file", file);

  return formData;
};

export const downloadProjectImportTemplate = async ({
  eventId,
}: {
  eventId: number;
}): Promise<string> => {
  const safeEventId = requireEventId(eventId);
  const { blob, fileName } = await api.download(
    `/events/${safeEventId}/project-imports/template`,
    { headers: { Accept: XLSX_MIME_TYPE }, suppressErrorNotification: true },
  );
  const safeName = sanitizeDownloadFileName(
    fileName,
    `plantilla_proyectos_evento_${safeEventId}.xlsx`,
  );

  triggerBlobDownload(blob, safeName);

  return safeName;
};

export const previewProjectImport = async ({
  eventId,
  file,
}: {
  eventId: number;
  file: File;
}): Promise<ProjectImportPreviewResponse> => {
  const safeEventId = requireEventId(eventId);
  const raw = await api.post<unknown>(
    `/events/${safeEventId}/project-imports/preview`,
    await buildFileForm(file),
    { suppressErrorNotification: true },
  );

  return normalizeProjectImportPreview(raw);
};

export const executeProjectImport = async ({
  eventId,
  file,
}: {
  eventId: number;
  file: File;
}): Promise<ProjectImportExecuteResponse> => {
  const safeEventId = requireEventId(eventId);
  const raw = await api.post<unknown>(
    `/events/${safeEventId}/project-imports/execute`,
    await buildFileForm(file),
    { suppressErrorNotification: true },
  );

  return normalizeProjectImportExecute(raw);
};

export const usePreviewProjectImport = () =>
  useMutation({ mutationFn: previewProjectImport });

export const useExecuteProjectImport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: executeProjectImport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["projects-with-jurors"] });
    },
  });
};
