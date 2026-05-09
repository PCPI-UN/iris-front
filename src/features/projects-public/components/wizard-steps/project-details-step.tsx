"use client";

import { Input } from "@heroui/react";
import { Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { ProjectData } from "../project-wizard";
import { useCategoriesDropdown } from "@/features/courses/api/get-categories-dropdown";

type ProjectDetailsStepProps = {
  eventId: number;
  project: ProjectData;
  onUpdate: (project: ProjectData) => void;
};

const normalizeAssignedNumber = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 2);

  if (digits === "0") {
    return "";
  }

  return digits.replace(/^0+/, "");
};

export function ProjectDetailsStep({
  eventId,
  project,
  onUpdate,
}: ProjectDetailsStepProps) {
  const categoriesQuery = useCategoriesDropdown({
    eventId,
    queryConfig: { enabled: !!eventId },
  });

  const categories = categoriesQuery.data?.data ?? [];

  const nameLength = project.name.length;
  const descLength = project.description.length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-[8rem_minmax(0,1fr)] md:items-start">
        <div>
          <Input
            label="Num. Asignado"
            placeholder="10"
            value={project.projectCode}
            onValueChange={(value) =>
              onUpdate({ ...project, projectCode: normalizeAssignedNumber(value) })
            }
            inputMode="numeric"
            type="text"
            maxLength={2}
          />
        </div>

        {/* Nombre del Proyecto */}
        <div className="relative">
          <Input
            label="Nombre del Proyecto"
            placeholder="Sistema de gestión de inventario inteligente"
            value={project.name}
            onValueChange={(value) => onUpdate({ ...project, name: value })}
            isRequired
            maxLength={255}
          />

          {/* Contador */}
          <p className="text-xs text-default-400 absolute right-1 -bottom-5">
            {nameLength}/255
          </p>
        </div>
      </div>

      {/* Descripción */}
      <div className="relative">
        <Textarea
          label="Descripción del Proyecto"
          placeholder="Describa brevemente el objetivo y alcance de su proyecto..."
          value={project.description}
          onValueChange={(value) => onUpdate({ ...project, description: value })}
          minRows={6}
          description="Incluya el problema que resuelve, la metodología y los resultados esperados."
          maxLength={3000}
        />

        {/* Contador */}
        <p className="text-xs text-default-400 absolute right-1 -bottom-5">
          {descLength}/3000
        </p>
      </div>

      {/* Select de categorías */}
      <Select
        label="Categoría"
        placeholder="Seleccione una categoría"
        selectedKeys={project.categoryId ? [String(project.categoryId)] : []}
        onSelectionChange={(keys) => {
          const selected = Array.from(keys)[0] as string;
          onUpdate({ ...project, categoryId: Number(selected) });
        }}
        isDisabled={!eventId || categoriesQuery.isLoading}
        isLoading={!!eventId && categoriesQuery.isLoading}
        isRequired
      >
        {categories.length > 0 ? (
          categories.map((category: any) => (
            <SelectItem key={category.id}>{category.code}</SelectItem>
          ))
        ) : (
          <SelectItem key="no-categories" isDisabled>
            {eventId ? "No categories available" : "Event required"}
          </SelectItem>
        )}
      </Select>
    </div>
  );
}
