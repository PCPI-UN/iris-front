import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";

import { Events } from "./_components/events";

import { getEventsQueryOptions } from "@/features/events/api/get-events";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { PERMISSIONS } from "@/lib/authorization";

export const metadata = {
  title: "Eventos",
  description: "Eventos",
};

const EventsPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ page: string | null }>;
}) => {
  const queryClient = new QueryClient();

  const resolvedSearchParams = await searchParams;

  await queryClient.prefetchQuery(
    getEventsQueryOptions({
      page: resolvedSearchParams.page ? Number(resolvedSearchParams.page) : 1,
    }),
  );

  const dehydratedState = dehydrate(queryClient);

  return (
    <PermissionGuard permissions={[PERMISSIONS.readEvents]}>
      <HydrationBoundary state={dehydratedState}>
        <Events />
      </HydrationBoundary>
    </PermissionGuard>
  );
};

export default EventsPage;
