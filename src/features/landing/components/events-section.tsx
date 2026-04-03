
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
import { useUser } from "@/lib/auth";
import { resolveJoinTarget } from "@/features/events/utils/resolve-join-target";
import { paths } from "@/config/paths";
import { landingContent } from "../content";
import {
  formatDateRange,
  getEventColor,
  getStatusText,
  PRISMATIC_GRADIENT,
  PRISMATIC_GRADIENT_DIM,
} from "./events-section.utils";


interface EventsSectionProps {
  eventsSectionRef: RefObject<HTMLElement>;
}

type ThemeKey = 'cyan' | 'pink' | 'yellow';

const getThemeKey = (index: number): ThemeKey => {
  const themes: ThemeKey[] = ['cyan', 'pink', 'yellow'];
  return themes[index % themes.length];
};

const summarizeDescription = (text?: string) => {
  const normalized = String(text ?? '').replace(/\s+/g, ' ').trim();

  if (!normalized) {
    return 'Sin descripción disponible.';
  }

  const firstSentence = normalized.match(/^[^.]*\./)?.[0]?.trim();
  return firstSentence || normalized;
};

const resolveEventLocation = (
  location: unknown,
  fallback: string,
) => {
  if (typeof location === 'string' && location.trim()) {
    return location.trim();
  }

  if (location && typeof location === 'object') {
    const value = location as {
      name?: unknown;
      institution?: unknown;
      address?: unknown;
      city?: unknown;
      venue?: unknown;
    };

    const label =
      String(value.name ?? value.venue ?? '').trim() ||
      [value.institution, value.address ?? value.city]
        .map((part) => String(part ?? '').trim())
        .filter(Boolean)
        .join(' · ');

    if (label) {
      return label;
    }
  }

  return fallback;
};

const parseLocalDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);

  if (!year || !month || !day) {
    return new Date(value);
  }

  return new Date(year, month - 1, day);
};

export function EventsSection({ eventsSectionRef }: EventsSectionProps) {
  const router = useRouter();
  const eventsQuery = useEventsPublic({ page: 1 });
  const {
    data: user,
    isLoading: isUserLoading,
    isFetching: isUserFetching,
  } = useUser();
  const isUserStatusResolving = isUserLoading || isUserFetching;

  // Carousel state
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

    return () => {
      window.removeEventListener("resize", updateCardsPerView);
    };
  }, []);

  useEffect(() => {
    setCurrentPage(0);
  }, [cardsPerView, eventsQuery.data?.data?.length]);

  const handleJoin = async (eventId: string | number) => {
    if (isUserStatusResolving) {
      return;
    }
    const targetHref = await resolveJoinTarget({
      eventId,
      user,
    });
    router.push(targetHref);
  };

  const events = eventsQuery.data?.data || [];
  const totalPages = Math.ceil(events.length / cardsPerView);
  const pages = useMemo(() => {
    return Array.from({ length: totalPages }, (_, pageIndex) => {
      const start = pageIndex * cardsPerView;
      return events.slice(start, start + cardsPerView);
    });
  }, [events, totalPages, cardsPerView]);

  if (eventsQuery.isLoading) {
    return (
      <section
        id="eventos"
        ref={eventsSectionRef}
        className="relative z-10 px-6 py-20 md:px-12"
      >
        <div className="flex h-48 w-full items-center justify-center">
          <Spinner size="lg" />
        </div>
      </section>
    );
  }

  return (
    <section
      id="eventos"
      ref={eventsSectionRef}
      className="relative z-10 px-6 py-20 md:px-12"
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

        {events.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">
              No hay eventos disponibles en este momento.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-500"
                style={{ transform: `translateX(-${currentPage * 100}%)` }}
              >
                {pages.map((page, pageIndex) => (
                  <div key={pageIndex} className="min-w-full">
                    <div className="flex flex-wrap justify-center gap-8">
                      {page.map((event, index) => {
                        const globalIndex = pageIndex * cardsPerView + index;
                        const eventTheme = getEventColor(event.id, globalIndex);
                        const themeKey = getThemeKey(globalIndex);
                        const shortDescription = summarizeDescription(event.description);
                        const eventLocation = resolveEventLocation(
                          (event as { location?: unknown }).location,
                          landingContent.events.location,
                        );
                        const dateRange = formatDateRange(event.startDate, event.endDate);
                        const status = getStatusText(event.statusName);

                        return (
                          <GlassCard
                            key={event.id}
                            className="event-card group cursor-pointer transition-all duration-500 relative overflow-hidden w-full lg:w-[calc(33.333%-1.5rem)] max-w-md"
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
                                {shortDescription}
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
                                    {parseLocalDate(event.inscriptionDeadline).toLocaleDateString("es", {
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
                                    {eventLocation}
                                  </span>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                <Button
                                  onClick={() => {
                                    sessionStorage.setItem(`eventTheme:${String(event.id)}`, themeKey);
                                    router.push(paths.public.event.getHref(String(event.id)));
                                  }}
                                  className="w-full"
                                  variant="bordered"
                                >
                                  Ver más
                                </Button>

                                <Button
                                  onPress={() => {
                                    void handleJoin(event.id);
                                  }}
                                  isDisabled={isUserStatusResolving}
                                  className="w-full group-hover:scale-102 transition-transform event-button"
                                  style={
                                    {
                                      "--button-bg": eventTheme.color,
                                      "--button-border": eventTheme.color,
                                      "--button-color": "black",
                                    } as React.CSSProperties
                                  }
                                >
                                  Inscribirse
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
                  variant="bordered"
                  type="button"
                  className="events-nav-button h-10 w-10 p-0 border-white/25 backdrop-blur-sm transition-all enabled:hover:shadow-[0_0_18px_rgba(244,114,182,0.28)] disabled:opacity-40 disabled:shadow-none disabled:cursor-default"
                  onClick={() => {
                    setCurrentPage((prev) => Math.max(prev - 1, 0));
                  }}
                  isDisabled={currentPage === 0}
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
                  {pages.map((_, pageIndex) => (
                    <button
                      key={pageIndex}
                      type="button"
                      onClick={() => {
                        setCurrentPage(pageIndex);
                      }}
                      className={`h-2.5 w-2.5 rounded-full border border-white/20 transition-all ${
                        currentPage === pageIndex
                          ? "scale-110 shadow-[0_0_10px_rgba(244,114,182,0.35)]"
                          : "opacity-60 hover:opacity-90"
                      }`}
                      aria-label={`Ir a página ${pageIndex + 1}`}
                      style={{
                        backgroundImage: PRISMATIC_GRADIENT,
                        backgroundSize: "200% auto",
                        animation: "prismatic-shift 8s ease-in-out infinite",
                      }}
                    />
                  ))}
                </div>

                <Button
                  variant="bordered"
                  type="button"
                  className="events-nav-button h-10 w-10 p-0 border-white/25 backdrop-blur-sm transition-all enabled:hover:shadow-[0_0_18px_rgba(244,114,182,0.28)] disabled:opacity-40 disabled:shadow-none disabled:cursor-default"
                  onClick={() => {
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1));
                  }}
                  isDisabled={currentPage === totalPages - 1}
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