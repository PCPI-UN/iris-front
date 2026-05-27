import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';

import { getEventsQueryOptions } from '@/features/events/api/get-events';

import { RoleGuard } from '@/components/auth/role-guard';
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
    <RoleGuard roles={["Admin"]}>
      <HydrationBoundary state={dehydratedState}>
        <GetPastEventsAdmin />
      </HydrationBoundary>
    </RoleGuard>
  );
};

export default PastEventsPage;
