import {
  GradingScale,
  GradingScaleDraft,
  GradingScaleInput,
  toGradingScaleInput,
  validateGradingScaleDraft,
} from "./grading-scale";

/** Escala escogida en el formulario del evento: una del catálogo o una nueva por crear. */
export type GradingScaleSelection =
  | { mode: "catalog"; scaleId: number | null }
  | { mode: "new"; draft: GradingScaleDraft };

export class InvalidGradingScaleDraftError extends Error {
  constructor() {
    super("La escala nueva tiene campos inválidos.");
    this.name = "InvalidGradingScaleDraftError";
  }
}

/**
 * Id de escala que se envía con el evento. Una escala nueva se crea primero en el catálogo
 * (`createScale`), porque crear y editar evento solo reciben `gradingScaleId`.
 */
export const resolveGradingScaleId = async (
  selection: GradingScaleSelection,
  createScale: (input: GradingScaleInput) => Promise<GradingScale>,
): Promise<{ scaleId: number | undefined; created?: GradingScale }> => {
  if (selection.mode === "catalog") {
    return { scaleId: selection.scaleId ?? undefined };
  }

  if (!validateGradingScaleDraft(selection.draft).isValid) {
    throw new InvalidGradingScaleDraftError();
  }

  const created = await createScale(toGradingScaleInput(selection.draft));
  return { scaleId: created.id, created };
};
