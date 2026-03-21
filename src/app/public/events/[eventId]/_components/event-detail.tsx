'use client';

import { useMemo } from 'react';
import { Rocket,
  Calendar,
  Trophy,
  Users,
  Building2,
  UserPlus,
  Clock,
  ChevronRight,
  Star,
  MapPin,
  DollarSign,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Divider } from '@heroui/divider';
import { Chip } from '@heroui/chip';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { paths } from '@/config/paths';
import { usePublicEventDetail } from '@/features/events/api/get-public-event-detail';
import { resolveJoinTarget } from '@/features/events/utils/resolve-join-target';
import { useUser } from '@/lib/auth';
import { Footer } from '@/features/landing/components/cta-footer';

type ThemeKey = 'cyan' | 'pink' | 'yellow';

type EventDetailProps = {
  eventId: string;
};

const parseLocalDate = (value?: string) => {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return new Date(year, month - 1, day);
};

const formatDate = (date?: string) => {
  const parsedDate = parseLocalDate(date);
  if (!parsedDate) return 'Fecha por confirmar';
  return parsedDate.toLocaleDateString('es', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const formatDateShort = (date?: string) => {
  const parsedDate = parseLocalDate(date);
  if (!parsedDate) return 'Por confirmar';
  return parsedDate.toLocaleDateString('es', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const EventDetail = ({ eventId }: EventDetailProps) => {
  const router = useRouter();
  const {
    data: user,
    isLoading: isUserLoading,
    isFetching: isUserFetching,
  } = useUser();
  const eventQuery = usePublicEventDetail({ eventId });
  const event = eventQuery.data?.data;
  const isUserStatusResolving = isUserLoading || isUserFetching;

  const eventTheme = useMemo((): ThemeKey => {
    // Primero intenta leer desde sessionStorage
    const storedTheme = typeof window !== 'undefined' ? sessionStorage.getItem('eventTheme') : null;
    if (
      storedTheme === 'cyan' ||
      storedTheme === 'pink' ||
      storedTheme === 'yellow'
    ) {
      return storedTheme;
    }

    const themes: ThemeKey[] = ['cyan', 'pink', 'yellow'];
    const rawId = event?.id ?? eventId;
    const numericId = Number(String(rawId).replace(/\D/g, ''));
    if (Number.isNaN(numericId)) return themes[0];
    return themes[numericId % themes.length];
  }, [event?.id, eventId]);

  const participants = useMemo(() => {
    if (!event?.participants?.length) return [];
    return event.participants;
  }, [event?.participants]);

  const isAlreadyRegistered = useMemo(() => {
    if (!user?.id || !participants.length) {
      return false;
    }

    const normalize = (value?: string | null) =>
      String(value ?? '')
        .trim()
        .toLowerCase();

    const fullName = normalize(`${user.firstName} ${user.lastName}`);
    const email = normalize(user.email);

    return participants.some((participant) => {
      const normalizedParticipant = normalize(participant);
      return (
        normalizedParticipant === fullName ||
        normalizedParticipant === email
      );
    });
  }, [participants, user?.email, user?.firstName, user?.id, user?.lastName]);

  const registrationRequirements = useMemo(
    () => [
      'Registrar un proyecto para participar en el evento.',
      'Completar los datos del equipo y su propuesta.',
      event?.inscriptionDeadline
        ? `Finalizar la inscripción antes del ${formatDate(event.inscriptionDeadline)}.`
        : 'Mantenerte atento a la fecha limite de inscripción.',
    ],
    [event?.inscriptionDeadline],
  );

  const program = useMemo(() => {
    const items: { label: string; date: string }[] = [];
    if (event?.startDate)
      items.push({ label: 'Inicio del evento', date: formatDateShort(event.startDate) });
    if (event?.inscriptionDeadline)
      items.push({
        label: 'Cierre de inscripción',
        date: formatDateShort(event.inscriptionDeadline),
      });
    if (event?.endDate)
      items.push({ label: 'Finalización', date: formatDateShort(event.endDate) });
    if (!items.length) items.push({ label: 'Programa por anunciar', date: 'Pronto' });
    return items;
  }, [event?.endDate, event?.inscriptionDeadline, event?.startDate]);

  const handleJoin = async () => {
    if (!event?.id) return;
    if (isUserStatusResolving) return;

    const targetHref = await resolveJoinTarget({
      eventId: event.id,
      user,
    });
    router.push(targetHref);
  };

  if (eventQuery.isLoading || isUserStatusResolving) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="glass-card rounded-3xl p-10 text-center max-w-md w-full">
          <h1 className="text-2xl font-bold mb-3">Evento no encontrado</h1>
          <p className="text-muted-foreground">
            No pudimos cargar la información de este evento.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="event-detail-page min-h-screen w-full" data-theme={eventTheme}>

      {/* ─────────────── HERO ─────────────── */}
      <section className="relative w-full overflow-hidden">
        {/* Ambient blobs — color comes from CSS via --event-color */}
        <div className="event-detail-blob pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full blur-3xl opacity-20" />
        <div className="event-detail-blob pointer-events-none absolute -bottom-20 -right-20 h-[400px] w-[400px] rounded-full blur-3xl opacity-15" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-12 pt-10 pb-8 lg:pt-16 lg:pb-12">

          {/* Top bar: badge */}
          <div className="mb-8 lg:mb-12">
            <p className="event-badge inline-flex items-center gap-2 glass-effect px-4 py-2 rounded-full text-xs sm:text-sm font-semibold">
              <Star className="h-3.5 w-3.5" fill="currentColor" />
              Evento destacado
            </p>
          </div>

          {/* Event title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tighter leading-none prismatic-text uppercase mb-6 lg:mb-8">
            {event.name}
          </h1>

          {/* Meta chips */}
          <div className="flex flex-wrap gap-2 mb-8 lg:mb-12">
            <Chip
              startContent={<Building2 className="h-3.5 w-3.5" />}
              variant="flat"
              size="sm"
              classNames={{ base: 'bg-background/30 border border-border/30', content: 'text-xs font-medium' }}
            >
              {event.organization}
            </Chip>
            {event.startDate && (
              <Chip
                startContent={<Calendar className="h-3.5 w-3.5" />}
                variant="flat"
                size="sm"
                classNames={{ base: 'bg-background/30 border border-border/30', content: 'text-xs font-medium' }}
              >
                {formatDateShort(event.startDate)}
              </Chip>
            )}
            {event.inscriptionDeadline && (
              <Chip
                startContent={<Clock className="h-3.5 w-3.5" />}
                variant="flat"
                size="sm"
                classNames={{ base: 'bg-background/30 border border-border/30', content: 'text-xs font-medium' }}
              >
                Cierre: {formatDateShort(event.inscriptionDeadline)}
              </Chip>
            )}
          </div>

          {/* Description + CTA — 2-col on desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-10 items-start">
            {/* Left: description */}
            <div className="lg:col-span-3 space-y-4">
              <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
                Sobre el evento
              </p>
              <p className="text-base sm:text-lg lg:text-xl text-foreground/80 leading-relaxed">
                {event.description}
              </p>
            </div>

            {/* Right: CTA card */}
            <div className="lg:col-span-2">
              <div className="glass-card rounded-2xl p-5 sm:p-6 space-y-4 relative overflow-hidden">
                <div className="event-cta-overlay" />
                <div className="relative z-10 space-y-4">
                  <p className="text-sm font-semibold text-foreground/70">¿Listo para participar?</p>
                  <Button
                    onPress={handleJoin}
                    isDisabled={isUserStatusResolving}
                    fullWidth
                    size="lg"
                    className="event-button event-glow font-black text-base sm:text-lg tracking-wider uppercase py-6"
                    startContent={<Rocket className="h-5 w-5" />}
                    endContent={<ChevronRight className="h-5 w-5" />}
                  >
                    Inscribete YA!!
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    {!user?.id
                      ? 'Necesitas iniciar sesion para inscribirte'
                      : isAlreadyRegistered
                        ? '✓ Ya estas inscrito en este evento'
                        : '✓ Tu cuenta esta lista para inscribirse'}
                  </p>
                  {event.inscriptionDeadline && (
                    <div className="event-deadline-box rounded-xl p-3 flex items-center gap-3">
                      <Clock className="event-deadline-text h-4 w-4 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Cierre de inscripciones</p>
                        <p className="event-deadline-text text-sm font-semibold">
                          {formatDate(event.inscriptionDeadline)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────── SEPARATOR ─────────────── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-12">
        <Divider className="event-divider" />
      </div>

      {/* ─────────────── PREMIOS ─────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-12 py-10 lg:py-16">
        <div className="flex items-center gap-4 mb-6 lg:mb-10">
          <div className="event-section-icon w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
            <Trophy className="h-5 w-5" />
          </div>
          <h2 className="event-section-title text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight">
            Premios
          </h2>
          <Divider className="event-divider flex-1" />
        </div>

        {event.prizes && event.prizes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {event.prizes.map((prize: any) => (
              <div
                key={prize.position}
                className="event-awards-card rounded-2xl p-6 sm:p-8 relative overflow-hidden feature-card transition-transform duration-300 hover:scale-105"
              >
                <div className="event-awards-blob pointer-events-none absolute top-0 right-0 h-40 w-40 rounded-full blur-3xl opacity-20" />
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg sm:text-xl font-black uppercase tracking-wide">
                      {prize.position === 1
                        ? 'Primer puesto'
                        : prize.position === 2
                          ? 'Segundo puesto'
                          : prize.position === 3
                            ? 'Tercer puesto'
                            : `${prize.position}° puesto`}
                    </h3>
                    <div className="w-10 h-10 rounded-full bg-background/50 flex items-center justify-center">
                      <span className="text-sm font-bold">#{prize.position}</span>
                    </div>
                  </div>
                  <Divider className="event-divider" />
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-500" />
                    <p className="text-2xl sm:text-3xl font-black text-green-500">
                      {prize.amount.toLocaleString('es-CO')}
                    </p>
                    <span className="text-xs font-semibold text-muted-foreground ml-2">
                      {prize.currency}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="event-awards-card rounded-2xl lg:rounded-3xl p-6 sm:p-8 lg:p-10 relative overflow-hidden feature-card">
            <div className="event-awards-blob pointer-events-none absolute top-0 right-0 h-40 w-40 rounded-full blur-3xl opacity-20" />
            <p className="relative z-10 text-base sm:text-lg lg:text-xl text-foreground/85 leading-relaxed max-w-4xl">
              {event.awardsInfo}
            </p>
          </div>
        )}
      </section>

      {/* ─────────────── INSCRIPCIÓN / DETALLES ─────────────── */}
      <section className="event-details-section relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-12 pb-12 lg:pb-20">

          {/* Section heading */}
          <div className="flex items-center gap-4 py-10 lg:py-16">
            <Divider className="event-divider flex-1" />
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black uppercase tracking-widest text-foreground/50 px-4">
              Inscripción
            </h2>
            <Divider className="event-divider flex-1" />
          </div>

          {/* 2-col on desktop: Requisitos | Programa */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">

            {/* Detalles y Requisitos */}
            <div className="event-info-card rounded-2xl p-6 sm:p-8 space-y-5 feature-card">
              <div className="flex items-center gap-3">
                <Users className="event-section-title h-5 w-5" />
                <h3 className="text-lg sm:text-xl font-bold">Detalles y Requisitos</h3>
              </div>
              <Divider className="event-divider" />
              
              {event.requirements ? (
                <div className="space-y-5">
                  <div>
                    <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-2">
                      Tamaño del Equipo
                    </p>
                    <p className="text-sm sm:text-base font-semibold text-foreground/85">
                      {event.requirements.teamSize}
                    </p>
                  </div>
                  {event.requirements.disciplines && (
                    <div>
                      <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-2">
                        Disciplinas Requeridas
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {event.requirements.disciplines.map((discipline: string) => (
                          <Chip
                            key={discipline}
                            variant="flat"
                            size="sm"
                            classNames={{ base: 'bg-background/30 border border-border/30', content: 'text-xs font-medium' }}
                          >
                            {discipline}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  )}
                  {event.requirements.minAttendance && (
                    <div>
                      <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-2">
                        Permanencia Mínima
                      </p>
                      <p className="text-sm sm:text-base font-semibold text-foreground/85">
                        {event.requirements.minAttendance} horas
                      </p>
                    </div>
                  )}
                  <Divider className="event-divider" />
                  <div>
                    <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-2">
                      Descripción Completa
                    </p>
                    <p className="text-sm text-foreground/75 leading-relaxed">
                      {event.requirements.description}
                    </p>
                  </div>
                </div>
              ) : (
                <ul className="space-y-4">
                  {registrationRequirements.map((req, i) => (
                    <li key={req} className="flex items-start gap-4">
                      <div className="event-req-number mt-0.5 shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                        {i + 1}
                      </div>
                      <p className="text-sm sm:text-base text-foreground/75 leading-relaxed pt-0.5">
                        {req}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Programa */}
            <div className="event-info-card rounded-2xl p-6 sm:p-8 space-y-5 feature-card">
              <div className="flex items-center gap-3">
                <Calendar className="event-section-title h-5 w-5" />
                <h3 className="text-lg sm:text-xl font-bold">Programa</h3>
              </div>
              <Divider className="event-divider" />
              <ul className="space-y-3">
                {program.map((item) => (
                  <li key={item.label} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="event-bullet shrink-0 w-2 h-2 rounded-full" />
                      <p className="text-sm sm:text-base text-foreground/75 truncate">
                        {item.label}
                      </p>
                    </div>
                    <span className="event-date-badge shrink-0 text-xs font-semibold px-2.5 py-1 rounded-lg">
                      {item.date}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>
      </section>

      {/* ─────────────── DETALLES DEL EVENTO ─────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-12 pb-10 lg:pb-16">
        <div className="flex items-center gap-4 mb-6 lg:mb-10">
          <div className="event-section-icon w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
            <Building2 className="h-5 w-5" />
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight">
            Detalles del Evento
          </h2>
          <Divider className="event-divider flex-1" />
        </div>

        <div className="event-info-card rounded-2xl p-6 sm:p-8 space-y-5 feature-card">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="event-section-title h-5 w-5" />
            <h3 className="text-lg sm:text-xl font-bold">Información General</h3>
          </div>
          <Divider className="event-divider" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {event.organization && (
              <div>
                <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-1">
                  Organización
                </p>
                <p className="text-base font-semibold text-foreground/85">
                  {event.organization}
                </p>
              </div>
            )}
            {event.company && event.company !== event.organization && (
              <div>
                <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-1">
                  Empresa Colaboradora
                </p>
                <p className="text-base font-semibold text-foreground/85">
                  {event.company}
                </p>
              </div>
            )}
            {event.eventType && (
              <div>
                <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-1">
                  Tipo de Evento
                </p>
                <Chip
                  variant="flat"
                  size="sm"
                  classNames={{ base: 'bg-background/30 border border-border/30 w-fit', content: 'text-xs font-semibold uppercase' }}
                >
                  {event.eventType}
                </Chip>
              </div>
            )}
            {event.cost === 'free' && (
              <div className="pt-2 sm:pt-0">
                <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-1">
                  Costo
                </p>
                <Chip
                  startContent={<span className="text-lg">✓</span>}
                  variant="flat"
                  size="sm"
                  classNames={{ base: 'bg-green-500/10 border border-green-500/30 w-fit', content: 'text-xs font-bold text-green-600' }}
                >
                  Inscripción sin costo
                </Chip>
              </div>
            )}
            {event.location?.name && (
              <div className="sm:col-span-2">
                <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-1">
                  Ubicación
                </p>
                <p className="text-base sm:text-lg font-semibold text-foreground/90">
                  {event.location.name}
                </p>
                <p className="text-sm text-foreground/75">
                  {[event.location.institution, event.location.address]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
            )}
          </div>

        </div>
      </section>

      {event.sponsors?.length ? (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-12 pb-10 lg:pb-16">
          <div className="flex items-center gap-4 mb-6 lg:mb-10">
            <div className="event-section-icon w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
              <Star className="h-5 w-5" />
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight">
              Sobre Nuestros Aliados
            </h2>
            <Divider className="event-divider flex-1" />
          </div>

          <div className="event-info-card rounded-2xl p-6 sm:p-8 feature-card">
            <p className="text-sm sm:text-base text-foreground/75 leading-relaxed">
              {event.sponsorInfo || 'Información del aliado por confirmar.'}
            </p>
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-12 pb-10 lg:pb-16">
        <div className="event-cta-footer-card glass-card rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <p className="text-lg sm:text-xl font-bold">¿Listo para unirte?</p>
            <p className="text-sm text-muted-foreground">
              {!user?.id
                ? 'Inicia sesion y registra tu proyecto en este evento.'
                : isAlreadyRegistered
                  ? 'Ya estas inscrito. Ve al dashboard para continuar.'
                  : 'Tu cuenta esta lista. Completa tu inscripción ahora.'}
            </p>
          </div>
          <Button
            onPress={handleJoin}
            isDisabled={isUserStatusResolving}
            size="lg"
            className="event-button event-glow font-black tracking-wider uppercase shrink-0 min-w-44"
            startContent={<Rocket className="h-5 w-5" />}
          >
            Inscribete
          </Button>
        </div>
      </section>

      {event.sponsors?.length ? (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-12 pb-8 lg:pb-12">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            {event.sponsors.map((sponsor) => {
              const logo = (
                <Image
                  src={sponsor.logoSrc}
                  alt={sponsor.name}
                  width={140}
                  height={44}
                  className="h-9 w-auto object-contain"
                />
              );

              if (!sponsor.url) {
                return <div key={sponsor.name}>{logo}</div>;
              }

              return (
                <a
                  key={sponsor.name}
                  href={sponsor.url}
                  target="_blank"
                  rel="noreferrer"
                  className="transition-opacity hover:opacity-80"
                  aria-label={`Ir al sitio de ${sponsor.name}`}
                >
                  {logo}
                </a>
              );
            })}
          </div>
        </section>
      ) : null}

      <Footer />

    </div>
  );
};
