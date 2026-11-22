import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';

import { getEventsQueryOptions } from '@/features/events/api/get-events';

import { PermissionGuard } from '@/components/auth/permission-guard';
import { PERMISSIONS } from '@/lib/authorization';
import { GetPastEventsAdmin } from '@/features/events/components/get-past-events-admin';

export const metadata = {
  title: 'Past Events',
  description: 'Past Events',
};

const PastEventsPage = async () => {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery(
    getEventsQueryOptions({ page: 1 }),
  );

  const dehydratedState = dehydrate(queryClient);

  return (
    <PermissionGuard permissions={[PERMISSIONS.readEvents]}>
      <HydrationBoundary state={dehydratedState}>
        <GetPastEventsAdmin />
      </HydrationBoundary>
    </PermissionGuard>
  );
};

export default PastEventsPage;
