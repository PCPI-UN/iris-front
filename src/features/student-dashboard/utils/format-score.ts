/**
 * Formatea una nota sin asumir la escala del evento (5, 90 o 100 según su
 * `evaluationType`): máximo dos decimales y sin ceros de relleno.
 * 81 -> "81", 86.25 -> "86.25", 4.5 -> "4.5"
 */
export const formatScore = (value: number): string =>
  Number(value.toFixed(2)).toString();

/** "81 / 90" cuando el backend envía el máximo de la escala; si no, solo la nota. */
export const formatScoreWithMax = (
  value: number,
  maxScore?: number | null,
): string =>
  maxScore != null && maxScore > 0
    ? `${formatScore(value)} / ${formatScore(maxScore)}`
    : formatScore(value);

/** Porcentaje de la nota sobre el máximo; null si no se conoce la escala. */
export const scorePercentOf = (
  value: number,
  maxScore?: number | null,
): number | null =>
  maxScore != null && maxScore > 0
    ? Math.max(0, Math.min(100, Math.round((value / maxScore) * 100)))
    : null;
