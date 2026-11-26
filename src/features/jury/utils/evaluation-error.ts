// The backend explains a rubric that is not ready in admin terms (component and criterion ids).
// The juror cannot fix it, so they get what to do instead; other reasons are already for them.
const RUBRIC_NOT_READY_PREFIXES = [
  "La rúbrica de evaluación de este proyecto no está lista",
  "No hay criterios de evaluación configurados",
];

export const RUBRIC_NOT_READY_MESSAGE =
  "Este proyecto aún no se puede calificar porque su rúbrica no está completa. Avísale al organizador del evento.";

export const jurorEvaluationErrorMessage = (message?: string) => {
  if (!message) return "No se pudo enviar la evaluación. Intenta de nuevo.";

  return RUBRIC_NOT_READY_PREFIXES.some((prefix) => message.startsWith(prefix))
    ? RUBRIC_NOT_READY_MESSAGE
    : message;
};
