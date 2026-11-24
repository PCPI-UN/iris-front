import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import Project from './_components/project';
import { getJuryAssignedProjectsQueryOptions } from '@/features/projects-public/api/get-jury-project';
import { extractEventIdFromSlug } from '@/features/events/utils/resolve-join-target';
import { PermissionGuard } from '@/components/auth/permission-guard';

const ProjectJuryPage = async ({ params }: { params: Promise<{ eventId: string }> }) => {

    const { eventId } = await params;
    
    const queryClient = new QueryClient();

    const parsedEventId = Number(extractEventIdFromSlug(eventId).eventId);
    if (Number.isFinite(parsedEventId) && parsedEventId > 0) {
        await queryClient.prefetchQuery(getJuryAssignedProjectsQueryOptions(parsedEventId));
    }

    const dehydratedState = dehydrate(queryClient);

    return (
        <PermissionGuard permissions={[]}>
            <HydrationBoundary state={dehydratedState}>
                <Project eventId={eventId} />
            </HydrationBoundary>
        </PermissionGuard>
    );
};

export default ProjectJuryPage;