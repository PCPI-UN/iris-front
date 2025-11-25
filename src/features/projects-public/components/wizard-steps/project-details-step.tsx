"use client";

import { Input } from "@heroui/react";
import { Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { ProjectData } from "../project-wizard";
import { useCoursesDropdown } from "@/features/courses/api/get-courses-dropdown";

type ProjectDetailsStepProps = {
  eventId: number;
  project: ProjectData;
  onUpdate: (project: ProjectData) => void;
};

export function ProjectDetailsStep({
  eventId,
  project,
  onUpdate,
}: ProjectDetailsStepProps) {
  const coursesQuery = useCoursesDropdown({
    eventId,
    queryConfig: { enabled: !!eventId },
  });

  const courses = coursesQuery.data?.data ?? [];

  const nameLength = project.name.length;
  const descLength = project.description.length;

  return (
    <div className="space-y-6">
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

      {/* Select de cursos */}
      <Select
        label="Curso al que Pertenece"
        placeholder="Seleccione un curso"
        selectedKeys={project.courseId ? [String(project.courseId)] : []}
        onSelectionChange={(keys) => {
          const selected = Array.from(keys)[0] as string;
          onUpdate({ ...project, courseId: Number(selected) });
        }}
        isDisabled={!eventId || coursesQuery.isLoading}
        isLoading={!!eventId && coursesQuery.isLoading}
        isRequired
      >
        {courses.length > 0 ? (
          courses.map((course: any) => (
            <SelectItem key={course.id}>{course.code}</SelectItem>
          ))
        ) : (
          <SelectItem key="no-courses" isDisabled>
            {eventId ? "No courses available" : "Event required"}
          </SelectItem>
        )}
      </Select>
    </div>
  );
}
