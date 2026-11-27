"use client";

import { Radio, RadioGroup } from "@heroui/radio";

import {
  ADMIN_INITIAL_STATE_LABELS,
  AdminInitialProjectState,
} from "../../api/create-project-admin";

const STATE_HINTS: Record<AdminInitialProjectState, string> = {
  APPROVED:
    "Se activan los tutores y los integrantes sin cuenta reciben el correo de aprobación.",
  UNDER_REVIEW:
    "Queda pendiente de revisión, como si se hubiera inscrito desde el formulario público.",
};

type AdminInitialStateSelectorProps = {
  value: AdminInitialProjectState;
  onChange: (value: AdminInitialProjectState) => void;
  isDisabled?: boolean;
};

/** Initial state of a project created by an admin (Aprobado by default) */
export const AdminInitialStateSelector = ({
  value,
  onChange,
  isDisabled,
}: AdminInitialStateSelectorProps) => (
  <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
    <RadioGroup
      isDisabled={isDisabled}
      label="Estado inicial del proyecto"
      orientation="horizontal"
      value={value}
      onValueChange={(next) => onChange(next as AdminInitialProjectState)}
    >
      {(
        Object.keys(ADMIN_INITIAL_STATE_LABELS) as AdminInitialProjectState[]
      ).map((state) => (
        <Radio key={state} value={state}>
          {ADMIN_INITIAL_STATE_LABELS[state]}
        </Radio>
      ))}
    </RadioGroup>
    <p className="mt-2 text-xs text-muted-foreground">{STATE_HINTS[value]}</p>
  </div>
);
