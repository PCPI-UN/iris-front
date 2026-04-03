"use client";

import { useEffect, useState } from "react";
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { ProjectWizard } from "@/features/projects-public/components/project-wizard";
import { PublicLayout } from "@/components/layouts/public-layout";
import { getCoursesDropdownQueryOptions } from '@/features/courses/api/get-courses-dropdown';
import { getPublicEventDetailQueryOptions } from '@/features/events/api/get-public-event-detail';

const PublicProjectPage = ({ params }: { params: Promise<{ eventId: number }> }) => {
  const [eventId, setEventId] = useState<number | null>(null);
  const [eventType, setEventType] = useState<"Competition" | "Exposition">("Exposition");
  const [dehydratedState, setDehydratedState] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const resolvedParams = await params;
        setEventId(resolvedParams.eventId);

        const queryClient = new QueryClient();

        // Fetch event details
        const eventDetailResult = await queryClient.fetchQuery(
          getPublicEventDetailQueryOptions(String(resolvedParams.eventId))
        );

        setEventType(eventDetailResult.data.eventType || "Exposition");

        await queryClient.prefetchQuery(getCoursesDropdownQueryOptions(resolvedParams.eventId));

        setDehydratedState(dehydrate(queryClient));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading event");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [params]);

  // Configurar textos basados en el tipo de evento
  const getPageContent = () => {
    if (eventType === "Competition") {
      return {
        title: "Registro de",
        highlight: "Participantes",
        description: "Complete el formulario para registrar su equipo en la competencia"
      };
    }
    return {
      title: "Registro de",
      highlight: "Proyectos",
      description: "Complete el formulario para registrar su proyecto académico"
    };
  };

  const pageContent = getPageContent();

  if (loading) {
    return (
      <PublicLayout showNavLinks={false}>
        <div className="flex items-center justify-center min-h-[calc(100vh-6rem)]">
          <p>Cargando...</p>
        </div>
      </PublicLayout>
    );
  }

  if (error || !eventId) {
    return (
      <PublicLayout showNavLinks={false}>
        <div className="flex items-center justify-center min-h-[calc(100vh-6rem)]">
          <p className="text-red-500">{error || "No se pudo cargar el evento"}</p>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout showNavLinks={false}>
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
              {pageContent.title} <span className="prismatic-text">{pageContent.highlight}</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground text-pretty">
              {pageContent.description}
            </p>
          </div>
          <ProjectWizard eventId={eventId} eventType={eventType} />
        </div>
      </HydrationBoundary>
    </PublicLayout>
  );
};

export default PublicProjectPage;
