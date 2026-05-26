'use client';

import { type RefObject, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { GlassCard } from './glass-card';
import { Button } from '@/components/ui/button';
import { useEventsPublic } from '@/features/events/api/get-event-public';
import { Spinner } from '@/components/ui/spinner';
import { hasInscriptionDeadlinePassed } from '@/features/events/utils/inscription-deadline';
import { paths } from '@/config/paths';
import { landingContent } from '../content';
import {
  formatDateRange,
  getEventColor,
  getStatusText,
  PRISMATIC_GRADIENT,
  PRISMATIC_GRADIENT_DIM,
} from './events-section.utils';

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
  const maxLength = 130;

  if (!normalized) {
    return 'Sin descripción disponible.';
  }

  const firstSentence = normalized.match(/^[^.]*\./)?.[0]?.trim();
  const summary = firstSentence || normalized;

  if (summary.length <= maxLength) {
    return summary;
  }

  return `${summary.slice(0, maxLength).trimEnd()}...`;
};

const resolveEventLocation = (location: unknown, fallback: string) => {
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

const getEventSortTimestamp = (value?: string | null) => {
  if (!value) {
    return Number.POSITIVE_INFINITY;
  }

  const timestamp = parseLocalDate(value).getTime();

  return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp;
};

const getTodayStartTimestamp = () => {
  const today = new Date();

  return new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  ).getTime();
};

const isEventExpired = (endDate?: string | null) => {
  if (!endDate) {
    return false;
  }

  const parsedEndDate = parseLocalDate(endDate);
  const parsedTimestamp = parsedEndDate.getTime();

  if (Number.isNaN(parsedTimestamp)) {
    return false;
  }

  const hideAfter = new Date(
    parsedEndDate.getFullYear(),
    parsedEndDate.getMonth(),
    parsedEndDate.getDate() + 2,
    0,
    0,
    0,
    0,
  ).getTime();

  return Date.now() >= hideAfter;
};

export function EventsSection({ eventsSectionRef }: EventsSectionProps) {
  const router = useRouter();
  const eventsQuery = useEventsPublic({ page: 1 });
  const [currentPage, setCurrentPage] = useState(0);
  const [cardsPerView, setCardsPerView] = useState(3);
  const [uniformCardHeight, setUniformCardHeight] = useState<number | null>(null);

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
    window.addEventListener('resize', updateCardsPerView);

    return () => {
      window.removeEventListener('resize', updateCardsPerView);
    };
  }, []);

  useEffect(() => {
    if (eventsQuery.isLoading) {
      return;
    }

    requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });
  }, [eventsQuery.isLoading, eventsQuery.data?.data?.length, cardsPerView]);

  const events = useMemo(
    () => (eventsQuery.data?.data || []).filter((event) => !isEventExpired(event.endDate)),
    [eventsQuery.data?.data],
  );
  const sortedEvents = useMemo(() => {
    const todayStartTimestamp = getTodayStartTimestamp();

    return events
      .map((event, index) => ({
        event,
        index,
        timestamp: getEventSortTimestamp(event.startDate ?? event.inscriptionDeadline),
        isInscriptionClosed: hasInscriptionDeadlinePassed(event.inscriptionDeadline),
        isPastEvent:
          getEventSortTimestamp(event.startDate ?? event.inscriptionDeadline) < todayStartTimestamp,
      }))
      .sort((left, right) => {
        if (left.isInscriptionClosed !== right.isInscriptionClosed) {
          return Number(left.isInscriptionClosed) - Number(right.isInscriptionClosed);
        }

        if (left.isPastEvent !== right.isPastEvent) {
          return Number(left.isPastEvent) - Number(right.isPastEvent);
        }

        if (left.timestamp !== right.timestamp) {
          return left.isPastEvent
            ? right.timestamp - left.timestamp
            : left.timestamp - right.timestamp;
        }

        return left.index - right.index;
      })
      .map(({ event }) => event);
  }, [events]);

  const eventsToRender = sortedEvents;
  const totalPages = Math.ceil(eventsToRender.length / cardsPerView);

  const pages = useMemo(() => {
    return Array.from({ length: totalPages }, (_, pageIndex) => {
      const start = pageIndex * cardsPerView;
      return eventsToRender.slice(start, start + cardsPerView);
    });
  }, [eventsToRender, totalPages, cardsPerView]);

  useEffect(() => {
    setCurrentPage(0);
  }, [cardsPerView, eventsToRender.length]);

  useEffect(() => {
    setCurrentPage((previous) => Math.min(previous, Math.max(totalPages - 1, 0)));
  }, [totalPages]);

  useEffect(() => {
    const measureCards = () => {
      const section = eventsSectionRef.current;

      if (!section) {
        return;
      }

      const cards = Array.from(section.querySelectorAll<HTMLElement>('.event-card'));

      if (cards.length === 0) {
        setUniformCardHeight(null);
        return;
      }

      cards.forEach((card) => {
        card.style.minHeight = '0px';
      });

      const maxHeight = Math.ceil(
        Math.max(...cards.map((card) => card.scrollHeight)),
      );

      if (!Number.isFinite(maxHeight) || maxHeight <= 0) {
        setUniformCardHeight(null);
        return;
      }

      setUniformCardHeight((previous) => (previous === maxHeight ? previous : maxHeight));
    };

    const frameId = requestAnimationFrame(measureCards);
    window.addEventListener('resize', measureCards);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', measureCards);
    };
  }, [eventsSectionRef, cardsPerView, eventsToRender.length]);

  if (eventsQuery.isLoading) {
    return (
      <section
        id="eventos"
        ref={eventsSectionRef}
        className="relative z-10 min-h-0 px-6 pt-16 pb-4 sm:pt-20 sm:pb-6 md:min-h-screen md:px-12 md:pt-24 md:pb-8"
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
      className="relative z-10 min-h-0 px-6 pt-16 pb-4 sm:pt-20 sm:pb-6 md:min-h-screen md:px-12 md:pt-24 md:pb-8"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10 sm:mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 glass-effect px-4 py-2 rounded-full text-sm text-primary mb-6">
            <Calendar className="w-4 h-4" />
            <span>{landingContent.events.badge}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
            {landingContent.events.title}{' '}
            <span className="prismatic-text">
              {landingContent.events.titleHighlight}
            </span>
          </h2>

          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            {landingContent.events.subtitle}
          </p>

          <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-white/15 bg-white/8 px-4 py-3 text-left shadow-[0_0_30px_rgba(255,255,255,0.06)] backdrop-blur-md">
            <p className="text-sm sm:text-base font-semibold text-foreground">
              {landingContent.events.maintenance.title}
            </p>
            <p className="mt-1 text-sm sm:text-base text-muted-foreground">
              {landingContent.events.maintenance.message}
            </p>
          </div>
        </div>

        {eventsToRender.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">
              No hay eventos disponibles en este momento.
            </p>
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-8">
            <div className="overflow-x-hidden overflow-y-visible pb-1">
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${currentPage * 100}%)` }}
              >
                {pages.map((page, pageIndex) => (
                  <div key={`events-page-${pageIndex}`} className="min-w-full overflow-hidden">
                    <div 
                      className={`grid gap-4 sm:gap-6 md:gap-8 ${
  page.length < cardsPerView
    ? 'grid-cols-[repeat(auto-fit,minmax(25px,420px))] justify-center'
    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
}`}
                    >
                      {page.map((event, index) => {
                        const globalIndex = pageIndex * cardsPerView + index;
                        const eventTheme = getEventColor(event.id, globalIndex);
                        const themeKey = getThemeKey(globalIndex);
                        const shortDescription = summarizeDescription(event.description);
                        const eventLocation = resolveEventLocation(
                          (event as { location?: unknown }).location,
                          landingContent.events.location
                        );
                        const dateRange = formatDateRange(event.startDate, event.endDate);
                        const status = getStatusText(event.statusName);
                        const isInscriptionClosed = hasInscriptionDeadlinePassed(event.inscriptionDeadline);
                        const cardStatusText = isInscriptionClosed ? 'Inscripciones Cerradas' : status;

                        return (
                          <GlassCard
                            key={event.id}
                            className="event-card group cursor-pointer transition-all duration-500 relative overflow-hidden h-full w-full"
                            style={
                              uniformCardHeight
                                ? { minHeight: `${uniformCardHeight}px` }
                                : undefined
                            }
                          >
                            <div
                              className={`absolute inset-0 bg-gradient-to-br ${eventTheme.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                            />

                            <div className="relative z-10 flex h-full flex-col">
                              <div className="flex items-center justify-between mb-4">
                                <div
                                  className="px-3 py-1 rounded-full text-xs font-semibold"
                                  style={{
                                    background: `color-mix(in oklch, ${eventTheme.color}, transparent 85%)`,
                                    color: eventTheme.color,
                                    borderRadius: '9999px',
                                  }}
                                >
                                  {cardStatusText}
                                </div>

                                <div
                                  className="w-10 h-10 rounded-lg flex items-center justify-center transition-transform"
                                  style={{
                                    background: `color-mix(in oklch, ${eventTheme.color}, transparent 80%)`,
                                    boxShadow: `0 0 30px ${eventTheme.color}`,
                                    borderRadius: '0.5rem',
                                  }}
                                >
                                  <Calendar
                                    className="w-5 h-5"
                                    style={{ color: eventTheme.color }}
                                  />
                                </div>
                              </div>

                              <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 group-hover:text-primary transition-colors leading-tight">
                                {event.name}
                              </h3>

                              <p className="text-sm text-muted-foreground mb-4 sm:mb-5 leading-relaxed break-words overflow-hidden [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3] sm:[-webkit-line-clamp:2]">
                                {shortDescription}
                              </p>

                              <div className="space-y-3 mb-8 sm:mb-8 flex-1">
                                <div className="flex items-center gap-3 text-sm">
                                  <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                                    style={{
                                      background: `color-mix(in oklch, ${eventTheme.color}, transparent 90%)`,
                                      borderRadius: '0.5rem',
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
                                      borderRadius: '0.5rem',
                                    }}
                                  >
                                    <Clock
                                      className="w-4 h-4"
                                      style={{ color: eventTheme.color }}
                                    />
                                  </div>

                                  <span className="text-muted-foreground">
                                    {parseLocalDate(event.inscriptionDeadline).toLocaleDateString('es', {
                                      day: 'numeric',
                                      month: 'long',
                                    })}{' '}
                                    - cierre de inscripciones
                                  </span>
                                </div>

                                <div className="flex items-center gap-3 text-sm">
                                  <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                                    style={{
                                      background: `color-mix(in oklch, ${eventTheme.color}, transparent 90%)`,
                                      borderRadius: '0.5rem',
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

                              <div className={isInscriptionClosed ? 'mt-auto flex justify-center' : 'mt-auto flex justify-center'}>
                                <Button
                                  onClick={() => {
                                    const eventIdString = String(event.id);
                                    sessionStorage.setItem(`eventTheme:${String(event.id)}`, themeKey);
                                    sessionStorage.setItem('eventTheme', themeKey);
                                    router.push(
                                      paths.public.event.getHref({
                                        id: eventIdString,
                                        name: event.name,
                                      }),
                                    );
                                  }}
                                  className={isInscriptionClosed ? 'w-full sm:w-[88%]' : 'w-full'}
                                  variant="bordered"
                                >
                                  Ver más
                                </Button>

                                {/*
                                {!isInscriptionClosed && (
                                  <Button
                                    onPress={() => {
                                      void handleJoin(event.id, event.name);
                                    }}
                                    isDisabled={isUserStatusResolving}
                                    className="w-full group-hover:scale-102 transition-transform event-button"
                                    style={
                                      {
                                        '--button-bg': eventTheme.color,
                                        '--button-border': eventTheme.color,
                                        '--button-color': 'black',
                                      } as CSSProperties
                                    }
                                  >
                                    {registeredEventIds.has(String(event.id))
                                      ? 'Ir al dashboard'
                                      : 'Inscribirse'}
                                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                  </Button>
                                )}
                                */}
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
              <div className="flex items-center justify-center gap-3 sm:gap-4">
                <Button
                  variant="bordered"
                  type="button"
                  className="events-nav-button h-9 w-9 sm:h-10 sm:w-10 p-0 border-white/25 backdrop-blur-sm transition-all enabled:hover:shadow-[0_0_18px_rgba(244,114,182,0.28)] disabled:opacity-40 disabled:shadow-none disabled:cursor-default"
                  onClick={() => {
                    setCurrentPage((prev) => Math.max(prev - 1, 0));
                  }}
                  isDisabled={currentPage === 0}
                  aria-label="Página anterior"
                  style={
                    currentPage === 0
                      ? {
                          backgroundImage: PRISMATIC_GRADIENT_DIM,
                          backgroundSize: '100% 100%',
                          animation: 'none',
                        }
                      : {
                          backgroundImage: PRISMATIC_GRADIENT,
                          backgroundSize: '200% auto',
                          animation: 'prismatic-shift 8s ease-in-out infinite',
                        }
                  }
                >
                  <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 text-black" />
                </Button>

                <div className="flex items-center gap-2">
                  {pages.map((_, pageIndex) => (
                    <button
                      key={`events-dot-${pageIndex}`}
                      type="button"
                      onClick={() => {
                        setCurrentPage(pageIndex);
                      }}
                      className={`h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full border border-white/20 transition-all ${
                        currentPage === pageIndex
                          ? 'scale-110 shadow-[0_0_10px_rgba(244,114,182,0.35)]'
                          : 'opacity-60 hover:opacity-90'
                      }`}
                      aria-label={`Ir a la página ${pageIndex + 1}`}
                      style={{
                        backgroundImage: PRISMATIC_GRADIENT,
                        backgroundSize: '200% auto',
                        animation: 'prismatic-shift 8s ease-in-out infinite',
                      }}
                    />
                  ))}
                </div>

                <Button
                  variant="bordered"
                  type="button"
                  className="events-nav-button h-9 w-9 sm:h-10 sm:w-10 p-0 border-white/25 backdrop-blur-sm transition-all enabled:hover:shadow-[0_0_18px_rgba(244,114,182,0.28)] disabled:opacity-40 disabled:shadow-none disabled:cursor-default"
                  onClick={() => {
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1));
                  }}
                  isDisabled={currentPage === totalPages - 1}
                  aria-label="Página siguiente"
                  style={
                    currentPage === totalPages - 1
                      ? {
                          backgroundImage: PRISMATIC_GRADIENT_DIM,
                          backgroundSize: '100% 100%',
                          animation: 'none',
                        }
                      : {
                          backgroundImage: PRISMATIC_GRADIENT,
                          backgroundSize: '200% auto',
                          animation: 'prismatic-shift 8s ease-in-out infinite',
                        }
                  }
                >
                  <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-black" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
