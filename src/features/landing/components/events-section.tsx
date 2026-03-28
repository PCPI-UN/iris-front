"use client";

import { RefObject } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, MapPin, ArrowRight } from "lucide-react";
import { GlassCard } from "./glass-card";
import { Button } from "@/components/ui/button";
import { useEventsPublic } from "@/features/events/api/get-event-public";
import { Spinner } from "@/components/ui/spinner";
import { useUser } from "@/lib/auth";
import { resolveJoinTarget } from '@/features/events/utils/resolve-join-target';
import { paths } from "@/config/paths";
import { landingContent } from "../content";

interface EventsSectionProps {
  eventsSectionRef: RefObject<HTMLElement>;
}

type ThemeKey = 'cyan' | 'pink' | 'yellow';

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

// Función para obtener color basado en el ID del evento
const getEventColor = (eventId: number, index: number) => {
  // Usar el índice como fallback si no hay ID
  const colorIndex = index % EVENT_COLORS.length;
  return EVENT_COLORS[colorIndex];
};

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

// Función para formatear fechas
const formatDateRange = (startDate: string, endDate: string) => {
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);

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
  const {
    data: user,
    isLoading: isUserLoading,
    isFetching: isUserFetching,
  } = useUser();
  const isUserStatusResolving = isUserLoading || isUserFetching;

  const handleJoin = async (eventId: number) => {
    if (isUserStatusResolving) {
      return;
    }
    const targetHref = await resolveJoinTarget({
      eventId,
      user,
    });
    router.push(targetHref);
  };

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

  const events = eventsQuery.data?.data || [];

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
          <div className="flex flex-wrap justify-center gap-8">
            {events.map((event, index) => {
              const eventTheme = getEventColor(event.id, index);
              const themeKey = getThemeKey(index);
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
                  {/* Animated gradient background */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${eventTheme.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                  />

                  {/* Content */}
                  <div className="relative z-10">
                    {/* Status badge */}
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

                    {/* Event title */}
                    <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors leading-tight">
                      {event.name}
                    </h3>

                    {/* Event description */}
                    <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                      {shortDescription}
                    </p>

                    {/* Event details */}
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

                    {/* CTA Button */}
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
        )}
      </div>
    </section>
  );
}
