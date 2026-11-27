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
  CREATED: "Creación del proyecto",
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
  pendingTutors: "Tutores sin cuenta",
  participant: "Integrante",
  document: "Documento",
  documents: "Documentos",
  eventId: "Evento",
  categoryId: "Categoría",
  nrc: "NRC",
  tutors: "Tutores",
};

/** Keys of the CREATED entry that describe its origin, not the project data */
const ORIGIN_KEYS = new Set(["origin", "source", "fileName", "file", "rowNumber", "row"]);

/** Who created the project and from where, read from the entry or from its after */
const describeCreation = (entry: ProjectChangeLogEntry): string => {
  const after = (entry.after ?? {}) as Record<string, unknown>;
  const actor = entry.actor?.name ?? `Usuario #${entry.actor?.id ?? "?"}`;
  const origin = String(entry.origin ?? after.origin ?? after.source ?? "");

  if (origin === "ADMIN_BULK") {
    const fileName = entry.fileName ?? after.fileName ?? after.file;
    const rowNumber = entry.rowNumber ?? after.rowNumber ?? after.row;
    const detail = [
      fileName ? `archivo ${String(fileName)}` : null,
      rowNumber !== null && rowNumber !== undefined ? `fila ${String(rowNumber)}` : null,
    ]
      .filter(Boolean)
      .join(", ");

    return `Proyecto creado por ${actor} desde la carga masiva${detail ? ` (${detail})` : ""}`;
  }
  if (origin === "ADMIN_FORM") {
    return `Proyecto creado por ${actor} desde el formulario`;
  }

  return `Proyecto creado por ${actor}`;
};

const CreatedEntry = ({ entry }: { entry: ProjectChangeLogEntry }) => {
  const fields = Object.keys(entry.after ?? {}).filter((field) => !ORIGIN_KEYS.has(field));

  return (
    <>
      <p className="text-xs text-default-500">{describeCreation(entry)}</p>
      {fields.length > 0 && (
        <dl aria-label="Datos iniciales" className="space-y-1">
          {fields.map((field) => (
            <div key={field} className="flex flex-wrap gap-2">
              <dt className="text-default-500">{FIELD_LABELS[field] ?? field}:</dt>
              <dd className="font-medium">{formatValue(field, entry.after?.[field])}</dd>
            </div>
          ))}
        </dl>
      )}
    </>
  );
};

const DOCUMENT_LABELS: Record<string, string> = {
  LOGO: "Logo",
  POSTER: "Póster",
  SUPPORTING_DOCUMENT: "Documento de soporte",
};

/** Participant and document snapshots of the PARTICIPANTS and DOCUMENTS entries, in words */
const describeObject = (field: string, value: Record<string, unknown>): string | null => {
  if (field === "participant") {
    const name = `${value.firstName ?? ""} ${value.lastName ?? ""}`.trim();
    const kind = value.type === "PENDING" ? "pendiente" : "inscrito";

    return [name || null, value.email ?? null, `(${kind})`].filter(Boolean).join(" ");
  }
  if (field === "document") {
    const type = DOCUMENT_LABELS[String(value.type)] ?? String(value.type ?? "Documento");
    const state = value.state === "INACTIVE" ? "inactivo" : "activo";

    return `${type}, ${state}${value.url ? ` · ${String(value.url)}` : ""}`;
  }

  return null;
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
          .map((item) => {
            if (item && typeof item === "object") {
              // Pending tutors: { firstName, lastName, email }
              const { firstName, lastName, email } = item as Record<string, unknown>;
              const name = `${firstName ?? ""} ${lastName ?? ""}`.trim();

              return name || email
                ? [name || null, email ? `(${String(email)})` : null]
                    .filter(Boolean)
                    .join(" ")
                : JSON.stringify(item);
            }

            return String(item);
          })
          .join(", ");
  }
  if (typeof value === "object") {
    return (
      describeObject(field, value as Record<string, unknown>) ??
      JSON.stringify(value)
    );
  }

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
      {entry.action === "CREATED" ? (
        <CreatedEntry entry={entry} />
      ) : (
        <p className="text-xs text-default-500">
          Por {entry.actor?.name ?? `Usuario #${entry.actor?.id ?? "?"}`}
        </p>
      )}
      {entry.action !== "CREATED" && fields.map((field) => (
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
