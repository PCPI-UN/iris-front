export const EVENT_TYPE = {
  EXPOSITION: 1,
  COMPETITION: 2,
} as const;

export const EVALUATION_TYPE = {
  ZERO_TO_FIVE: 1,
  ZERO_TO_HUNDRED: 2,
  FINAL_PROJECTS: 3,
} as const;

export type EventTypeCode =
  | typeof EVENT_TYPE.EXPOSITION
  | typeof EVENT_TYPE.COMPETITION;

export type EvaluationTypeCode =
  | typeof EVALUATION_TYPE.ZERO_TO_FIVE
  | typeof EVALUATION_TYPE.ZERO_TO_HUNDRED
  | typeof EVALUATION_TYPE.FINAL_PROJECTS;

export type EventTypeInput = EventTypeCode | "Exposition" | "Competition" | string;
export type EvaluationTypeInput =
  | EvaluationTypeCode
  | "ZERO_TO_FIVE"
  | "ZERO_TO_HUNDRED"
  | "FINAL_PROJECTS"
  | "0-5"
  | "0-100"
  | "Proyectos Finales"
  | string;

export const toEventTypeCode = (value: unknown): EventTypeCode => {
  if (value === EVENT_TYPE.EXPOSITION || value === "Exposition" || value === "1") {
    return EVENT_TYPE.EXPOSITION;
  }

  if (value === EVENT_TYPE.COMPETITION || value === "Competition" || value === "2") {
    return EVENT_TYPE.COMPETITION;
  }

  return EVENT_TYPE.EXPOSITION;
};

export const toEvaluationTypeCode = (value: unknown): EvaluationTypeCode => {
  if (
    value === EVALUATION_TYPE.ZERO_TO_FIVE ||
    value === "ZERO_TO_FIVE" ||
    value === "0-5" ||
    value === "1"
  ) {
    return EVALUATION_TYPE.ZERO_TO_FIVE;
  }

  if (
    value === EVALUATION_TYPE.ZERO_TO_HUNDRED ||
    value === "ZERO_TO_HUNDRED" ||
    value === "0-100" ||
    value === "2"
  ) {
    return EVALUATION_TYPE.ZERO_TO_HUNDRED;
  }

  if (
    value === EVALUATION_TYPE.FINAL_PROJECTS ||
    value === "FINAL_PROJECTS" ||
    value === "Proyectos Finales" ||
    value === "3"
  ) {
    return EVALUATION_TYPE.FINAL_PROJECTS;
  }

  return EVALUATION_TYPE.FINAL_PROJECTS;
};

export const toEventTypeLabel = (value: unknown): "Exposition" | "Competition" => {
  return toEventTypeCode(value) === EVENT_TYPE.COMPETITION
    ? "Competition"
    : "Exposition";
};

export const toEvaluationTypeLabel = (
  value: unknown,
): "ZERO_TO_FIVE" | "ZERO_TO_HUNDRED" | "FINAL_PROJECTS" => {
  const evaluationTypeCode = toEvaluationTypeCode(value);

  if (evaluationTypeCode === EVALUATION_TYPE.FINAL_PROJECTS) {
    return "FINAL_PROJECTS";
  }

  return evaluationTypeCode === EVALUATION_TYPE.ZERO_TO_HUNDRED
    ? "ZERO_TO_HUNDRED"
    : "ZERO_TO_FIVE";
};
