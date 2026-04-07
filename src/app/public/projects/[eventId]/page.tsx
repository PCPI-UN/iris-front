"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { paths } from "@/config/paths";
import { ProjectWizard } from "@/features/projects-public/components/project-wizard";
import { PublicLayout } from "@/components/layouts/public-layout";
import { getCoursesDropdownQueryOptions } from "@/features/courses/api/get-courses-dropdown";
import { getPublicEventDetailQueryOptions } from "@/features/events/api/get-public-event-detail";
import {
  extractEventIdFromSlug,
  isUserRegisteredInEvent,
} from "@/features/events/utils/resolve-join-target";
import { toPublicEventType } from "@/features/events/utils/normalize-event-type";
import { useUser } from "@/lib/auth";
import "@/features/landing/index.css";

const PublicProjectPage = ({
  params,
}: {
  params: Promise<{ eventId: string | number }>;
}) => {
  const router = useRouter();
  const user = useUser();
  const [eventId, setEventId] = useState<number | null>(null);
  const [eventType, setEventType] = useState<"Competition" | "Exposition">(
    "Exposition",
  );
  const [dehydratedState, setDehydratedState] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(false);
  const [isRedirectingRegistered, setIsRedirectingRegistered] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const resolvedParams = await params;
        const { eventId: extractedEventId } = extractEventIdFromSlug(
          resolvedParams.eventId,
        );
        const parsedEventId = Number(extractedEventId);

        if (!Number.isFinite(parsedEventId)) {
          throw new Error("No se pudo leer el evento desde la URL");
        }

        setEventId(parsedEventId);

        const queryClient = new QueryClient();

        // Fetch event details
        const eventDetailResult = await queryClient.fetchQuery(
          getPublicEventDetailQueryOptions(parsedEventId),
        );

        setEventType(toPublicEventType(eventDetailResult.data.eventType));

        await queryClient.prefetchQuery(
          getCoursesDropdownQueryOptions(parsedEventId),
        );

        setDehydratedState(dehydrate(queryClient));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading event");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [params]);

  useEffect(() => {
    let isMounted = true;

    const checkRegistrationStatus = async () => {
      if (!eventId || user.isLoading || user.isFetching || !user.data?.id) {
        return;
      }

      setIsCheckingRegistration(true);

      try {
        const isAlreadyRegistered = await isUserRegisteredInEvent(eventId);

        if (isMounted && isAlreadyRegistered) {
          setIsRedirectingRegistered(true);
          router.replace(paths.app.dashboard.getHref());
          return;
        }
      } finally {
        if (isMounted) {
          setIsCheckingRegistration(false);
        }
      }
    };

    void checkRegistrationStatus();

    return () => {
      isMounted = false;
    };
  }, [eventId, router, user.data?.id, user.isFetching, user.isLoading]);

  // Configurar textos basados en el tipo de evento
  const getPageContent = () => {
    if (eventType === "Competition") {
      return {
        title: "Registro de",
        highlight: "Participantes",
        description:
          "Complete el formulario para registrar su equipo en la competencia",
      };
    }
    return {
      title: "Registro de",
      highlight: "Proyectos",
      description:
        "Complete el formulario para registrar su proyecto académico",
    };
  };

  const pageContent = getPageContent();

  if (
    loading ||
    isCheckingRegistration ||
    isRedirectingRegistered ||
    user.isLoading ||
    user.isFetching
  ) {
    return (
      <PublicLayout showNavLinks={false}>
        <div className="flex flex-col items-center justify-center gap-2 min-h-[calc(100vh-6rem)] text-center px-4">
          <p className="text-base font-semibold text-foreground">
            {isRedirectingRegistered
              ? "Ya estás inscrito. Redirigiendo al dashboard..."
              : "Validando tu estado de inscripción..."}
          </p>
          <p className="text-sm text-muted-foreground">Un momento, por favor.</p>
        </div>
      </PublicLayout>
    );
  }

  if (error || !eventId) {
    return (
      <PublicLayout showNavLinks={false}>
        <div className="flex items-center justify-center min-h-[calc(100vh-6rem)]">
          <p className="text-red-500">
            {error || "No se pudo cargar el evento"}
          </p>
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
              {pageContent.title}{" "}
              <span className="prismatic-text">{pageContent.highlight}</span>
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
