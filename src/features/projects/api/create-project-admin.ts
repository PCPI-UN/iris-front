import { useMutation, useQueryClient } from "@tanstack/react-query";

import { ApiError, api } from "@/lib/api-client";
import { Project } from "@/types/api";

/** Initial state chosen by the admin; the backend defaults to APPROVED */
export type AdminInitialProjectState = "APPROVED" | "UNDER_REVIEW";

export const ADMIN_INITIAL_STATE_LABELS: Record<
  AdminInitialProjectState,
  string
> = {
  APPROVED: "Aprobado",
  UNDER_REVIEW: "En revisión",
};

export type CreateProjectAdminResponse = {
  project: Project;
  participants: unknown[];
  /** What failed after the project was saved (documents, tutors, emails); the project stays created */
  failedEffects: string[];
  /** Spanish explanation of failedEffects; null when nothing failed */
  warning: string | null;
};

/**
 * POST /projects/admin (manage:projects): same multipart fields as
 * POST /projects plus `state`. Skips the inscription deadline and
 * isPubliclyJoinable; the rest of the validations stay.
 */
export const createProjectAdmin = async ({
  data,
  state,
}: {
  data: FormData;
  state: AdminInitialProjectState;
}): Promise<CreateProjectAdminResponse> => {
  data.set("state", state);
  const response = await api.post<Partial<CreateProjectAdminResponse>>(
    "/projects/admin",
    data,
    // The form shows its own messages
    { suppressErrorNotification: true },
  );

  return {
    project: response.project as Project,
    participants: response.participants ?? [],
    failedEffects: response.failedEffects ?? [],
    warning: response.warning ?? null,
  };
};

export const useCreateProjectAdmin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProjectAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["projects-with-jurors"] });
    },
  });
};

/** `code` of the 409 errors of POST /projects/admin */
export const CREATE_PROJECT_CONFLICTS = {
  PROJECT_NAME_TAKEN:
    "Ya existe un proyecto con ese nombre en el evento. Usa otro nombre.",
  PARTICIPANT_IN_OTHER_PROJECT:
    "Uno o más integrantes ya están en otro proyecto de este evento.",
  EVENT_RESULTS_PUBLISHED:
    "El evento ya publicó sus resultados: no se pueden crear proyectos nuevos.",
} as const;

export const getCreateProjectAdminErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError) {
    if (error.status === 409 && error.code) {
      const known =
        CREATE_PROJECT_CONFLICTS[
          error.code as keyof typeof CREATE_PROJECT_CONFLICTS
        ];

      if (known) return known;
    }
    if (error.status === 403) {
      return "No tienes permiso (manage:projects) para crear proyectos.";
    }
    if (error.status === 404) {
      return "No encontramos el evento, la categoría o el NRC indicado.";
    }
    if (error.message) return error.message;
  }

  return "No se pudo crear el proyecto. Intenta de nuevo.";
};

const FAILED_EFFECT_LABELS: Record<string, string> = {
  DOCUMENTS: "No se pudieron subir los documentos.",
  DOCUMENT_UPLOAD: "No se pudieron subir los documentos.",
  TUTOR_ACTIVATION: "No se pudieron activar los tutores.",
  TUTORS: "No se pudieron registrar los tutores.",
  NOTIFICATION: "No se pudieron registrar los correos de aprobación.",
};

/** Spanish label of each failed effect; unknown values are shown as they come */
export const getFailedEffectLabel = (effect: string) =>
  FAILED_EFFECT_LABELS[effect] ?? effect;

/** true when the documents have to be uploaded again from the project editor */
export const hasFailedDocuments = (failedEffects: string[]) =>
  failedEffects.some((effect) => effect.includes("DOCUMENT"));
