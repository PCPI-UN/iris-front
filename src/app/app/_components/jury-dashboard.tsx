"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { MeEvent } from "@/features/events/api/get-me-events";
import { ProjectListView } from "@/features/jury/components/project-list-view";
import { useJuryAssignedProjects } from "@/features/projects-public/api/get-jury-project";
import { EventType } from "@/types/api";
import "@/features/landing/index.css";

type JuryDashboardProps = {
  eventId: string;
  event: MeEvent;
};

export const JuryDashboard = ({ eventId, event }: JuryDashboardProps) => {
  const router = useRouter();
  // Same query as the list below: it is fetched once
  const assignedQuery = useJuryAssignedProjects({ eventId: Number(event.id) });
  const assigned = assignedQuery.data ?? [];
  const evaluatedCount = assigned.filter((project) => project.evaluated).length;

  return (
    <div className="dashboard-page space-y-4 md:space-y-6">
      <div>
        <Button
          className="gap-2"
          variant="light"
          onPress={() => router.push("/app")}
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
      </div>
      <div className="space-y-1 md:space-y-2">
        <p className="text-xs md:text-sm font-medium uppercase tracking-wide text-primary">
          Jurado del Evento
        </p>
        <h1 className="text-2xl md:text-3xl font-bold">{event.name}</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Revisa y evalúa los proyectos o equipos asignados
        </p>
        {(assigned.length > 0 || event.resultsPublished) && (
          <div className="flex flex-wrap gap-2 pt-1">
            {assigned.length > 0 && (
              <Chip
                color={
                  evaluatedCount === assigned.length ? "success" : "primary"
                }
                size="sm"
                variant="flat"
              >
                {evaluatedCount} de {assigned.length} evaluados
              </Chip>
            )}
            {event.resultsPublished && (
              <Chip color="success" size="sm" variant="flat">
                Resultados publicados
              </Chip>
            )}
          </div>
        )}
      </div>
      <div className="w-full overflow-x-auto">
        <ProjectListView
          eventId={eventId}
          showProjectCode={event.eventType === EventType.Exposition}
        />
      </div>
    </div>
  );
};
