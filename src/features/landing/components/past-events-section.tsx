'use client';

import { type CSSProperties, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  MapPin,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from 'lucide-react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { GlassCard } from './glass-card';
import { Button } from '@/components/ui/button';
import { usePastEventsPublic } from '@/features/events/api/get-past-events-public';
import { Spinner } from '@/components/ui/spinner';
import { paths } from '@/config/paths';
import {
  formatDateRange,
  getEventColor,
  PRISMATIC_GRADIENT,
  PRISMATIC_GRADIENT_DIM,
} from './events-section.utils';

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

export function PastEventsSection() {
  const router = useRouter();
  const pastEventsQuery = usePastEventsPublic({ page: 1 });

  const [currentPage, setCurrentPage] = useState(0);
  const [cardsPerView, setCardsPerView] = useState(2);
  const [uniformCardHeight, setUniformCardHeight] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const updateCardsPerView = () => {
      if (window.innerWidth < 768) {
        setCardsPerView(1);
        return;
      }

      setCardsPerView(2);
    };

    updateCardsPerView();
    window.addEventListener('resize', updateCardsPerView);

    return () => {
      window.removeEventListener('resize', updateCardsPerView);
    };
  }, []);

  useEffect(() => {
    if (pastEventsQuery.isLoading) {
      return;
    }

    requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });
  }, [pastEventsQuery.isLoading, pastEventsQuery.data?.data?.length, cardsPerView]);

  const filteredEvents = useMemo(() => {
    const events = pastEventsQuery.data?.data || [];
    if (!searchQuery.trim()) {
      return events;
    }

    const lowerQuery = searchQuery.toLowerCase();
    return events.filter((event) =>
      event.name.toLowerCase().includes(lowerQuery)
    );
  }, [pastEventsQuery.data?.data, searchQuery]);

  const totalPages = Math.ceil(filteredEvents.length / cardsPerView);

  const pages = useMemo(() => {
    return Array.from({ length: totalPages }, (_, pageIndex) => {
      const start = pageIndex * cardsPerView;
      return filteredEvents.slice(start, start + cardsPerView);
    });
  }, [filteredEvents, totalPages, cardsPerView]);

  useEffect(() => {
    setCurrentPage(0);
  }, [cardsPerView, filteredEvents.length]);

  useEffect(() => {
    setCurrentPage((previous) => Math.min(previous, Math.max(totalPages - 1, 0)));
  }, [totalPages]);

  useEffect(() => {
    const measureCards = () => {
      const cards = Array.from(document.querySelectorAll<HTMLElement>('.past-event-card'));

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
  }, [cardsPerView, filteredEvents.length]);

  if (pastEventsQuery.isLoading) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {pastEventsQuery.data?.data && pastEventsQuery.data.data.length > 0 && (
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-4 py-2">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            type="text"
            placeholder="Buscar evento..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 rounded-full p-1 hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {filteredEvents.length === 0 ? (
        <div className="text-center py-8 sm:py-12">
          <p className="text-lg text-muted-foreground">
            {searchQuery ? 'No se encontraron eventos con ese nombre.' : 'No hay eventos pasados disponibles en este momento.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-hidden overflow-y-visible pb-1">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${currentPage * 100}%)` }}
          >
            {pages.map((page, pageIndex) => (
              <div key={`past-events-page-${pageIndex}`} className="min-w-full overflow-hidden">
                <div
                  className={`grid gap-2 sm:gap-3 md:gap-4 ${
                    page.length < cardsPerView
                      ? 'grid-cols-[repeat(auto-fit,minmax(300px,1fr))] justify-center'
                      : 'grid-cols-1 md:grid-cols-2'
                  }`}
                >
                  {page.map((event, index) => {
                    const globalIndex = pageIndex * cardsPerView + index;
                    const eventTheme = getEventColor(event.id, globalIndex);
                    const themeKey = getThemeKey(globalIndex);
                    const shortDescription = summarizeDescription(event.description);
                    const eventLocation = resolveEventLocation(
                      (event as { location?: unknown }).location,
                      'Coliseo Los Fundadores, Universidad del Norte'
                    );
                    const dateRange = formatDateRange(event.startDate, event.endDate);

                    return (
      <GlassCard
                        key={event.id}
                        className="past-event-card group cursor-pointer transition-all duration-500 relative overflow-hidden h-full w-full"
                        style={
                          uniformCardHeight
                            ? { minHeight: `${Math.min(uniformCardHeight, 200)}px` }
                            : { minHeight: '160px' }
                        }
                      >
                        <div
                          className={`absolute inset-0 bg-gradient-to-br ${eventTheme.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                        />

                        <div className="relative z-10 flex h-full flex-col p-3 sm:p-4">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="text-lg sm:text-xl font-bold group-hover:text-primary transition-colors leading-tight flex-1">
                              {event.name}
                            </h3>
                            <div
                              className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 transition-transform"
                              style={{
                                background: `color-mix(in oklch, ${eventTheme.color}, transparent 80%)`,
                                boxShadow: `0 0 20px ${eventTheme.color}`,
                                borderRadius: '0.375rem',
                              }}
                            >
                              <Calendar
                                className="w-3.5 h-3.5"
                                style={{ color: eventTheme.color }}
                              />
                            </div>
                          </div>

                          <p className="text-xs sm:text-sm text-muted-foreground mb-2 leading-relaxed overflow-hidden [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:1]">
                            {shortDescription}
                          </p>

                          <div className="space-y-1 mb-2 flex-1">
                            <div className="flex items-center gap-1.5 text-xs">
                              <div
                                className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                                style={{
                                  background: `color-mix(in oklch, ${eventTheme.color}, transparent 90%)`,
                                  borderRadius: '0.25rem',
                                }}
                              >
                                <Calendar
                                  className="w-3 h-3"
                                  style={{ color: eventTheme.color }}
                                />
                              </div>

                              <span className="text-muted-foreground truncate">
                                {dateRange}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 text-xs">
                              <div
                                className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                                style={{
                                  background: `color-mix(in oklch, ${eventTheme.color}, transparent 90%)`,
                                  borderRadius: '0.25rem',
                                }}
                              >
                                <MapPin
                                  className="w-3 h-3"
                                  style={{ color: eventTheme.color }}
                                />
                              </div>

                              <span className="text-muted-foreground truncate">
                                {eventLocation}
                              </span>
                            </div>
                          </div>

                          <div className="mt-auto flex justify-center pt-2">
                            <Button
                              onClick={() => {
                                const eventIdString = String(event.id);
                                sessionStorage.setItem(`eventTheme:${String(event.id)}`, themeKey);
                                sessionStorage.setItem('eventTheme', themeKey);
                                router.push(
                                  paths.public.pastEvent.getHref({
                                    id: eventIdString,
                                    name: event.name,
                                  }),
                                );
                              }}
                              className="w-full sm:w-auto text-xs sm:text-sm py-1.5 group-hover:scale-102 transition-transform"
                              style={
                                {
                                  '--button-bg': eventTheme.color,
                                  '--button-border': eventTheme.color,
                                  '--button-color': 'black',
                                } as CSSProperties
                              }
                            >
                              Ver más
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
      )}

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
                key={`past-events-dot-${pageIndex}`}
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
  );
}
