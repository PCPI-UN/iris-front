import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";

import { Categories } from "../courses/_components/courses";
import { getCategoriesQueryOptions } from "@/features/courses/api/get-courses";
import { RoleGuard } from "@/components/auth/role-guard";

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
    <RoleGuard roles={["Admin"]}>
      <HydrationBoundary state={dehydratedState}>
        <Categories />
      </HydrationBoundary>
    </RoleGuard>
  );
};

export default CategoriesPage;
