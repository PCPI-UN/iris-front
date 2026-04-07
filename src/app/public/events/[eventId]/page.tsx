import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';

import { PublicLayout } from '@/components/layouts/public-layout';
import { getPublicEventDetailQueryOptions } from '@/features/events/api/get-public-event-detail';
import '@/features/landing/index.css';

import { EventDetail } from './_components/event-detail';

const extractEventId = (value: string) => {
  const normalizedValue = value.trim();

  const numericSuffixMatch = normalizedValue.match(/(?:-(\d+)|^(\d+))$/);
  return numericSuffixMatch?.[1] ?? numericSuffixMatch?.[2] ?? normalizedValue;
};

const PublicEventDetailPage = async ({
  params,
}: {
  params: Promise<{ eventId: number }>;
}) => {
  const { eventId } = await params;
  const resolvedEventId = eventId;

  const queryClient = new QueryClient();

  await queryClient.prefetchQuery(getPublicEventDetailQueryOptions(resolvedEventId));

  const dehydratedState = dehydrate(queryClient);

  return (
    <PublicLayout showNavLinks={false}>
      <HydrationBoundary state={dehydratedState}>
        <div className="landing-page relative z-10">
          <EventDetail eventId={resolvedEventId} />
        </div>
      </HydrationBoundary>
    </PublicLayout>
  );
};

export default PublicEventDetailPage;
