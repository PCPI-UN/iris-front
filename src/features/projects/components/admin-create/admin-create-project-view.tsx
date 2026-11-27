"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { paths } from "@/config/paths";
import { useEvent } from "@/features/events/api/get-event";
import { toPublicEventType } from "@/features/events/utils/normalize-event-type";
import { parseValidEventId } from "@/features/imports/utils/excel-file";
import { ProjectWizard } from "@/features/projects-public/components/project-wizard";

/**
 * /app/projects/new?event=: an admin creates a project in the selected event
 * with the steps of the public wizard. The inscription deadline and whether
 * the event is publicly joinable do not apply here.
 */
export const AdminCreateProjectView = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = parseValidEventId(searchParams?.get("event"));
  const eventQuery = useEvent({ eventId: eventId ?? 0 });
  const event = eventQuery.data?.data;

  const backToProjects = () =>
    router.push(
      eventId
        ? `${paths.app.projects.getHref()}?event=${eventId}`
        : paths.app.projects.getHref(),
    );

  const header = (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Crear proyecto</h1>
        <p className="text-sm text-muted-foreground">
          {event?.name
            ? `Evento: ${event.name}. No aplica la fecha límite de inscripción.`
            : "El proyecto se crea en el evento seleccionado."}
        </p>
      </div>
      <Button
        startContent={<ArrowLeft className="h-4 w-4" />}
        variant="bordered"
        onPress={backToProjects}
      >
        Volver a proyectos
      </Button>
    </div>
  );

  if (!eventId) {
    return (
      <div className="space-y-6">
        {header}
        <p className="text-sm text-warning-500" role="alert">
          Selecciona un evento en la lista de proyectos antes de crear uno.
        </p>
      </div>
    );
  }

  if (eventQuery.isLoading) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (eventQuery.isError || !event) {
    return (
      <div className="space-y-6">
        {header}
        <p className="text-sm text-danger" role="alert">
          No pudimos cargar el evento. Vuelve a la lista de proyectos e
          inténtalo de nuevo.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {header}
      {event.resultsPublished && (
        <p
          className="rounded-lg border border-warning-400/40 bg-warning-400/10 p-3 text-sm text-warning-500"
          role="alert"
        >
          El evento ya publicó sus resultados: el servidor no permitirá crear
          proyectos nuevos.
        </p>
      )}
      <ProjectWizard
        eventId={eventId}
        eventType={toPublicEventType(event.eventType)}
        mode="admin"
        requiresCourse={event.requiresCourse}
      />
    </div>
  );
};
