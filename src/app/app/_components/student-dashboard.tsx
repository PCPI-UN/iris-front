"use client";

import { ChevronLeft, ClipboardList, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useUser } from "@/lib/auth";
import { useProject as useMyProjectByEvent } from "@/features/projects/api/get-project-user-event";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { StudentDashboardDocumentsSection } from "./student-dashboard/student-dashboard-documents-section";
import { StudentDashboardProjectInfoSection } from "./student-dashboard/student-dashboard-project-info-section";
import { StudentDashboardStatusSection } from "./student-dashboard/student-dashboard-status-section";
import { StudentDashboardTeamSection } from "./student-dashboard/student-dashboard-team-section";

interface StudentDashboardProps {
  eventId?: number;
}


export const StudentDashboard = ({ eventId }: StudentDashboardProps) => {
  const user = useUser();
  const router = useRouter();
  const projectQuery = useMyProjectByEvent({
    eventId: eventId?.toString() ?? "",
    queryConfig: {
      enabled: !!eventId,
      retry: false,
    },
  });

  const project = projectQuery.data?.project;
  const event = projectQuery.data?.event;

  const isEditMode = (project?.state as string) === "REQUEST_CHANGES";
  const posterDocument = project?.documents?.find((doc) =>
    doc.type?.toLowerCase().includes("poster"),
  );
  const primaryDocument = posterDocument || project?.documents?.[0];

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

      <header className="flex gap-10 items-center px-7">
        <Button
          isIconOnly
          size="sm"
          variant="flat"
          aria-label="Volver a proyectos"
          onPress={() => router.push("/app/projects")}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="relative space-y-2">
          <h1 className="text-white text-3xl font-bold tracking-tight">
            Bienvenido a tu Proyecto, {`${user.data?.firstName} ${user.data?.lastName}`}
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
        <p className="text-center py-12 text-3xl text-muted-foreground">
          No se encontró el evento seleccionado.
        </p>
      )}

      {/* Error al cargar proyecto */}
      {eventId && projectQuery.isError && (
        <p className="text-center py-12 text-3xl text-muted-foreground">
          No encontramos tu proyecto para este evento.
        </p>
      )}

      {/* Contenido principal */}
      {project && event && (
        <div className="space-y-6 m-8">
          {/**
           * FORMULARIO DEL PROYECTO
           * Toda la informacion del proyecto se presenta como un formulario de solo lectura.
           * Cuando el estado es REQUIRE_CHANGES, los campos se vuelven editables.
           */}
          <form
            aria-label="Informacion del proyecto"
            onSubmit={(e) => e.preventDefault()}
            className="space-y-6"
            noValidate
          >
            {/* Seccion 2: Estado del proyecto */}
            <section className="grid grid-cols-1 justify-between gap-7 md:grid-cols-2">
              <StudentDashboardDocumentsSection
                primaryDocument={primaryDocument}
                canEdit={isEditMode}
                projectId={project.id}
              />

              <StudentDashboardStatusSection
                state={project.state}
                canEdit={isEditMode}
              />
            </section>

            {/* Seccion 1: Nombre y descripcion del proyecto */}
            <StudentDashboardProjectInfoSection
              projectName={project.name}
              projectDescription={project.description}
              canEdit={isEditMode}
              onEdit={() => router.push("/app/projects")}
            />

            {/* Seccion 3: Miembros del equipo */}
            <StudentDashboardTeamSection
              participants={project.participants || []}
              pendingParticipants={project.pendingParticipants || []}
              canEdit={isEditMode}
              onEdit={() => router.push("/app/projects")}
            />
          </form>
        </div>
      )}
    </section>
  );
};
