"use client";

import { useEffect, useMemo } from "react";

import { Input } from "@/components/ui/input";
import { Select, SelectItem } from "@/components/ui/select";

import { useGradingScales } from "../api/get-grading-scales";
import {
  createEmptyScaleDraft,
  GradingScale,
  GradingScaleDraft,
  validateGradingScaleDraft,
} from "../utils/grading-scale";
import { GradingScaleSelection } from "../utils/grading-scale-selection";
import { GradingScaleLevels } from "./grading-scale-levels";

const NEW_SCALE_KEY = "new";

/** Escala por defecto del backend para un evento nuevo: "Proyectos finales". */
const pickDefaultScale = (scales: GradingScale[]): GradingScale | undefined =>
  scales.find((scale) => scale.code === "FINAL_PROJECTS") ?? scales[0];

type GradingScaleFieldProps = {
  value: GradingScaleSelection;
  onChange: (value: GradingScaleSelection) => void;
  /** Escala actual del evento al editar; se lista aunque no venga en el catálogo */
  currentScale?: GradingScale | null;
  /** Preselecciona la escala por defecto cuando no hay ninguna escogida (crear evento) */
  selectDefault?: boolean;
  isDisabled?: boolean;
  disabledReason?: string;
  /** Muestra los errores de cada campo de la escala nueva (después de intentar guardar) */
  showErrors?: boolean;
};

/**
 * Escala de calificación del evento: una del catálogo (`GET /grading-scales`), con sus 4 niveles a
 * la vista, o una nueva con nombre y 4 niveles (etiqueta y puntos).
 */
export const GradingScaleField = ({
  value,
  onChange,
  currentScale,
  selectDefault = false,
  isDisabled = false,
  disabledReason,
  showErrors = false,
}: GradingScaleFieldProps) => {
  const scalesQuery = useGradingScales();

  const scales = useMemo(() => {
    const catalog = scalesQuery.data ?? [];
    if (currentScale && !catalog.some((scale) => scale.id === currentScale.id)) {
      return [currentScale, ...catalog];
    }
    return catalog;
  }, [scalesQuery.data, currentScale]);

  const needsDefault = selectDefault && value.mode === "catalog" && value.scaleId === null;
  const defaultScale = needsDefault ? pickDefaultScale(scales) : undefined;

  useEffect(() => {
    if (defaultScale) {
      onChange({ mode: "catalog", scaleId: defaultScale.id });
    }
    // onChange cambia en cada render del formulario; basta con reaccionar a la escala por defecto
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultScale?.id]);

  const selectedScale =
    value.mode === "catalog" ? scales.find((scale) => scale.id === value.scaleId) : undefined;
  const selectedKey =
    value.mode === "new" ? NEW_SCALE_KEY : value.scaleId !== null ? String(value.scaleId) : undefined;

  const handleSelection = (key: string | undefined) => {
    if (!key) return;
    if (key === NEW_SCALE_KEY) {
      if (value.mode !== "new") onChange({ mode: "new", draft: createEmptyScaleDraft() });
      return;
    }
    onChange({ mode: "catalog", scaleId: Number(key) });
  };

  const draftValidation = value.mode === "new" ? validateGradingScaleDraft(value.draft) : null;

  const updateDraft = (draft: GradingScaleDraft) => onChange({ mode: "new", draft });

  return (
    <div className="space-y-3" data-testid="grading-scale-field">
      <Select
        label="Escala de calificación"
        placeholder={scalesQuery.isLoading ? "Cargando escalas..." : "Escoge una escala"}
        selectedKeys={selectedKey ? new Set([selectedKey]) : new Set<string>()}
        disallowEmptySelection
        onSelectionChange={(keys) => {
          const selected = Array.from(keys)[0];
          handleSelection(selected === undefined ? undefined : String(selected));
        }}
        isDisabled={isDisabled}
        isLoading={scalesQuery.isLoading}
        description={
          isDisabled
            ? disabledReason
            : "El jurado escoge uno de los 4 niveles por criterio; cada nivel vale los puntos de la escala."
        }
      >
        {[
          ...scales.map((scale) => (
            <SelectItem key={String(scale.id)} textValue={scale.name}>
              {scale.isSystem ? `${scale.name} (sistema)` : scale.name}
            </SelectItem>
          )),
          <SelectItem key={NEW_SCALE_KEY} textValue="Definir escala nueva">
            + Definir escala nueva
          </SelectItem>,
        ]}
      </Select>

      {selectedScale && selectedScale.levels.length > 0 && (
        <GradingScaleLevels levels={selectedScale.levels} />
      )}

      {value.mode === "new" && draftValidation && (
        <div className="space-y-3 rounded-lg border border-default-200 p-3">
          <Input
            label="Nombre de la escala"
            placeholder="Ej: Decenas"
            isRequired
            maxLength={100}
            value={value.draft.name}
            onChange={(e) => updateDraft({ ...value.draft, name: e.target.value })}
            isInvalid={showErrors && Boolean(draftValidation.errors.name)}
            errorMessage={showErrors ? draftValidation.errors.name : undefined}
          />
          <p className="text-xs text-default-500">
            4 niveles, del más bajo (1) al más alto (4). Los puntos deben crecer de un nivel al
            siguiente.
          </p>
          {value.draft.levels.map((level, index) => {
            const levelErrors = draftValidation.errors.levels[index] ?? {};
            const updateLevel = (patch: Partial<typeof level>) =>
              updateDraft({
                ...value.draft,
                levels: value.draft.levels.map((current, position) =>
                  position === index ? { ...current, ...patch } : current,
                ),
              });

            return (
              <div key={index} className="flex flex-col gap-2 sm:flex-row">
                <Input
                  label={`Etiqueta del nivel ${index + 1}`}
                  isRequired
                  maxLength={50}
                  value={level.label}
                  onChange={(e) => updateLevel({ label: e.target.value })}
                  isInvalid={showErrors && Boolean(levelErrors.label)}
                  errorMessage={showErrors ? levelErrors.label : undefined}
                  className="flex-1"
                />
                <Input
                  label={`Puntos del nivel ${index + 1}`}
                  isRequired
                  inputMode="decimal"
                  value={level.points}
                  onChange={(e) => updateLevel({ points: e.target.value })}
                  isInvalid={showErrors && Boolean(levelErrors.points)}
                  errorMessage={showErrors ? levelErrors.points : undefined}
                  className="sm:w-40"
                />
              </div>
            );
          })}
          {draftValidation.errors.form && (
            <p role="alert" className="text-sm text-danger">
              {draftValidation.errors.form}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
