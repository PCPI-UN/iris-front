import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';

import { PublicLayout } from '@/components/layouts/public-layout';
import { getPublicEventDetailQueryOptions } from '@/features/events/api/get-public-event-detail';
import '@/features/landing/index.css';

import { EventDetail } from './_components/event-detail';

const PublicEventDetailPage = async ({
  params,
}: {
  params: Promise<{ eventId: number }>;
}) => {
  const { eventId } = await params;

  const queryClient = new QueryClient();

  await queryClient.prefetchQuery(getPublicEventDetailQueryOptions(eventId));

  const dehydratedState = dehydrate(queryClient);

  return (
    <PublicLayout showNavLinks={false}>
      <HydrationBoundary state={dehydratedState}>
        <div className="landing-page relative z-10">
          <EventDetail eventId={eventId} />
        </div>
      </HydrationBoundary>
    </PublicLayout>
  );
};

export default PublicEventDetailPage;
