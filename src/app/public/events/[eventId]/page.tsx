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
  if (/^\d+$/.test(normalizedValue)) return normalizedValue;

  const prefixMatch = normalizedValue.match(/^(\d+)-/);
  const suffixMatch = normalizedValue.match(/-(\d+)$/);

  if (prefixMatch && suffixMatch && /^(19|20)\d{2}$/.test(suffixMatch[1])) {
    return prefixMatch[1];
  }

  return suffixMatch?.[1] ?? prefixMatch?.[1] ?? normalizedValue;
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
  if (
    statusName === 'CLOSED' ||
    statusName === 'FINISHED' ||
    statusName === 'INACTIVE' ||
    Number(event.status) === 4 ||
    event.active === false ||
    Boolean(event.rankingConfig?.visibleInLanding)
  ) {
    return true;
  }

  if (event.endDate && /T\d{2}:\d{2}/.test(event.endDate)) {
    const exactEnd = new Date(event.endDate);
    if (!Number.isNaN(exactEnd.getTime())) {
      return exactEnd.getTime() < Date.now();
    }
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
    <PublicLayout showNavLinks={true}>
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
