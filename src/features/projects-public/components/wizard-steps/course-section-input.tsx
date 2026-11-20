"use client";

import { Input } from "@heroui/react";

type CourseSectionInputProps = {
  value: string;
  onChange: (nrc: string) => void;
};

/** NRC of the course section of the project; shown only when the event requires one */
export function CourseSectionInput({ value, onChange }: CourseSectionInputProps) {
  return (
    <Input
      label="NRC del curso"
      placeholder="Ej: 1001"
      value={value}
      onValueChange={(nrc) => onChange(nrc.trim())}
      description="Código del curso (NRC) al que pertenece el proyecto en el periodo del evento."
      inputMode="numeric"
      type="text"
      maxLength={20}
      isRequired
    />
  );
}
