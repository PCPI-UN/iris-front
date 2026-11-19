import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";

import { Projects } from "./_components/projects";

import { getProjectsQueryOptions } from "@/features/projects/api/get-projects";
import { RoleGuard } from "@/components/auth/role-guard";

export const metadata = {
  title: "Proyectos",
  description: "Proyectos",
};

const ProjectsPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ page: string | null; event: string | null }>;
}) => {
  const queryClient = new QueryClient();

  const resolvedSearchParams = await searchParams;
  const page = resolvedSearchParams.page
    ? Number(resolvedSearchParams.page)
    : 1;
  const eventId = Number(resolvedSearchParams.event);

  await queryClient.prefetchQuery(
    getProjectsQueryOptions({ page, eventId: eventId || undefined }),
  );

  const dehydratedState = dehydrate(queryClient);

  return (
    <RoleGuard roles={["Admin"]}>
      <HydrationBoundary state={dehydratedState}>
        <Projects />
      </HydrationBoundary>
    </RoleGuard>
  );
};

export default ProjectsPage;
