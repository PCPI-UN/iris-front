"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { useUser } from "@/lib/auth";
import { canViewAdministration } from "@/lib/authorization";
import { useAcademicProfiles } from "@/features/academic/api/get-academic-profiles";
import { TEACHING_PROFILES } from "@/features/academic/utils/academic-profiles";
import { StudentDashboard } from "@/app/app/_components/student-dashboard";
import { JuryDashboard } from "@/app/app/_components/jury-dashboard";
import { useMeEvent } from "@/features/events/api/get-me-events";
import {
  EVENT_ROLE_LABELS,
  resolveEventRole,
} from "@/features/events/utils/event-roles";
import { Spinner } from "@/components/ui/spinner";
import { extractEventIdFromSlug } from "@/features/events/utils/resolve-join-target";
import { paths } from "@/config/paths";

type EventDashboardProps = {
  eventId: string;
};

export const EventDashboard = ({ eventId }: EventDashboardProps) => {
  const user = useUser();
  const router = useRouter();
  const normalizedEventId = extractEventIdFromSlug(eventId).eventId;
  const requestedRole = useSearchParams()?.get("rol");
  // Searches every page of /me/events (current and past): the event may not be among the first ones
  const eventQuery = useMeEvent(normalizedEventId || String(eventId));

  const currentEvent = eventQuery.data ?? undefined;
  // `?rol=` picks the view when the person holds several roles in the event;
  // one they do not hold is ignored and the first they hold opens
  const eventRole = currentEvent
    ? resolveEventRole(requestedRole, currentEvent.roles)
    : undefined;
  const profilesQuery = useAcademicProfiles();
  const isLoading =
    eventQuery.isLoading || user.isLoading || profilesQuery.isLoading;
  // Staff (read:events) without a role in this event uses the administration views.
  // A staff member who is also juror or participant of the event keeps that dashboard.
  const isStaffWithoutEventRole =
    canViewAdministration(user.data) && !eventRole;
  // Professor and tutor of the event use the screen of that academic profile, on this event
  const teachingProfile =
    (eventRole === "PROFESSOR" || eventRole === "TUTOR") &&
    profilesQuery.data?.includes(eventRole)
      ? eventRole
      : undefined;
  const opensTeaching = Boolean(teachingProfile);

  useEffect(() => {
    if (isLoading) return;
    if (teachingProfile && currentEvent) {
      router.replace(
        paths.app.teaching.getHref(
          TEACHING_PROFILES[teachingProfile].slug,
          currentEvent.id,
        ),
      );
    } else if (isStaffWithoutEventRole) {
      router.replace("/app");
    }
  }, [
    isLoading,
    teachingProfile,
    currentEvent,
    isStaffWithoutEventRole,
    router,
  ]);

  if (isLoading || opensTeaching) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // Renderizar el dashboard según el rol del usuario en este evento
  if (currentEvent && eventRole === "JURY") {
    return (
      <JuryDashboard
        eventId={normalizedEventId || eventId}
        event={currentEvent}
      />
    );
  }

  // Participante del evento, o usuario regular de la plataforma (p. ej. al abrir la ficha de
  // un evento pasado desde su historial). Si no tiene proyecto en el evento, el dashboard
  // del estudiante lo indica; nunca muestra el proyecto de otro evento.
  if (
    eventRole === "PARTICIPANT" ||
    (!eventRole && !canViewAdministration(user.data))
  ) {
    return <StudentDashboard eventId={normalizedEventId || eventId} />;
  }

  // Director has no view yet; professor and tutor without that academic profile neither
  if (eventRole) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-lg text-default-500">
          Vista de {EVENT_ROLE_LABELS[eventRole].toLowerCase()} próximamente
        </p>
        <p className="text-sm text-default-400">
          Aún no hay un panel para este rol en el evento.
        </p>
      </div>
    );
  }

  // Si no tiene rol definido en el evento
  return (
    <div className="flex flex-col items-center justify-center h-64 space-y-4">
      <p className="text-lg text-default-500">Sin rol asignado</p>
      <p className="text-sm text-default-400">
        No tienes un rol asignado en este evento
      </p>
    </div>
  );
};
