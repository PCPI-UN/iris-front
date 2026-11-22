import {
  formatPoints,
  ScoreLevelOption,
} from "@/features/grading-scales/utils/grading-scale";

type ScoreLevelPickerProps = {
  criterionName: string;
  options: ScoreLevelOption[];
  value?: number;
  onChange: (level: number) => void;
};

/**
 * Los 4 niveles de la escala del evento para un criterio, con su etiqueta y sus puntos. Se
 * envía el nivel (1-4); el backend lo convierte en los puntos de la escala.
 */
export const ScoreLevelPicker = ({
  criterionName,
  options,
  value,
  onChange,
}: ScoreLevelPickerProps) => {
  return (
    <div className="space-y-2" role="radiogroup" aria-label={criterionName}>
      <div className="flex justify-between text-xs md:text-sm text-muted-foreground px-1">
        {options.map((option) => (
          <span key={option.value} className="flex-1 w-full text-center">
            <span className="block">{option.label}</span>
            {option.points !== undefined && (
              <span className="block text-[11px] md:text-xs text-primary">
                {formatPoints(option.points)} pts
              </span>
            )}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2 md:gap-4 bg-muted/5 border-border rounded-lg p-3 md:p-4">
        {options.map((option) => {
          const isSelected = value === option.value;
          const accessibleName =
            option.points !== undefined
              ? `${option.label} (${formatPoints(option.points)} puntos)`
              : option.label;

          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={accessibleName}
              onClick={() => onChange(option.value)}
              className="flex flex-col items-center gap-2 cursor-pointer group flex-1"
            >
              <div
                className={`h-6 w-6 md:h-7 md:w-7 rounded-full border-2 flex items-center justify-center transition-all ${
                  isSelected
                    ? "border-primary bg-primary shadow-md scale-110"
                    : "border-muted-foreground/30 group-hover:border-muted-foreground/50"
                }`}
              >
                {isSelected && (
                  <div className="h-3 w-3 md:h-3.5 md:w-3.5 rounded-full bg-primary-foreground" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
