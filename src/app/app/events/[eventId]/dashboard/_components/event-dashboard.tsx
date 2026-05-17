'use client';

import { useUser } from '@/lib/auth';
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

  useEffect(() => {
    // Si es ADMIN, redirigir al dashboard principal
    if (user.data?.platformRoles.some(userRole => userRole.name === 'Admin')) {
      router.replace('/app');
    }
  }, [user.data?.platformRoles, router]);

  if (eventsQuery.isLoading || user.isLoading) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const events = eventsQuery.data?.data || [];
  const currentEvent = events.find((event) => String(event.id) === normalizedEventId || String(event.id) === String(eventId));

  // Renderizar el dashboard según el rol del usuario en este evento
  if (currentEvent?.role?.name === 'Juror') {
    return <JuryDashboard eventId={normalizedEventId || eventId} eventType={currentEvent.eventType} />;
  }

  if (currentEvent?.role?.name === 'Participant') {
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
