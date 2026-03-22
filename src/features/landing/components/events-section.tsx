"use client";

import { RefObject, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { GlassCard } from "./glass-card";
import { Button } from "@/components/ui/button";
import { useEventsPublic } from "@/features/events/api/get-event-public";
import { Spinner } from "@/components/ui/spinner";
import { paths } from "@/config/paths";
import { landingContent } from "../content";

interface EventsSectionProps {
  eventsSectionRef: RefObject<HTMLElement>;
}

// Paleta de colores para los eventos (rotación de 3 colores)
const EVENT_COLORS = [
  {
    color: "oklch(0.75 0.15 195)", // cyan
    gradient: "from-cyan-500/20 via-blue-500/20 to-cyan-500/20",
  },
  {
    color: "oklch(0.82 0.18 330)", // pink
    gradient: "from-pink-500/20 via-rose-500/20 to-pink-500/20",
  },
  {
    color: "oklch(0.88 0.16 85)", // yellow
    gradient: "from-yellow-500/20 via-orange-500/20 to-yellow-500/20",
  },
];

const PRISMATIC_GRADIENT =
  "linear-gradient(115deg, oklch(0.75 0.15 195), oklch(0.82 0.18 330), oklch(0.88 0.16 85), oklch(0.75 0.15 195))";

const PRISMATIC_GRADIENT_DIM =
  "linear-gradient(115deg, oklch(0.75 0.15 195 / 0.3), oklch(0.82 0.18 330 / 0.3), oklch(0.88 0.16 85 / 0.3), oklch(0.75 0.15 195 / 0.3))";

// Función para obtener color basado en el ID del evento
const getEventColor = (eventId: number, index: number) => {
  // Usar el índice como fallback si no hay ID
  const colorIndex = index % EVENT_COLORS.length;
  return EVENT_COLORS[colorIndex];
};

// Función para formatear fechas
const formatDateRange = (startDate: string, endDate: string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const startDay = start.getDate();
  const endDay = end.getDate();
  const month = start.toLocaleDateString("es", { month: "long" });
  const year = start.getFullYear();

  return `${endDay} de ${month} ${year}`;
};

// Función para mapear status del backend a texto en español
const getStatusText = (statusName: string) => {
  return statusName
    ? landingContent.events.status.upcoming
    : landingContent.events.status.closed;
};

export function EventsSection({ eventsSectionRef }: EventsSectionProps) {
  const router = useRouter();
  const eventsQuery = useEventsPublic({ page: 1 });
  const [currentPage, setCurrentPage] = useState(0);
  const [cardsPerView, setCardsPerView] = useState(3);

  useEffect(() => {
    const updateCardsPerView = () => {
      if (window.innerWidth < 768) {
        setCardsPerView(1);
        return;
      }

      if (window.innerWidth < 1024) {
        setCardsPerView(2);
        return;
      }

      setCardsPerView(3);
    };

    updateCardsPerView();
    window.addEventListener("resize", updateCardsPerView);

    return () => window.removeEventListener("resize", updateCardsPerView);
  }, []);

  const events = eventsQuery.data?.data || [];
  const totalPages = Math.ceil(events.length / cardsPerView);

  const eventsPages = useMemo(() => {
    return Array.from({ length: totalPages }, (_, pageIndex) => {
      const start = pageIndex * cardsPerView;
      return events.slice(start, start + cardsPerView);
    });
  }, [cardsPerView, events, totalPages]);

  useEffect(() => {
    setCurrentPage((previousPage) => {
      const maxPage = Math.max(totalPages - 1, 0);
      return Math.min(previousPage, maxPage);
    });
  }, [totalPages]);

  const goToPreviousPage = () => {
    setCurrentPage((previousPage) => Math.max(previousPage - 1, 0));
  };

  const goToNextPage = () => {
    setCurrentPage((previousPage) => Math.min(previousPage + 1, totalPages - 1));
  };

  return (
    <section
      id="eventos"
      ref={eventsSectionRef}
      className="relative z-10 min-h-screen px-6 py-20 md:px-12"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 glass-effect px-4 py-2 rounded-full text-sm text-primary mb-6">
            <Calendar className="w-4 h-4" />
            <span>{landingContent.events.badge}</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            {landingContent.events.title}{" "}
            <span className="prismatic-text">
              {landingContent.events.titleHighlight}
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {landingContent.events.subtitle}
          </p>
        </div>

        {eventsQuery.isLoading ? (
          <div className="flex h-48 w-full items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">
              No hay eventos disponibles en este momento.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${currentPage * 100}%)` }}
              >
                {eventsPages.map((eventsPage, pageIndex) => (
                  <div key={`events-page-${pageIndex}`} className="min-w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {eventsPage.map((event, index) => {
                        const globalIndex = pageIndex * cardsPerView + index;
                        const eventTheme = getEventColor(event.id, globalIndex);
                        const dateRange = formatDateRange(
                          event.startDate,
                          event.endDate
                        );
                        const status = getStatusText(event.statusName);

                        return (
                          <GlassCard
                            key={event.id}
                            className="event-card group cursor-pointer transition-all duration-500 relative overflow-hidden w-full max-w-md mx-auto"
                          >
                            <div
                              className={`absolute inset-0 bg-gradient-to-br ${eventTheme.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                            />

                            <div className="relative z-10">
                              <div className="flex items-center justify-between mb-4">
                                <div
                                  className="px-3 py-1 rounded-full text-xs font-semibold"
                                  style={{
                                    background: `color-mix(in oklch, ${eventTheme.color}, transparent 85%)`,
                                    color: eventTheme.color,
                                    borderRadius: "9999px",
                                  }}
                                >
                                  {status}
                                </div>
                                <div
                                  className="w-10 h-10 rounded-lg flex items-center justify-center transition-transform"
                                  style={{
                                    background: `color-mix(in oklch, ${eventTheme.color}, transparent 80%)`,
                                    boxShadow: `0 0 30px ${eventTheme.color}`,
                                    borderRadius: "0.5rem",
                                  }}
                                >
                                  <Calendar
                                    className="w-5 h-5"
                                    style={{ color: eventTheme.color }}
                                  />
                                </div>
                              </div>

                              <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors leading-tight">
                                {event.name}
                              </h3>

                              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                                {event.description}
                              </p>

                              <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-3 text-sm">
                                  <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                                    style={{
                                      background: `color-mix(in oklch, ${eventTheme.color}, transparent 90%)`,
                                      borderRadius: "0.5rem",
                                    }}
                                  >
                                    <Calendar
                                      className="w-4 h-4"
                                      style={{ color: eventTheme.color }}
                                    />
                                  </div>
                                  <span className="text-muted-foreground">
                                    {dateRange}
                                  </span>
                                </div>

                                <div className="flex items-center gap-3 text-sm">
                                  <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                                    style={{
                                      background: `color-mix(in oklch, ${eventTheme.color}, transparent 90%)`,
                                      borderRadius: "0.5rem",
                                    }}
                                  >
                                    <Clock
                                      className="w-4 h-4"
                                      style={{ color: eventTheme.color }}
                                    />
                                  </div>
                                  <span className="text-muted-foreground">
                                    {new Date(
                                      event.inscriptionDeadline
                                    ).toLocaleDateString("es", {
                                      day: "numeric",
                                      month: "long",
                                    })}{" "}
                                    - cierre de inscripciones
                                  </span>
                                </div>

                                <div className="flex items-center gap-3 text-sm">
                                  <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                                    style={{
                                      background: `color-mix(in oklch, ${eventTheme.color}, transparent 90%)`,
                                      borderRadius: "0.5rem",
                                    }}
                                  >
                                    <MapPin
                                      className="w-4 h-4"
                                      style={{ color: eventTheme.color }}
                                    />
                                  </div>
                                  <span className="text-muted-foreground">
                                    {landingContent.events.location}
                                  </span>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                <Button
                                  onClick={() =>
                                    router.push(
                                      paths.public.event.getHref()
                                    )
                                  }
                                  className="w-full"
                                  variant="bordered"
                                >
                                  Ver más
                                </Button>

                                <Button
                                  onClick={() =>
                                    router.push(
                                      paths.public.project.getHref(String(event.id))
                                    )
                                  }
                                  className="w-full group-hover:scale-102 transition-transform event-button"
                                  style={
                                    {
                                      "--button-bg": eventTheme.color,
                                      "--button-border": eventTheme.color,
                                      "--button-color": "black",
                                    } as React.CSSProperties
                                  }
                                >
                                  {status === landingContent.events.status.upcoming
                                    ? landingContent.events.cta.open
                                    : landingContent.events.cta.default}
                                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </Button>
                              </div>
                            </div>
                          </GlassCard>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4">
                <Button
                  type="button"
                  variant="bordered"
                  className="events-nav-button h-10 w-10 p-0 border-white/25 backdrop-blur-sm transition-all enabled:hover:shadow-[0_0_18px_rgba(244,114,182,0.28)] disabled:opacity-40 disabled:shadow-none disabled:cursor-default"
                  onClick={goToPreviousPage}
                  disabled={currentPage === 0}
                  aria-label="Página anterior"
                  style={
                    currentPage === 0
                      ? {
                          backgroundImage: PRISMATIC_GRADIENT_DIM,
                          backgroundSize: "100% 100%",
                          animation: "none",
                        }
                      : {
                          backgroundImage: PRISMATIC_GRADIENT,
                          backgroundSize: "200% auto",
                          animation: "prismatic-shift 8s ease-in-out infinite",
                        }
                  }
                >
                  <ChevronLeft className="h-5 w-5 text-black" />
                </Button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }).map((_, pageIndex) => (
                    <button
                      key={`events-dot-${pageIndex}`}
                      type="button"
                      onClick={() => setCurrentPage(pageIndex)}
                      className={`h-2.5 w-2.5 rounded-full border border-white/20 transition-all ${
                        pageIndex === currentPage
                          ? "scale-110 shadow-[0_0_10px_rgba(244,114,182,0.35)]"
                          : "opacity-60 hover:opacity-90"
                      }`}
                      aria-label={`Ir a la página ${pageIndex + 1}`}
                      style={{
                        backgroundImage: PRISMATIC_GRADIENT,
                        backgroundSize: "200% auto",
                        animation: "prismatic-shift 8s ease-in-out infinite",
                      }}
                    />
                  ))}
                </div>

                <Button
                  type="button"
                  variant="bordered"
                  className="events-nav-button h-10 w-10 p-0 border-white/25 backdrop-blur-sm transition-all enabled:hover:shadow-[0_0_18px_rgba(244,114,182,0.28)] disabled:opacity-40 disabled:shadow-none disabled:cursor-default"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages - 1}
                  aria-label="Página siguiente"
                  style={
                    currentPage === totalPages - 1
                      ? {
                          backgroundImage: PRISMATIC_GRADIENT_DIM,
                          backgroundSize: "100% 100%",
                          animation: "none",
                        }
                      : {
                          backgroundImage: PRISMATIC_GRADIENT,
                          backgroundSize: "200% auto",
                          animation: "prismatic-shift 8s ease-in-out infinite",
                        }
                  }
                >
                  <ChevronRight className="h-5 w-5 text-black" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
