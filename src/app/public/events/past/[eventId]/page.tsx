import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';

import { PublicLayout } from '@/components/layouts/public-layout';
import { getPublicPastEventDetailQueryOptions } from '@/features/events/api/get-public-past-event-detail';
import '@/features/landing/index.css';

import { PastEventDetail } from '../../[eventId]/_components/past-event-detail';

const extractEventId = (value: string) => {
  const normalizedValue = value.trim();

  const numericSuffixMatch = normalizedValue.match(/(?:-(\d+)|^(\d+))$/);
  return numericSuffixMatch?.[1] ?? numericSuffixMatch?.[2] ?? normalizedValue;
};

const PublicPastEventDetailPage = async ({
  params,
}: {
  params: Promise<{ eventId: string | number }>;
}) => {
  const { eventId } = await params;
  const resolvedEventId = extractEventId(String(eventId));

  const queryClient = new QueryClient();

  await queryClient.prefetchQuery(
    getPublicPastEventDetailQueryOptions(Number(resolvedEventId)),
  );

  const dehydratedState = dehydrate(queryClient);

  return (
    <PublicLayout showNavLinks={true}>
      <HydrationBoundary state={dehydratedState}>
        <div className="landing-page relative z-10">
          <PastEventDetail eventId={Number(resolvedEventId)} />
        </div>
      </HydrationBoundary>
    </PublicLayout>
  );
};

export default PublicPastEventDetailPage;
