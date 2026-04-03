import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { ProjectWizard } from "@/features/projects-public/components/project-wizard";
import { PublicLayout } from "@/components/layouts/public-layout";
import { getCoursesDropdownQueryOptions } from '@/features/courses/api/get-courses-dropdown';
import { getPublicEventDetailQueryOptions } from '@/features/events/api/get-public-event-detail';

const PublicProjectPage = async ({ params }: { params: Promise<{ eventId: number }> }) => {
    const { eventId } = await params;
    
    const queryClient = new QueryClient();
    
    // Fetch event details to get the event type
    const eventDetailResult = await queryClient.fetchQuery(
      getPublicEventDetailQueryOptions(String(eventId))
    );
    const eventType = eventDetailResult?.data?.eventType || "Exposition";
    
    await queryClient.prefetchQuery(getCoursesDropdownQueryOptions(eventId));
    
    const dehydratedState = dehydrate(queryClient);

    return (
        <PublicLayout showNavLinks={false}>
            {/* Animated Background Gradient - Same as landing */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div
                    className="parallax-slow absolute top-0 left-0 w-[150%] h-[150%]"
                    style={{
                        background: `
                            radial-gradient(circle at 20% 20%, oklch(0.75 0.15 195 / 0.15) 0%, transparent 50%),
                            radial-gradient(circle at 80% 80%, oklch(0.82 0.18 330 / 0.15) 0%, transparent 50%),
                            radial-gradient(circle at 50% 50%, oklch(0.88 0.16 85 / 0.1) 0%, transparent 50%)
                        `,
                    }}
                />
            </div>

            <HydrationBoundary state={dehydratedState}>
                <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10">
                    <div className="mb-6 sm:mb-8 text-center px-2">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-3 text-balance">
                            Registro de <span className="prismatic-text">Proyectos</span>
                        </h1>
                        <p className="text-base sm:text-lg text-muted-foreground text-pretty">
                            Complete el formulario para registrar su proyecto académico
                        </p>
                    </div>
                    <ProjectWizard eventId={eventId} eventType={eventType as "Competition" | "Exposition"} />
                </div>
            </HydrationBoundary>
        </PublicLayout>
    );
};

export default PublicProjectPage;
