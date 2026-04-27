"use client";

import { ChevronLeft, ClipboardList, FileText, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useNotifications } from "@/components/ui/notifications";
import { useUser } from "@/lib/auth";
import { useChangeProjectToUnderReview } from "@/features/projects/api/change-project-to-under-review";
import { useProject as useMyProjectByEvent } from "@/features/projects/api/get-project-user-event";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { StudentDashboardDocumentsSection } from "./student-dashboard/student-dashboard-documents-section";
import { StudentDashboardProjectInfoSection } from "./student-dashboard/student-dashboard-project-info-section";
import { StudentDashboardStatusSection } from "./student-dashboard/student-dashboard-status-section";
import { StudentDashboardTeamSection } from "./student-dashboard/student-dashboard-team-section";

import { ExpandableText } from "./expandable-text";

interface StudentDashboardProps {
  eventId?: number;
}

export const StudentDashboard = ({ eventId }: StudentDashboardProps) => {
  const user = useUser();
  const router = useRouter();
  const { addNotification } = useNotifications();
  const changeProjectToUnderReviewMutation = useChangeProjectToUnderReview();
  const projectQuery = useMyProjectByEvent({
    eventId: eventId?.toString() ?? "",
    queryConfig: {
      enabled: !!eventId,
      retry: false,
    },
  });

  const project = projectQuery.data?.project;
  const event = projectQuery.data?.event;
  console.log("Project data:", project?.id);
  const isEditMode =
    (project?.state as string) === "REQUEST_CHANGES" ? true : false;
  console.log("Project state:", isEditMode);
  const posterDocument = project?.documents?.find((doc) =>
    doc.type?.toLowerCase().includes("poster"),
  );

  const handleSaveChanges = async () => {
    if (!project?.id) return;

    try {
      await changeProjectToUnderReviewMutation.mutateAsync({
        projectId: project.id,
      });

      addNotification({
        type: "success",
        title: "Proyecto enviado a revision",
        message: "El estado del proyecto cambio correctamente a under review.",
      });

      router.push("/app/projects");
    } catch (error) {
      console.error("Error changing project state to under review:", error);
      addNotification({
        type: "error",
        title: "No se pudo guardar",
        message: "Ocurrio un error al cambiar el estado del proyecto.",
      });
    }
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
      className="dashboard-page space-y-6 pb-10 "
      aria-label="Dashboard del estudiante"
    >
      {/* Encabezado de bienvenida */}

      <header className="flex flex-col items-start justify-between gap-4 md:flex-row px-8">
        <aside className="flex items-center gap-4">
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
            <h1 className="text-white text-3xl font-bold tracking-tight text-balance">
              Bienvenido a tu Proyecto,{" "}
              {`${user.data?.firstName} ${user.data?.lastName}`}
            </h1>
            {event && (
              <p className="text-sm md:text-lg text-default-500 line-clamp-1">
                {event.name}
                {
                event.description ? ` · ${event.description}` : ""}
              </p>
            )}
          </div>
        </aside>

        <aside className="p-4">
          {isEditMode ? (
            <Button
              isIconOnly
              variant="flat"
              aria-label="Guardar cambios"
              className="w-full flex items-center gap-2 text-sm text-green-400 px-4 shadow-sm hover:bg-green-700/10 hover:text-green-500 focus-visible:bg-green-400 focus-visible:text-green-50 disabled:pointer-events-none disabled:opacity-50 disabled:bg-transparent"
              onPress={handleSaveChanges}
              isLoading={changeProjectToUnderReviewMutation.isPending}
              disabled={changeProjectToUnderReviewMutation.isPending}
            >
              <span className="p-2 font-bold">Guardar Cambios</span>
              <Save className="size-5 " />
            </Button>
          ) : null}
        </aside>
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
            <section
              className={
                "grid grid-cols-1 justify-between gap-7 " +
                (event.eventType === 2 ? "" : "lg:grid-cols-2")
              }
            >
              {event.eventType === 2 ? null : (
                <StudentDashboardDocumentsSection
                  docsProject={project.documents || []}
                  canEdit={isEditMode}
                  projectId={project.id}
                />
              )}

              <StudentDashboardStatusSection
                state={project.state}
                canEdit={isEditMode}
              />
            </section>

            {/* Seccion 1: Nombre y descripcion del proyecto */}
            {event.eventType === 2 ? null : (
              <StudentDashboardProjectInfoSection
                projectName={project.name}
                projectDescription={project.description}
                canEdit={isEditMode}
                projectId={project.id}
              />
            )}

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
