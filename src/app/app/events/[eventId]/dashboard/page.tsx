import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { getEventsQueryOptions } from '@/features/events/api/get-events';
import { EventDashboard } from './_components/event-dashboard';

const EventDashboardPage = async ({ 
  params 
}: { 
  params: Promise<{ eventId: string }> 
}) => {
  const { eventId } = await params;
  
  const queryClient = new QueryClient();

  // Prefetch events data
  await queryClient.prefetchQuery(getEventsQueryOptions({ page: 1 }));

  const dehydratedState = dehydrate(queryClient);

  return (
    <PermissionGuard permissions={[]}>
      <HydrationBoundary state={dehydratedState}>
        <EventDashboard eventId={eventId} />
      </HydrationBoundary>
    </PermissionGuard>
  );
};

export default EventDashboardPage;
