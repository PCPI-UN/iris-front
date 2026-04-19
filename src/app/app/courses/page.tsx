import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";

import { Courses } from "./_components/courses";
import { getCoursesQueryOptions } from "@/features/courses/api/get-courses";
import { RoleGuard } from "@/components/auth/role-guard";

export const metadata = {
  title: "Categories",
  description: "Category Management",
};

const CoursesPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ page: string | null; event: string | null }>;
}) => {
  const queryClient = new QueryClient();

  const resolvedSearchParams = await searchParams;
  const page = resolvedSearchParams.page ? Number(resolvedSearchParams.page) : 1;
  const eventId = resolvedSearchParams.event;

  await queryClient.prefetchQuery(
    getCoursesQueryOptions({ page, eventId: Number(eventId) })
  );

  const dehydratedState = dehydrate(queryClient);
  return (
    <RoleGuard roles={["Admin"]}>
      <HydrationBoundary state={dehydratedState}>
        <Courses />
      </HydrationBoundary>
    </RoleGuard>
  );
};

export default CoursesPage;
