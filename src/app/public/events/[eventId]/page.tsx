import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';

import { PublicLayout } from '@/components/layouts/public-layout';
import { getPublicEventDetailQueryOptions } from '@/features/events/api/get-public-event-detail';
import { getPublicPastEventDetailQueryOptions } from '@/features/events/api/get-public-past-event-detail';
import { Event } from '@/types/api';
import '@/features/landing/index.css';

import { EventDetail } from './_components/event-detail';
import { PastEventDetail } from './_components/past-event-detail';

const extractEventId = (value: string) => {
  const normalizedValue = value.trim();

  const numericSuffixMatch = normalizedValue.match(/(?:-(\d+)|^(\d+))$/);
  return numericSuffixMatch?.[1] ?? numericSuffixMatch?.[2] ?? normalizedValue;
};

const parseLocalDate = (value?: string) => {
  if (!value) return null;

  const datePart = value.split('T')[0];
  const [year, month, day] = datePart.split('-').map(Number);

  if (!year || !month || !day) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return new Date(year, month - 1, day);
};

const isPastEvent = (event?: Event) => {
  if (!event) return false;

  const statusName = String(event.statusName ?? '').toUpperCase();
  if (statusName === 'CLOSED' || Number(event.status) === 4) {
    return true;
  }

  const endDate = parseLocalDate(event.endDate);
  if (!endDate) return false;

  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  ).getTime();

  const endDateStart = new Date(
    endDate.getFullYear(),
    endDate.getMonth(),
    endDate.getDate(),
  ).getTime();

  return endDateStart < todayStart;
};

const PublicEventDetailPage = async ({
  params,
}: {
  params: Promise<{ eventId: string | number }>;
}) => {
  const { eventId } = await params;
  const resolvedEventId = extractEventId(String(eventId));

  const queryClient = new QueryClient();

  const queryOptions = getPublicEventDetailQueryOptions(Number(resolvedEventId));

  await queryClient.prefetchQuery(queryOptions);

  const eventDetail = queryClient.getQueryData<{ data: Event }>(queryOptions.queryKey);
  const shouldRenderPastEvent = isPastEvent(eventDetail?.data);

  if (shouldRenderPastEvent) {
    await queryClient.prefetchQuery(
      getPublicPastEventDetailQueryOptions(Number(resolvedEventId)),
    );
  }

  const dehydratedState = dehydrate(queryClient);

  return (
    <PublicLayout showNavLinks={false}>
      <HydrationBoundary state={dehydratedState}>
        <div className="landing-page relative z-10">
          {shouldRenderPastEvent ? (
            <PastEventDetail eventId={Number(resolvedEventId)} />
          ) : (
            <EventDetail eventId={Number(resolvedEventId)} />
          )}
        </div>
      </HydrationBoundary>
    </PublicLayout>
  );
};

export default PublicEventDetailPage;
