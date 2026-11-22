"use client";

import { ArrowRight } from "lucide-react";

import {
  PROJECT_STATE_LABELS,
  ProjectState,
} from "../api/admin-change-project-state";
import {
  ProjectChangeAction,
  ProjectChangeLogEntry,
  useProjectChangeLog,
} from "../api/get-project-change-log";

import { Spinner } from "@/components/ui/spinner";

const ACTION_LABELS: Record<ProjectChangeAction, string> = {
  STATE: "Cambio de estado",
  INFO: "Datos del proyecto",
  CATEGORY: "Categoría",
  PARTICIPANTS: "Integrantes",
  TUTORS: "Tutores",
  DOCUMENTS: "Documentos",
};

const FIELD_LABELS: Record<string, string> = {
  state: "Estado",
  name: "Nombre",
  description: "Descripción",
  projectCode: "Código",
  eventNumber: "Número en el evento",
  courseId: "Categoría",
  participants: "Integrantes",
  tutorUserIds: "Tutores",
  documents: "Documentos",
};

const formatValue = (field: string, value: unknown): string => {
  if (value === null || value === undefined || value === "") return "—";
  if (field === "state" && typeof value === "string") {
    return PROJECT_STATE_LABELS[value as ProjectState] ?? value;
  }
  if (Array.isArray(value)) {
    return value.length === 0
      ? "—"
      : value
          .map((item) =>
            typeof item === "object" ? JSON.stringify(item) : String(item),
          )
          .join(", ");
  }
  if (typeof value === "object") return JSON.stringify(value);

  return String(value);
};

const formatDate = (iso: string) => {
  const date = new Date(iso);

  return Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });
};

const ChangeLogEntry = ({ entry }: { entry: ProjectChangeLogEntry }) => {
  const fields = Array.from(
    new Set([
      ...Object.keys(entry.before ?? {}),
      ...Object.keys(entry.after ?? {}),
    ]),
  );

  return (
    <li className="space-y-2 rounded-lg border border-gray-100/20 p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-semibold">
          {ACTION_LABELS[entry.action] ?? entry.action}
        </span>
        <time className="text-xs text-default-500" dateTime={entry.createdAt}>
          {formatDate(entry.createdAt)}
        </time>
      </div>
      <p className="text-xs text-default-500">
        Por {entry.actor?.name ?? `Usuario #${entry.actor?.id ?? "?"}`}
      </p>
      {fields.map((field) => (
        <div key={field} className="flex flex-wrap items-center gap-2">
          {fields.length > 1 || field !== "state" ? (
            <span className="text-default-500">
              {FIELD_LABELS[field] ?? field}:
            </span>
          ) : null}
          <span>{formatValue(field, entry.before?.[field])}</span>
          <ArrowRight aria-label="pasa a" className="h-3 w-3" />
          <span className="font-medium">
            {formatValue(field, entry.after?.[field])}
          </span>
        </div>
      ))}
      {entry.reason && (
        <p className="whitespace-pre-wrap break-words">
          <span className="text-default-500">Motivo: </span>
          {entry.reason}
        </p>
      )}
    </li>
  );
};

/** Administrative changes of a project (GET /projects/:id/change-log, manage:projects) */
export const ProjectChangeLog = ({ projectId }: { projectId: number }) => {
  const changeLogQuery = useProjectChangeLog({ projectId });

  if (changeLogQuery.isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Spinner size="sm" />
      </div>
    );
  }

  if (changeLogQuery.isError) {
    return (
      <p className="text-sm text-danger">
        No se pudo cargar el historial de cambios.
      </p>
    );
  }

  const entries = changeLogQuery.data?.entries ?? [];

  if (entries.length === 0) {
    return (
      <p className="text-sm text-default-500">
        Este proyecto aún no tiene cambios administrativos.
      </p>
    );
  }

  return (
    <ul aria-label="Historial de cambios" className="space-y-3">
      {entries.map((entry) => (
        <ChangeLogEntry key={entry.id} entry={entry} />
      ))}
    </ul>
  );
};
