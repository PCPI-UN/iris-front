import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";

import { Projects } from "./_components/projects";

import { getProjectsQueryOptions } from "@/features/projects/api/get-projects";
import { PermissionGuard } from '@/components/auth/permission-guard';
import { PERMISSIONS } from '@/lib/authorization';

export const metadata = {
  title: "Projects",
  description: "Projects",
};

const ProjectsPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ page: string | null; event: string | null }>;
}) => {
  const queryClient = new QueryClient();

  const resolvedSearchParams = await searchParams;
  const page = resolvedSearchParams.page ? Number(resolvedSearchParams.page) : 1;
  const eventId = Number(resolvedSearchParams.event);

  await queryClient.prefetchQuery(
    getProjectsQueryOptions({ page, eventId: eventId || undefined })
  );

  const dehydratedState = dehydrate(queryClient);
  return (
    <PermissionGuard permissions={[PERMISSIONS.readEvents]}>
      <HydrationBoundary state={dehydratedState}>
        <Projects />
      </HydrationBoundary>
    </PermissionGuard>
  );
};

export default ProjectsPage;
