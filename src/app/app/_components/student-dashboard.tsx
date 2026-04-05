"use client";

import { useUser } from "@/lib/auth";
import { useProject as useMyProjectByEvent } from "@/features/projects/api/get-project-user-event";
import { Avatar } from "@heroui/avatar";
import { Button } from "@heroui/button";
import {
  ArrowLeft,
  FileText,
  Users,
  Edit2,
  ExternalLink,
  CheckCircle2,
  Mail,
  User,
  Hash,
  FolderOpen,
  ClipboardList,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";

type StudentDashboardProps = {
  eventId?: string;
};

export const StudentDashboard = ({ eventId }: StudentDashboardProps = {}) => {
  const user = useUser();
  const router = useRouter();
  const projectQuery = useMyProjectByEvent({
    eventId: eventId ?? "",
    queryConfig: {
      enabled: !!eventId,
      retry: false,
    },
  });

  const project = projectQuery.data?.data?.project;
  const event = projectQuery.data?.data?.event;

  const getProjectStateLabel = (state?: string) => {
    if (state === "UNDER_REVIEW") return "En revision";
    if (state === "APPROVED") return "Aprobado";
    if (state === "REJECTED") return "Rechazado";
    if (state === "CHANGES_REQUIRED") return "Requiere cambios";
    return state || "Sin estado";
  };

  const getStateColor = (state?: string) => {
    if (state === "UNDER_REVIEW")
      return "bg-blue-500/20 text-blue-600 dark:text-blue-400";
    if (state === "APPROVED")
      return "bg-green-500/20 text-green-600 dark:text-green-400";
    if (state === "REJECTED")
      return "bg-red-500/20 text-red-600 dark:text-red-400";
    if (state === "CHANGES_REQUIRED")
      return "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400";
    return "bg-gray-500/20 text-gray-600 dark:text-gray-400";
  };

  const isEditMode = (project?.state as string) === "CHANGES_REQUIRED";
  const posterDocument = project?.documents?.find((doc) =>
    doc.type?.toLowerCase().includes("poster"),
  );
  const primaryDocument = posterDocument || project?.documents?.[0];

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";
    return `${first}${last}`.toUpperCase() || "?";
  };

  if (user.isLoading || (eventId && projectQuery.isLoading)) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <section
      className="dashboard-page space-y-6 pb-10"
      aria-label="Dashboard del estudiante"
    >
      {/* Encabezado de bienvenida */}
      <header className="relative overflow-hidden rounded-2xl to-primary/5 p-8">
        <div className="relative space-y-2">
          <h1 className="text-indigo-200 text-3xl font-bold tracking-tight">
            Bienvenido, {`${user.data?.firstName} ${user.data?.lastName}`}
          </h1>
          {event && (
            <p className="text-sm md:text-lg text-default-500">
              {event.name}
              {event.description ? ` · ${event.description}` : ""}
            </p>
          )}
        </div>
      </header>

      {/* Sin evento */}
      {!eventId && (
        <p className="text-center py-12 text-muted-foreground">
          No se encontró el evento seleccionado.
        </p>
      )}

      {/* Error al cargar proyecto */}
      {eventId && projectQuery.isError && (
        <p className="text-center py-12 text-muted-foreground">
          No encontramos tu proyecto para este evento.
        </p>
      )}

      {/* Contenido principal */}
      {project && event && (
        <div className="space-y-6 m-8">
          {/**
           * FORMULARIO DEL PROYECTO
           * Toda la informacion del proyecto se presenta como un formulario de solo lectura.
           * Cuando el estado es CHANGES_REQUIRED, los campos se vuelven editables.
           */}
          <form
            aria-label="Informacion del proyecto"
            onSubmit={(e) => e.preventDefault()}
            className="space-y-6"
            noValidate
          >
            {/* Seccion 2: Estado del proyecto */}
            <section className="grid grid-cols-1 md:grid-cols-2 justify-between gap-7 ">
              {/* Seccion 4: Documentos del proyecto */}
              <section
                className="rounded-2xl border border-default-200/50 bg-background/70 backdrop-blur-sm p-5 md:p-6 space-y-4"
                aria-label="Documentacion del proyecto"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2 rounded-lg bg-primary/10 text-primary"
                      aria-hidden="true"
                    >
                      <FileText className="h-5 w-5" />
                    </div>
                    <h2 className="text-xl font-semibold">
                      Documentos del proyecto
                    </h2>
                  </div>
                  {isEditMode && (
                    <Button
                      size="sm"
                      variant="flat"
                      className="gap-1"
                      onClick={() => router.push("/app/projects")}
                      aria-label="Editar documentos del proyecto"
                    >
                      <Edit2 className="h-3 w-3" />
                      Editar docs
                    </Button>
                  )}
                </div>

                {primaryDocument ? (
                  <a
                    href={primaryDocument.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Ver poster del proyecto: ${primaryDocument.type || "Poster"} (abre en nueva pestaña)`}
                    className="group w-full rounded-xl border border-default-200 bg-default-50/50 px-4 py-4 flex items-center justify-between gap-3 hover:border-primary/50 hover:bg-primary/5 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="p-2 rounded-lg bg-primary/10 text-primary group-hover:scale-105 transition-transform"
                        aria-hidden="true"
                      >
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs uppercase font-semibold tracking-wide text-default-500">
                          Poster del proyecto
                        </p>
                        <p className="text-base font-semibold truncate">
                          {primaryDocument.type || "Poster"}
                        </p>
                      </div>
                    </div>
                    <div
                      className="p-2 rounded-lg bg-default-100 group-hover:bg-primary/15 transition-colors"
                      aria-hidden="true"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </div>
                  </a>
                ) : (
                  <p className="rounded-xl border border-default-200 bg-background p-4 text-sm text-default-500">
                    No hay poster registrado.
                  </p>
                )}
              </section>
              <section className="rounded-2xl border border-default-200/50 bg-background/70 backdrop-blur-sm p-5 md:p-6 space-y-5">
                <legend className="sr-only">Estado del proyecto</legend>

                <div className="flex items-center gap-3">
                  <div
                    className="p-2 rounded-lg bg-primary/10 text-primary"
                    aria-hidden="true"
                  >
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-semibold">Estado del proyecto</h2>
                </div>

                <div className="space-y-1.5">
                  <div
                    id="project-state"
                    role="status"
                    aria-live="polite"
                    className="flex items-center gap-3 w-full rounded-xl border border-default-200 bg-default-50/50 px-6 py-5 justify-between"
                  >
                    <label
                      htmlFor="project-state"
                      className="text-xs uppercase tracking-wide font-semibold text-default-500"
                    >
                      Estado actual: 
                    </label>
                    <span
                      className={`inline-flex items-center gap-2 p-1 md:px-3 md:py-1 rounded-full text-sm font-semibold ${getStateColor(project.state)}`}
                      aria-label={`Estado: ${getProjectStateLabel(project.state)}`}
                    >
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      {getProjectStateLabel(project.state)}
                    </span>
                  </div>

                  {isEditMode && (
                    <p
                      role="alert"
                      className="text-sm text-yellow-600 dark:text-yellow-400 mt-2 flex items-center gap-1.5"
                    >
                      <Edit2
                        className="h-3.5 w-3.5 shrink-0"
                        aria-hidden="true"
                      />
                      Tu proyecto requiere cambios. Puedes editar la informacion
                      y volver a enviarlo.
                    </p>
                  )}
                </div>
              </section>
            </section>

            {/* Seccion 1: Nombre y descripcion del proyecto */}
            <fieldset className="rounded-2xl border border-default-200/50 bg-background/70 backdrop-blur-sm p-5 md:p-6 space-y-5 hover:shadow-lg transition-shadow">
              <legend className="sr-only">Datos del proyecto</legend>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="p-2 rounded-lg bg-primary/10 text-primary"
                    aria-hidden="true"
                  >
                    <FolderOpen className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-semibold">Proyecto</h2>
                </div>
                {isEditMode && (
                  <Button
                    size="sm"
                    variant="flat"
                    className="gap-1"
                    onClick={() => router.push("/app/projects")}
                    aria-label="Editar nombre y descripcion del proyecto"
                  >
                    <Edit2 className="h-3 w-3" />
                    Editar
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="project-name"
                    className="text-xs uppercase tracking-wide font-semibold text-default-500"
                  >
                    Nombre del proyecto
                  </label>
                  <div
                    id="project-name"
                    className="w-full rounded-xl border border-default-200 bg-default-50/50 px-4 py-3 text-base font-medium text-default-900 dark:text-default-100"
                  >
                    {project.name || "Sin nombre"}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="project-description"
                    className="text-xs uppercase tracking-wide font-semibold text-default-500"
                  >
                    Descripcion
                  </label>
                  <div
                    id="project-description"
                    className="w-full rounded-xl border border-default-200 bg-default-50/50 px-4 py-3 text-sm text-default-600 leading-relaxed min-h-[72px]"
                  >
                    {project.description || "Sin descripcion registrada"}
                  </div>
                </div>
              </div>
            </fieldset>

            {/* Seccion 3: Miembros del equipo */}
            <fieldset className="rounded-2xl border border-default-200/50 bg-background/70 backdrop-blur-sm p-5 md:p-6 space-y-5">
              <legend className="sr-only">Miembros del equipo</legend>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="p-2 rounded-lg bg-primary/10 text-primary"
                    aria-hidden="true"
                  >
                    <Users className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-semibold">Miembros del equipo</h2>
                </div>
                {isEditMode && (
                  <Button
                    size="sm"
                    variant="flat"
                    className="gap-1"
                    onClick={() => router.push("/app/projects")}
                    aria-label="Editar miembros del equipo"
                  >
                    <Edit2 className="h-3 w-3" />
                    Editar miembros
                  </Button>
                )}
              </div>

              {project.participants && project.participants.length > 0 ? (
                <ol className="space-y-4" aria-label="Lista de participantes">
                  {project.participants.map((participant, idx) => (
                    <li key={idx}>
                      <article
                        className="group relative rounded-xl border border-default-200/60 bg-default-50/50 p-5 hover:border-primary/40 transition-colors"
                        aria-label={`Participante: ${participant.firstName} ${participant.lastName}`}
                      >
                        <div className="flex items-start gap-4">
                          <Avatar
                            name={getInitials(
                              participant.firstName,
                              participant.lastName,
                            )}
                            className="bg-primary/20 text-primary font-semibold"
                            radius="full"
                            size="lg"
                            aria-hidden="true"
                          />
                          <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                              <label
                                htmlFor={`participant-name-${idx}`}
                                className="flex items-center gap-2 text-default-500"
                              >
                                <User className="h-4 w-4" aria-hidden="true" />
                                <span className="text-xs uppercase tracking-wide font-semibold">
                                  Nombre
                                </span>
                              </label>
                              <div
                                id={`participant-name-${idx}`}
                                className="text-sm md:text-base font-medium truncate"
                              >
                                {participant.firstName} {participant.lastName}
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label
                                htmlFor={`participant-email-${idx}`}
                                className="flex items-center gap-2 text-default-500"
                              >
                                <Mail className="h-4 w-4" aria-hidden="true" />
                                <span className="text-xs uppercase tracking-wide font-semibold">
                                  Correo
                                </span>
                              </label>
                              <div
                                id={`participant-email-${idx}`}
                                className="text-sm break-all"
                              >
                                {participant.email}
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label
                                htmlFor={`participant-code-${idx}`}
                                className="flex items-center gap-2 text-default-500"
                              >
                                <Hash className="h-4 w-4" aria-hidden="true" />
                                <span className="text-xs uppercase tracking-wide font-semibold">
                                  Codigo estudiantil
                                </span>
                              </label>
                              <div
                                id={`participant-code-${idx}`}
                                className="text-sm italic text-default-500"
                              >
                                {participant.ParticipantCode || "Sin codigo"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </article>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="rounded-xl border border-default-200 bg-background p-4 text-sm text-default-500">
                  No hay miembros en este proyecto aun.
                </p>
              )}

              {project.pendingParticipants &&
                project.pendingParticipants.length > 0 && (
                  <aside
                    className="space-y-3 border-t border-default-200/60 pt-4"
                    aria-label="Participantes con invitacion pendiente"
                  >
                    <p className="text-sm font-semibold text-warning">
                      Participantes pendientes
                    </p>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {project.pendingParticipants.map((participant, idx) => (
                        <li key={idx}>
                          <article className="rounded-xl border border-warning/30 bg-warning/10 p-4 space-y-2">
                            <p className="text-sm font-medium">
                              {participant.firstName} {participant.lastName}
                            </p>
                            <p className="text-sm text-default-600 break-all">
                              {participant.email}
                            </p>
                          </article>
                        </li>
                      ))}
                    </ul>
                  </aside>
                )}
            </fieldset>
          </form>
        </div>
      )}
    </section>
  );
};
