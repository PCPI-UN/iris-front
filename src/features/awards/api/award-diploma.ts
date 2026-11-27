import { saveFile } from "@/features/reports/api/download-evaluation-report";
import { api } from "@/lib/api-client";

/**
 * Award diploma of a project of the event, for the staff that manages it
 * (GET /events/:eventId/projects/:projectId/diploma, permission manage:events).
 * Same PDF the students download: only once the results are published and if
 * the project won an award; otherwise the backend message is shown as an error
 * notification.
 */
export const getProjectDiploma = (eventId: number, projectId: number) =>
  api.download(`/events/${eventId}/projects/${projectId}/diploma`, {
    headers: { Accept: "application/pdf" },
  });

/** Fallback when the backend does not send Content-Disposition */
export const getProjectDiplomaFallbackName = (projectId: number) =>
  `diploma_proyecto_${projectId}.pdf`;

export const downloadProjectDiploma = async (
  eventId: number,
  projectId: number,
) => {
  const { blob, fileName } = await getProjectDiploma(eventId, projectId);

  saveFile(blob, fileName ?? getProjectDiplomaFallbackName(projectId));
};

/**
 * Diplomas of every winner of the event in one PDF, one page per project
 * (GET /events/:eventId/diplomas, permission manage:events). Same rules as the
 * single one; the backend message is shown as an error notification.
 */
export const getEventDiplomas = (eventId: number) =>
  api.download(`/events/${eventId}/diplomas`, {
    headers: { Accept: "application/pdf" },
  });

export const getEventDiplomasFallbackName = (eventId: number) =>
  `diplomas_evento_${eventId}.pdf`;

export const downloadEventDiplomas = async (eventId: number) => {
  const { blob, fileName } = await getEventDiplomas(eventId);

  saveFile(blob, fileName ?? getEventDiplomasFallbackName(eventId));
};
