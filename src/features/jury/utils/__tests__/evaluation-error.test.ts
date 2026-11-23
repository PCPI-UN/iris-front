import {
  jurorEvaluationErrorMessage,
  RUBRIC_NOT_READY_MESSAGE,
} from "../evaluation-error";

test("a rubric that is not ready is explained without component ids", () => {
  expect(
    jurorEvaluationErrorMessage(
      "La rúbrica de evaluación de este proyecto no está lista: componentes sin criterios para esta categoría: 3",
    ),
  ).toBe(RUBRIC_NOT_READY_MESSAGE);
  expect(
    jurorEvaluationErrorMessage(
      "No hay criterios de evaluación configurados para este proyecto",
    ),
  ).toBe(RUBRIC_NOT_READY_MESSAGE);
});

test("other reasons reach the juror as the backend wrote them", () => {
  expect(
    jurorEvaluationErrorMessage(
      "Las evaluaciones no están abiertas para este evento",
    ),
  ).toBe("Las evaluaciones no están abiertas para este evento");
});
