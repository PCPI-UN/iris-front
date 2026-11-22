'use client';

import { useUser } from '@/lib/auth';
import { canViewAdministration } from '@/lib/authorization';
import { StudentDashboard } from '@/app/app/_components/student-dashboard';
import { JuryDashboard } from '@/app/app/_components/jury-dashboard';
import { useMyEvents } from '@/features/events/api/get-my-events';
import { Spinner } from '@/components/ui/spinner';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { EventType } from '@/types/api';
import { extractEventIdFromSlug } from '@/features/events/utils/resolve-join-target';

type EventDashboardProps = {
  eventId: string;
};

export const EventDashboard = ({ eventId }: EventDashboardProps) => {
  const user = useUser();
  const eventsQuery = useMyEvents({ page: 1 });
  const router = useRouter();
  const normalizedEventId = extractEventIdFromSlug(eventId).eventId;

  const events = eventsQuery.data?.data || [];
  const currentEvent = events.find((event) => String(event.id) === normalizedEventId || String(event.id) === String(eventId));
  const isLoading = eventsQuery.isLoading || user.isLoading;
  // Staff (read:events) without a role in this event uses the administration views.
  // A staff member who is also juror or participant of the event keeps that dashboard.
  const isStaffWithoutEventRole =
    canViewAdministration(user.data) && !currentEvent?.role?.name;

  useEffect(() => {
    if (!isLoading && isStaffWithoutEventRole) {
      router.replace('/app');
    }
  }, [isLoading, isStaffWithoutEventRole, router]);

  if (isLoading) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // Renderizar el dashboard según el rol del usuario en este evento
  if (currentEvent?.role?.name === 'Juror') {
    return <JuryDashboard eventId={normalizedEventId || eventId} eventType={currentEvent.eventType} />;
  }

  // Participante del evento, o usuario regular de la plataforma (p. ej. al abrir la ficha de
  // un evento pasado desde su historial). Si no tiene proyecto en el evento, el dashboard
  // del estudiante lo indica; nunca muestra el proyecto de otro evento.
  if (
    currentEvent?.role?.name === 'Participant' ||
    !canViewAdministration(user.data)
  ) {
    return <StudentDashboard eventId={normalizedEventId || eventId} />;
  }

  // Si no tiene rol definido en el evento
  return (
    <div className="flex flex-col items-center justify-center h-64 space-y-4">
      <p className="text-lg text-default-500">No role assigned</p>
      <p className="text-sm text-default-400">You don't have a role in this event</p>
    </div>
  );
};
