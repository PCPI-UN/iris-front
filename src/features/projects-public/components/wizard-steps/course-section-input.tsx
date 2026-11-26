"use client";

import { Button } from "@heroui/button";

import {
  professorName,
  useCourseSections,
} from "../../api/get-course-sections";

import { Select, SelectItem } from "@/components/ui/select";

type CourseSectionInputProps = {
  eventId: number;
  /** NRC chosen, "" while there is none */
  value: string;
  onChange: (nrc: string) => void;
};

/**
 * NRC of the course section of the project, chosen among the ones of the academic term of the
 * event; shown only when the event requires one. The backend still validates it when the project
 * is sent, and its error is shown by the wizard.
 */
export function CourseSectionInput({
  eventId,
  value,
  onChange,
}: CourseSectionInputProps) {
  const sectionsQuery = useCourseSections({ eventId });
  const sections = sectionsQuery.data?.sections ?? [];
  const isEmpty =
    !sectionsQuery.isLoading && !sectionsQuery.isError && sections.length === 0;
  const hasValue = sections.some((section) => section.nrc === value);

  if (sectionsQuery.isError) {
    return (
      <div
        className="space-y-2 rounded-lg border border-danger/40 p-3"
        role="alert"
      >
        <p className="text-sm text-danger">
          No se pudieron cargar los NRC del periodo del evento.
        </p>
        <Button
          size="sm"
          variant="bordered"
          onPress={() => sectionsQuery.refetch()}
        >
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <Select
      isRequired
      description={
        isEmpty
          ? "El periodo del evento no tiene NRC cargados. Comuníquese con la coordinación del evento."
          : "Curso al que pertenece el proyecto en el periodo del evento."
      }
      isDisabled={isEmpty}
      isLoading={sectionsQuery.isLoading}
      label="NRC del curso"
      placeholder={
        sectionsQuery.isLoading
          ? "Cargando NRC..."
          : "Seleccione el NRC de su curso"
      }
      selectedKeys={hasValue ? new Set([value]) : new Set([])}
      onSelectionChange={(keys) => {
        const selected = Array.from(keys)[0];

        onChange(selected === undefined ? "" : String(selected));
      }}
    >
      {sections.map((section) => {
        const professor = professorName(section.professor);

        return (
          <SelectItem
            key={section.nrc}
            description={professor ? `Profesor: ${professor}` : undefined}
            textValue={`${section.nrc} - ${section.name}`}
          >
            {`${section.nrc} - ${section.name}`}
          </SelectItem>
        );
      })}
    </Select>
  );
}
