/**
 * Escalas de calificación: cada evento usa una escala de 4 niveles del catálogo
 * (`GET /grading-scales`). El jurado escoge un nivel (1-4) por criterio y el backend
 * lo convierte en los puntos de la escala del evento.
 */

export const GRADING_SCALE_LEVELS = 4;
export const MAX_SCALE_NAME_LENGTH = 100;
export const MAX_LEVEL_LABEL_LENGTH = 50;
export const MAX_LEVEL_POINTS = 99999.99;

export type GradingScaleLevel = {
  /** Nivel que escoge el jurado, de 1 (más bajo) a 4 (más alto) */
  level: number;
  label: string;
  points: number;
};

export type GradingScale = {
  id: number;
  name: string;
  description?: string;
  /** Escalas del sistema: de solo lectura */
  isSystem: boolean;
  /** FINAL_PROJECTS, ZERO_TO_FIVE o ZERO_TO_HUNDRED en las escalas del sistema */
  code?: string;
  levels: GradingScaleLevel[];
  /**
   * El backend la marca bloqueada cuando es del sistema o cuando un evento que la usa ya
   * tiene evaluaciones; ya no se puede editar ni borrar.
   */
  locked: boolean;
};

/** Escala nueva tal como se escribe en el formulario: los puntos son texto hasta validarlos. */
export type GradingScaleDraft = {
  name: string;
  levels: { label: string; points: string }[];
};

export type GradingScaleInput = {
  name: string;
  levels: GradingScaleLevel[];
};

export type GradingScaleDraftErrors = {
  name?: string;
  levels: { label?: string; points?: string }[];
  /** Error que no es de un campo: los puntos no crecen del nivel 1 al 4 */
  form?: string;
};

/** Etiquetas de la escala "Proyectos finales", la que el backend da por defecto. */
export const DEFAULT_LEVEL_LABELS = ["Insuficiente", "Aceptable", "Bueno", "Excelente"];

export const createEmptyScaleDraft = (): GradingScaleDraft => ({
  name: "",
  levels: DEFAULT_LEVEL_LABELS.map((label) => ({ label, points: "" })),
});

const toNumber = (value: unknown): number | undefined => {
  const numeric = typeof value === "string" ? Number(value) : value;
  return typeof numeric === "number" && Number.isFinite(numeric) ? numeric : undefined;
};

export const sortLevels = (levels: GradingScaleLevel[]): GradingScaleLevel[] =>
  [...levels].sort((a, b) => a.level - b.level);

/** Escala de la respuesta del backend; `null` si no trae una escala usable. */
export const normalizeGradingScale = (raw: unknown): GradingScale | null => {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, any>;
  const id = toNumber(value.id);
  if (id === undefined) return null;

  const levels = Array.isArray(value.levels)
    ? value.levels
        .map((level: any) => ({
          level: toNumber(level?.level),
          label: typeof level?.label === "string" ? level.label : "",
          points: toNumber(level?.points),
        }))
        .filter(
          (level: { level?: number; points?: number }): level is GradingScaleLevel =>
            level.level !== undefined && level.points !== undefined,
        )
    : [];

  return {
    id,
    name: typeof value.name === "string" ? value.name : "",
    description: typeof value.description === "string" && value.description ? value.description : undefined,
    isSystem: value.isSystem === true,
    code: typeof value.code === "string" && value.code ? value.code : undefined,
    levels: sortLevels(levels),
    locked: value.locked === true,
  };
};

/** Lista de escalas de `GET /grading-scales` (arreglo o envuelta en `scales`/`data`). */
export const normalizeGradingScales = (raw: unknown): GradingScale[] => {
  const value = raw as Record<string, any> | unknown[] | null | undefined;
  const list = Array.isArray(value)
    ? value
    : Array.isArray(value?.scales)
      ? value.scales
      : Array.isArray(value?.data)
        ? value.data
        : Array.isArray(value?.data?.scales)
          ? value.data.scales
          : [];
  return list
    .map((scale: unknown) => normalizeGradingScale(scale))
    .filter((scale: GradingScale | null): scale is GradingScale => scale !== null);
};

const hasAtMostTwoDecimals = (value: number) =>
  Math.abs(Math.round(value * 100) - value * 100) < 1e-6;

/**
 * Revisa una escala nueva antes de enviarla, con las mismas reglas del backend: nombre,
 * exactamente 4 niveles con etiqueta, puntos entre 0 y 99999.99 con máximo 2 decimales,
 * y puntos que crecen estrictamente del nivel 1 al 4.
 */
export const validateGradingScaleDraft = (
  draft: GradingScaleDraft,
): { errors: GradingScaleDraftErrors; isValid: boolean } => {
  const errors: GradingScaleDraftErrors = { levels: draft.levels.map(() => ({})) };
  const name = draft.name.trim();

  if (!name) {
    errors.name = "Escribe el nombre de la escala.";
  } else if (name.length > MAX_SCALE_NAME_LENGTH) {
    errors.name = `El nombre puede tener máximo ${MAX_SCALE_NAME_LENGTH} caracteres.`;
  }

  if (draft.levels.length !== GRADING_SCALE_LEVELS) {
    errors.form = `La escala debe tener exactamente ${GRADING_SCALE_LEVELS} niveles.`;
    return { errors, isValid: false };
  }

  const points: (number | undefined)[] = draft.levels.map((level, index) => {
    const label = level.label.trim();
    if (!label) {
      errors.levels[index].label = "Escribe la etiqueta del nivel.";
    } else if (label.length > MAX_LEVEL_LABEL_LENGTH) {
      errors.levels[index].label = `Máximo ${MAX_LEVEL_LABEL_LENGTH} caracteres.`;
    }

    const raw = level.points.trim();
    const value = raw === "" ? undefined : Number(raw);
    if (value === undefined || !Number.isFinite(value)) {
      errors.levels[index].points = "Escribe los puntos del nivel.";
      return undefined;
    }
    if (value < 0 || value > MAX_LEVEL_POINTS) {
      errors.levels[index].points = `Entre 0 y ${MAX_LEVEL_POINTS}.`;
      return undefined;
    }
    if (!hasAtMostTwoDecimals(value)) {
      errors.levels[index].points = "Máximo 2 decimales.";
      return undefined;
    }
    return value;
  });

  if (points.every((value) => value !== undefined)) {
    for (let index = 1; index < points.length; index++) {
      if ((points[index] as number) <= (points[index - 1] as number)) {
        errors.levels[index].points = `Debe ser mayor que el nivel ${index} (${points[index - 1]}).`;
        errors.form = "Los puntos deben crecer del nivel 1 al nivel 4.";
      }
    }
  }

  const isValid =
    !errors.name && !errors.form && errors.levels.every((level) => !level.label && !level.points);
  return { errors, isValid };
};

/** Cuerpo de `POST /grading-scales` de una escala nueva ya validada. */
export const toGradingScaleInput = (draft: GradingScaleDraft): GradingScaleInput => ({
  name: draft.name.trim(),
  levels: draft.levels.map((level, index) => ({
    level: index + 1,
    label: level.label.trim(),
    points: Number(level.points.trim()),
  })),
});

/**
 * Si el selector de escala del evento debe aparecer deshabilitado.
 *
 * El backend no dice si el evento ya tiene evaluaciones: `locked` es verdadero en las escalas del
 * sistema siempre, y en una escala propia cuando algún evento que la usa ya tiene evaluaciones.
 * Por eso solo se deshabilita con una escala propia bloqueada; con una escala del sistema el
 * cambio se intenta y, si el evento ya tiene evaluaciones, el backend lo rechaza.
 */
export const isEventScaleLocked = (scale: GradingScale | null | undefined): boolean =>
  Boolean(scale && scale.locked && !scale.isSystem);

export const formatPoints = (points: number): string =>
  Number.isInteger(points) ? String(points) : points.toFixed(2).replace(/0$/, "");

/** Opciones que ve el jurado: etiqueta y puntos de cada nivel de la escala del evento. */
export type ScoreLevelOption = { value: number; label: string; points?: number };

export const toScoreLevelOptions = (scale: GradingScale | null | undefined): ScoreLevelOption[] => {
  if (scale && scale.levels.length === GRADING_SCALE_LEVELS) {
    return sortLevels(scale.levels).map((level) => ({
      value: level.level,
      label: level.label,
      points: level.points,
    }));
  }
  // Sin la escala del evento: los 4 niveles con las etiquetas por defecto, sin puntos
  return DEFAULT_LEVEL_LABELS.map((label, index) => ({ value: index + 1, label }));
};
