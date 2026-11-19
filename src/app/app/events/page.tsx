import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";

import { Events } from "./_components/events";

import { getEventsQueryOptions } from "@/features/events/api/get-events";
import { RoleGuard } from "@/components/auth/role-guard";

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
    <RoleGuard roles={["Admin", "User"]}>
      <HydrationBoundary state={dehydratedState}>
        <Events />
      </HydrationBoundary>
    </RoleGuard>
  );
};

export default EventsPage;
