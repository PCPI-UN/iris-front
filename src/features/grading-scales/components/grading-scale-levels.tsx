import { formatPoints, GradingScaleLevel, sortLevels } from "../utils/grading-scale";

type GradingScaleLevelsProps = {
  levels: GradingScaleLevel[];
};

/** Los 4 niveles de una escala con su etiqueta y sus puntos. */
export const GradingScaleLevels = ({ levels }: GradingScaleLevelsProps) => {
  return (
    <ol
      aria-label="Niveles de la escala"
      className="grid grid-cols-2 gap-2 sm:grid-cols-4"
    >
      {sortLevels(levels).map((level) => (
        <li
          key={level.level}
          className="rounded-lg border border-default-200 bg-default-50/60 px-3 py-2"
        >
          <p className="text-xs text-default-500">Nivel {level.level}</p>
          <p className="truncate text-sm font-medium" title={level.label}>
            {level.label}
          </p>
          <p className="text-sm text-primary">{formatPoints(level.points)} pts</p>
        </li>
      ))}
    </ol>
  );
};
