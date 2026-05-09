"use client";

import { ChevronLeft, Save } from "lucide-react";

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
  const isEditMode = (project?.state as string) === "REQUEST_CHANGES";
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
      className="dashboard-page space-y-6 pb-8 sm:pb-10"
      aria-label="Dashboard del estudiante"
    >
      <header className="flex flex-col items-start justify-between gap-4 px-4 sm:px-6 lg:flex-row lg:px-8">
        <aside className="flex w-full items-start gap-3 sm:items-center sm:gap-4 lg:w-auto">
          <Button
            isIconOnly
            size="sm"
            variant="flat"
            aria-label="Volver a proyectos"
            onPress={() => router.push("/app/projects")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="relative min-w-0 flex-1 space-y-2">
            <h1 className="break-words text-balance text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
              Bienvenido a tu Proyecto,{" "}
              {`${user.data?.firstName} ${user.data?.lastName}`}
            </h1>
            {event && (
              <p className="line-clamp-2 text-sm text-default-500 sm:text-base lg:text-lg">
                {event.name}
                {event.description ? ` · ${event.description}` : ""}
              </p>
            )}
          </div>
        </aside>
      </header>

      {!eventId && (
        <p className="px-4 py-12 text-center text-xl text-muted-foreground sm:text-2xl lg:text-3xl">
          No se encontró el evento seleccionado.
        </p>
      )}

      {eventId && projectQuery.isError && (
        <p className="px-4 py-12 text-center text-xl text-muted-foreground sm:text-2xl lg:text-3xl">
          No encontramos tu proyecto para este evento.
        </p>
      )}

      {project && event && (
        <div className="mx-4 space-y-6 sm:mx-6 lg:mx-8">
          <form
            aria-label="Informacion del proyecto"
            onSubmit={(e) => e.preventDefault()}
            className="space-y-5 sm:space-y-6"
            noValidate
          >
            <section className="grid grid-cols-1 gap-5 sm:gap-7">
              <StudentDashboardStatusSection
                state={project.state}
                canEdit={isEditMode}
              />
            </section>

            {event.eventType === 2 ? null : (
              <StudentDashboardDocumentsSection
                docsProject={project.documents || []}
                canEdit={isEditMode}
                projectId={project.id}
              />
            )}

            {event.eventType === 2 ? null : (
              <StudentDashboardProjectInfoSection
                projectName={project.name}
                projectDescription={project.description}
                canEdit={isEditMode}
                projectId={String(project.id)}
              />
            )}

            <StudentDashboardTeamSection
              UserEmail={user.data?.email || undefined }
              participants={project.participants || []}
              canEdit={isEditMode}
              projectId={project.id}
            />
          </form>
        </div>
      )}

      <aside id="save-changes" className="w-full px-8 flex justify-end lg:w-auto">
        {isEditMode ? (
          <Button
            isIconOnly
            variant="flat"
            aria-label="Guardar cambios"
            className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-green-400 shadow-sm transition-colors hover:bg-green-700/10 hover:text-green-500 focus-visible:bg-green-400 focus-visible:text-green-50 disabled:pointer-events-none disabled:opacity-50 disabled:bg-transparent sm:w-auto sm:px-4 sm:text-sm"
            onPress={handleSaveChanges}
            isLoading={changeProjectToUnderReviewMutation.isPending}
            disabled={changeProjectToUnderReviewMutation.isPending}
          >
            <span className="px-1 sm:px-2">Guardar Cambios</span>
            <Save className="size-4 sm:size-5" />
          </Button>
        ) : null}
      </aside>
    </section>
  );
};
