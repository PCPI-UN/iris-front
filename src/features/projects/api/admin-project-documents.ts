import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { invalidateProjectQueries } from "./admin-change-project-state";

import { api } from "@/lib/api-client";

export type AdminDocumentType = "LOGO" | "POSTER" | "SUPPORTING_DOCUMENT";
export type AdminDocumentState = "ACTIVE" | "INACTIVE";

/** Document of GET /projects/:id/admin/documents; `url` is signed for 1 hour */
export type AdminProjectDocument = {
  id: number;
  projectId: number;
  url: string;
  /** Proto enum name; some readers still get the number (1 LOGO, 2 POSTER, 3 SUPPORTING_DOCUMENT) */
  type: AdminDocumentType | number | string;
  /** Proto enum name; some readers still get the number (1 ACTIVE, 2 INACTIVE) */
  state: AdminDocumentState | number | string;
  createdAt?: string;
  updatedAt?: string;
};

/** Largest file the gateway accepts when an administrator replaces a document */
export const ADMIN_DOCUMENT_MAX_FILE_SIZE = 5 * 1024 * 1024;

const DOCUMENT_TYPES: AdminDocumentType[] = [
  "LOGO",
  "POSTER",
  "SUPPORTING_DOCUMENT",
];

export const DOCUMENT_TYPE_LABELS: Record<AdminDocumentType, string> = {
  LOGO: "Logo",
  POSTER: "Póster",
  SUPPORTING_DOCUMENT: "Documento de soporte",
};

export const normalizeDocumentType = (
  type: AdminProjectDocument["type"],
): AdminDocumentType | null => {
  if (typeof type === "number") return DOCUMENT_TYPES[type - 1] ?? null;
  const name = String(type).toUpperCase();

  if (name === "ASSOCIATED_DOCUMENT") return "SUPPORTING_DOCUMENT";

  return (DOCUMENT_TYPES as string[]).includes(name)
    ? (name as AdminDocumentType)
    : null;
};

export const normalizeDocumentState = (
  state: AdminProjectDocument["state"],
): AdminDocumentState => {
  if (state === 2 || String(state).toUpperCase() === "INACTIVE") {
    return "INACTIVE";
  }

  return "ACTIVE";
};

export const getAdminProjectDocuments = async (
  projectId: number,
): Promise<AdminProjectDocument[]> => {
  const response = await api.get<{ items?: AdminProjectDocument[] }>(
    `/projects/${projectId}/admin/documents`,
  );

  return response?.items ?? [];
};

/** Every document of the project, INACTIVE ones included (manage:projects) */
export const useAdminProjectDocuments = (projectId: number) =>
  useQuery({
    queryKey: ["admin-project-documents", projectId],
    queryFn: () => getAdminProjectDocuments(projectId),
  });

export type ReplaceProjectDocumentInput = {
  projectId: number;
  documentId: number;
  file: File;
  reason?: string;
};

export const replaceProjectDocument = ({
  projectId,
  documentId,
  file,
  reason,
}: ReplaceProjectDocumentInput): Promise<AdminProjectDocument> => {
  const body = new FormData();

  body.append("file", file);
  if (reason?.trim()) body.append("reason", reason.trim());

  return api.put(`/projects/${projectId}/admin/documents/${documentId}`, body, {
    suppressErrorNotification: true,
  });
};

export type ChangeProjectDocumentStateInput = {
  projectId: number;
  documentId: number;
  state: AdminDocumentState;
  reason?: string;
};

export const changeProjectDocumentState = ({
  projectId,
  documentId,
  state,
  reason,
}: ChangeProjectDocumentStateInput): Promise<AdminProjectDocument> =>
  api.patch(
    `/projects/${projectId}/admin/documents/${documentId}/state`,
    { state, reason: reason?.trim() || undefined },
    { suppressErrorNotification: true },
  );

export const useReplaceProjectDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: replaceProjectDocument,
    onSuccess: (_data, { projectId }) =>
      invalidateProjectQueries(queryClient, projectId),
  });
};

export const useChangeProjectDocumentState = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: changeProjectDocumentState,
    onSuccess: (_data, { projectId }) =>
      invalidateProjectQueries(queryClient, projectId),
  });
};
