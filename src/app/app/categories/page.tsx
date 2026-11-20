import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";

import { Categories } from "./_components/categories";
import { getCategoriesQueryOptions } from "@/features/courses/api/get-categories";
import { PermissionGuard } from '@/components/auth/permission-guard';
import { PERMISSIONS } from '@/lib/authorization';

export const metadata = {
  title: "Categories",
  description: "Category Management",
};

const CategoriesPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ page: string | null; event: string | null }>;
}) => {
  const queryClient = new QueryClient();

  const resolvedSearchParams = await searchParams;
  const page = resolvedSearchParams.page ? Number(resolvedSearchParams.page) : 1;
  const eventId = resolvedSearchParams.event;

  await queryClient.prefetchQuery(
    getCategoriesQueryOptions({ page, eventId: Number(eventId) })
  );

  const dehydratedState = dehydrate(queryClient);
  return (
    <PermissionGuard permissions={[PERMISSIONS.readEvents]}>
      <HydrationBoundary state={dehydratedState}>
        <Categories />
      </HydrationBoundary>
    </PermissionGuard>
  );
};

export default CategoriesPage;
