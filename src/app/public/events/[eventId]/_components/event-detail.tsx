'use client';

import { useEffect, useMemo, useState } from 'react';
import {
Rocket,
Calendar,
Trophy,
Users,
Building2,
Clock,
ChevronRight,
Star,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Divider } from '@heroui/divider';
import { Chip } from '@heroui/chip';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { paths } from '@/config/paths';
import { usePublicEventDetail } from '@/features/events/api/get-public-event-detail';
import { normalizeEventType } from '@/features/events/utils/normalize-event-type';
import { hasInscriptionDeadlinePassed } from '@/features/events/utils/inscription-deadline';
import {
    isUserRegisteredInEvent,
    resolveJoinTarget,
} from '@/features/events/utils/resolve-join-target';
import { useUser } from '@/lib/auth';
import { Footer } from '@/features/landing/components/cta-footer';

type ThemeKey = 'cyan' | 'pink' | 'yellow';

type EventDetailProps = {
eventId: number;
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

const hasText = (value?: string | null) =>
typeof value === 'string' && value.trim().length > 0;

const getStoredTheme = (eventId: string) => {
    if (typeof window === 'undefined') {
        return null;
    }

    const directTheme = sessionStorage.getItem(`eventTheme:${eventId}`);
    if (directTheme === 'cyan' || directTheme === 'pink' || directTheme === 'yellow') {
        return directTheme;
    }

    const fallbackTheme = sessionStorage.getItem('eventTheme');
    if (fallbackTheme === 'cyan' || fallbackTheme === 'pink' || fallbackTheme === 'yellow') {
        return fallbackTheme;
    }

    return null;
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
const shouldBlockPageRender = eventQuery.isLoading;

const eventTheme = useMemo((): ThemeKey => {
const rawId = String(event?.id ?? eventId);
const storedTheme = getStoredTheme(rawId);

if (
    storedTheme === 'cyan' ||
    storedTheme === 'pink' ||
    storedTheme === 'yellow'
) {
    return storedTheme;
}

const themes: ThemeKey[] = ['cyan', 'pink', 'yellow'];
const numericId = Number(String(rawId).replace(/\D/g, ''));
if (Number.isNaN(numericId)) return themes[0];
return themes[numericId % themes.length];
}, [event?.id, eventId]);

const participants = useMemo(() => {
if (!event?.participants?.length) return [];
return event.participants;
}, [event?.participants]);

const [isRegisteredByMembership, setIsRegisteredByMembership] = useState(false);

useEffect(() => {
let isCancelled = false;

const checkMembership = async () => {
    if (!user?.id || !event?.id) {
    setIsRegisteredByMembership(false);
    return;
    }

    const isRegistered = await isUserRegisteredInEvent(event.id);

    if (!isCancelled) {
    setIsRegisteredByMembership(isRegistered);
    }
};

void checkMembership();

return () => {
    isCancelled = true;
};
}, [event?.id, user?.id]);

const isAlreadyRegistered = useMemo(() => {
if (!user?.id || !participants.length) {
    return isRegisteredByMembership;
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
}) || isRegisteredByMembership;
}, [
participants,
isRegisteredByMembership,
user?.email,
user?.firstName,
user?.id,
user?.lastName,
]);

const isInscriptionClosed = useMemo(
() => hasInscriptionDeadlinePassed(event?.inscriptionDeadline),
[event?.inscriptionDeadline],
);

const program = useMemo(() => {
const items: { label: string; date: string }[] = [];
if (event?.startDate) {
    items.push({ label: 'Inicio del evento', date: formatDateShort(event.startDate) });
}
if (event?.inscriptionDeadline) {
    items.push({
    label: 'Cierre de inscripción',
    date: formatDateShort(event.inscriptionDeadline),
    });
}
if (event?.endDate) {
    items.push({ label: 'Finalización', date: formatDateShort(event.endDate) });
}
return items;
}, [event?.endDate, event?.inscriptionDeadline, event?.startDate]);

const eventTypeLabel = useMemo(
() => normalizeEventType(event?.eventType),
[event?.eventType],
);

const handleJoin = async () => {
if (!event?.id) return;
if (isUserStatusResolving) return;

const targetHref = await resolveJoinTarget({
    eventId: event.id,
    eventName: event.name,
    user,
});

router.push(targetHref);
};

if (shouldBlockPageRender) {
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

const organizers = Array.isArray(event.organizers)
? event.organizers.filter((item) => hasText(item))
: [];
const collaborators = Array.isArray(event.collaborators)
? event.collaborators.filter((item) => hasText(item))
: [];
const primaryOrganizer = organizers[0];
const primaryCollaborator = collaborators[0];

const specificInscriptionDetails = Array.isArray(event.specificInscriptionDetails)
? event.specificInscriptionDetails.filter(
    (item) => hasText(item?.title) && hasText(item?.description),
  )
: [];

const hasRequirementsData = Boolean(
event.minimumTeamSize != null ||
    specificInscriptionDetails.length > 0 ||
    hasText(event.inscriptionRequirements),
);

const hasHeroDescription = hasText(event.description);
const hasProgramData = program.length > 0;
const shouldShowInscriptionSection = hasRequirementsData || hasProgramData;
const awards = Array.isArray(event.awards) ? event.awards : [];
const hasAwardsData = awards.length > 0;
const shouldRenderTopOneAsBanner = awards.length === 1 && awards[0]?.position === 1;
const isFreeEvent =
event.inscriptionCost === 0;
const hasGeneralDetailsSection = Boolean(
hasText(primaryOrganizer) ||
    hasText(primaryCollaborator) ||
    Boolean(eventTypeLabel) ||
    isFreeEvent ||
    hasText(event.location),
);
const shouldShowSponsorsInfo =
hasText(event.aboutOurAllies);
const isGripEvent =
collaborators.some((collaborator) =>
    collaborator.toLowerCase().includes('grip shipping'),
) || event.name.toLowerCase().includes('grip shipping');

return (
<div className="event-detail-page min-h-screen w-full" data-theme={eventTheme}>
    {/* HERO */}
    <section className="relative w-full overflow-hidden">
    <div className="event-detail-blob pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full blur-3xl opacity-20" />
    <div className="event-detail-blob pointer-events-none absolute -bottom-20 -right-20 h-[400px] w-[400px] rounded-full blur-3xl opacity-15" />

    <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-12 pt-10 pb-8 lg:pt-16 lg:pb-12">
        <div className="mb-8 lg:mb-12">
        <p className="event-badge inline-flex items-center gap-2 glass-effect px-4 py-2 rounded-full text-xs sm:text-sm font-semibold">
            <Star className="h-3.5 w-3.5" fill="currentColor" />
            Evento destacado
        </p>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tighter leading-none prismatic-text uppercase mb-6 lg:mb-8">
        {event.name}
        </h1>

        <div className="flex flex-wrap gap-2 mb-8 lg:mb-12">
        {hasText(primaryOrganizer) && (
            <Chip
            startContent={<Building2 className="h-3.5 w-3.5" />}
            variant="flat"
            size="sm"
            classNames={{ base: 'bg-background/30 border border-border/30', content: 'text-xs font-medium' }}
            >
            {primaryOrganizer}
            </Chip>
        )}
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
        {event.inscriptionDeadline && !isInscriptionClosed && (
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

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-10 items-start">
        {hasHeroDescription && (
            <div className="lg:col-span-3 space-y-4">
            <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
                Sobre el evento
            </p>
            <p className="text-base sm:text-lg lg:text-xl text-foreground/80 leading-relaxed">
                {event.description}
            </p>
            </div>
        )}

        <div className={hasHeroDescription ? 'lg:col-span-2' : 'lg:col-span-5 lg:max-w-2xl lg:mx-auto w-full'}>
            <div className="glass-card rounded-2xl p-5 sm:p-6 space-y-4 relative overflow-hidden">
            <div className="event-cta-overlay" />
            <div className="relative z-10 space-y-4">
                {!isInscriptionClosed && (
                <p className="text-sm font-semibold text-foreground/70">¿Listo para participar?</p>
                )}
                {!isInscriptionClosed && (
                <Button
                onPress={handleJoin}
                isDisabled={isUserStatusResolving}
                fullWidth
                size="lg"
                className="event-button event-glow font-black text-base sm:text-lg tracking-wider uppercase py-6"
                startContent={<Rocket className="h-5 w-5" />}
                endContent={<ChevronRight className="h-5 w-5" />}
                >
                {isAlreadyRegistered ? 'Ir al dashboard' : 'Inscríbete ya'}
                </Button>
                )}
                {!isInscriptionClosed && (
                <p className="text-xs text-muted-foreground text-center">
                {!user?.id
                    ? 'Necesitas iniciar sesión para inscribirte'
                    : isAlreadyRegistered
                    ? '✓ Ya estás inscrito en este evento'
                    : '✓ Tu cuenta está lista para inscribirse'}
                </p>
                )}
                {event.inscriptionDeadline && (
                <div className="event-deadline-box rounded-xl p-3 flex items-center gap-3">
                    <Clock className="event-deadline-text h-4 w-4 shrink-0" />
                    <div>
                    {isInscriptionClosed ? (
                        <>
                        <p className="text-xs text-muted-foreground">Las inscripciones para este evento ya finalizaron</p>
                        <p className="event-deadline-text text-sm font-semibold">
                            ¡Te esperamos!
                        </p>
                        </>
                    ) : (
                        <>
                        <p className="text-xs text-muted-foreground">Cierre de inscripciones</p>
                        <p className="event-deadline-text text-sm font-semibold">
                            {formatDate(event.inscriptionDeadline)}
                        </p>
                        </>
                    )}
                    </div>
                </div>
                )}
            </div>
            </div>
        </div>
        </div>
    </div>
    </section>

    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-12">
    <Divider className="event-divider" />
    </div>

    {hasAwardsData && (
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

        {shouldRenderTopOneAsBanner ? (
            <div className="event-info-card rounded-2xl p-6 sm:p-8 feature-card">
            <div className="space-y-2">
                <div className="space-y-2">
                <h3 className="text-xl sm:text-2xl font-black uppercase tracking-wide">{awards[0]?.title ?? 'Premio'}</h3>
                {hasText(awards[0]?.description) && (
                    <p className="text-xl sm:text-2xl font-black text-green-500 uppercase tracking-wide leading-snug">
                    {awards[0].description}
                    </p>
                )}
                </div>
            </div>
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {awards.map((award) => (
                <div
                key={`${award.position}-${award.title}`}
                className="event-awards-card rounded-2xl p-6 sm:p-8 relative overflow-hidden feature-card transition-transform duration-300 hover:scale-105"
                >
                <div className="event-awards-blob pointer-events-none absolute top-0 right-0 h-40 w-40 rounded-full blur-3xl opacity-20" />
                <div className="relative z-10 space-y-4">
                    <div className="flex items-center justify-between">
                    <h3 className="text-lg sm:text-xl font-black uppercase tracking-wide">
                        {award.position === 1
                        ? 'Primer puesto'
                        : award.position === 2
                        ? 'Segundo puesto'
                        : award.position === 3
                            ? 'Tercer puesto'
                            : award.position === 4
                                ? 'Cuarto puesto'
                            : `${award.position}° puesto`}
                    </h3>
                    <div className="w-10 h-10 rounded-full bg-background/50 flex items-center justify-center">
                        <span className="text-sm font-bold">#{award.position}</span>
                    </div>
                    </div>
                    <Divider className="event-divider" />
                    <div className="space-y-1">
                    {hasText(award.description) && (
                        <p className="text-xl sm:text-2xl font-black text-green-500 uppercase tracking-wide leading-snug">
                        {award.description}
                        </p>
                    )}
                    </div>
                </div>
                </div>
            ))}
            </div>
        )}
    </section>
    )}

    {shouldShowInscriptionSection && (
    <section className="event-details-section relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-12 pb-12 lg:pb-20">
        <div className="flex items-center gap-4 py-10 lg:py-16">
            <Divider className="event-divider flex-1" />
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black uppercase tracking-widest text-foreground/50 px-4">
            Inscripción
            </h2>
            <Divider className="event-divider flex-1" />
        </div>

        <div
            className={`grid grid-cols-1 gap-6 lg:gap-8 ${
            hasRequirementsData && hasProgramData ? 'lg:grid-cols-2' : 'lg:grid-cols-1'
            }`}
        >
            {hasRequirementsData && (
            <div className="event-info-card rounded-2xl p-6 sm:p-8 space-y-5 feature-card">
                <div className="flex items-center gap-3">
                <Users className="event-section-title h-5 w-5" />
                <h3 className="text-lg sm:text-xl font-bold">Detalles y Requisitos</h3>
                </div>
                <Divider className="event-divider" />

                <div className="space-y-5">
                {specificInscriptionDetails.map((detail, index) => (
                    <div key={`${detail.title}-${index}`}>
                    <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-2">
                        {detail.title}
                    </p>
                    <p className="text-xs sm:text-sm font-semibold text-foreground/85">
                        {detail.description}
                    </p>
                    </div>
                ))}
                {hasText(event.inscriptionRequirements) && (
                    <>
                    {specificInscriptionDetails.length > 0 && (
                        <Divider className="event-divider" />
                    )}
                    <div>
                        <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-2">
                        Descripción Completa
                        </p>
                        <p className="text-sm text-foreground/75 leading-relaxed">
                        {event.inscriptionRequirements}
                        </p>
                    </div>
                    </>
                )}
                </div>
            </div>
            )}

            {hasProgramData && (
            <div className="event-info-card rounded-2xl p-6 sm:p-8 space-y-5 feature-card">
                <div className="flex items-center gap-3">
                <Calendar className="event-section-title h-5 w-5" />
                <h3 className="text-lg sm:text-xl font-bold">Fechas importantes</h3>
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
            )}
        </div>
        </div>
    </section>
    )}

    {hasGeneralDetailsSection && (
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
            {hasText(primaryOrganizer) && (
            <div>
                <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-1">
                Organización
                </p>
                <p className="text-base font-semibold text-foreground/85">
                {primaryOrganizer}
                </p>
            </div>
            )}
            {hasText(primaryCollaborator) && primaryCollaborator !== primaryOrganizer && (
            <div>
                <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-1">
                Empresa Colaboradora
                </p>
                <p className="text-base font-semibold text-foreground/85">
                {primaryCollaborator}
                </p>
            </div>
            )}
            {eventTypeLabel && (
            <div>
                <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-1">
                Tipo de Evento
                </p>
                <Chip
                variant="flat"
                size="sm"
                classNames={{ base: 'bg-background/30 border border-border/30 w-fit', content: 'text-xs font-semibold uppercase' }}
                >
                {eventTypeLabel}
                </Chip>
            </div>
            )}
            {isFreeEvent && (
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
            {hasText(event.location) && (
            <div className="sm:col-span-2">
                <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-1">
                Ubicación
                </p>
                <p className="text-base sm:text-lg font-semibold text-foreground/90">
                {event.location}
                </p>
                {hasText(event.locationDetails) && (
                <p className="text-sm text-foreground/75">{event.locationDetails}</p>
                )}
            </div>
            )}
        </div>
        </div>
    </section>
    )}

    {shouldShowSponsorsInfo && (
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
            {event.aboutOurAllies}
        </p>
        </div>
    </section>
    )}

    {!isInscriptionClosed && (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-12 pb-10 lg:pb-16">
    <div className="event-cta-footer-card glass-card rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center sm:text-left">
        <p className="text-lg sm:text-xl font-bold">¿Listo para unirte?</p>
        <p className="text-sm text-muted-foreground">
            {!user?.id
            ? 'Inicia sesión y registra tu proyecto en este evento.'
            : isAlreadyRegistered
                ? 'Ya estás inscrito. Ve al dashboard para continuar.'
                : 'Tu cuenta está lista. Completa tu inscripción ahora.'}
        </p>
        </div>
        {!isInscriptionClosed && (
        <Button
        onPress={handleJoin}
        isDisabled={isUserStatusResolving}
        size="lg"
        className="event-button event-glow font-black tracking-wider uppercase shrink-0 min-w-44"
        startContent={<Rocket className="h-5 w-5" />}
        >
        {isAlreadyRegistered ? 'Ir al dashboard' : 'Inscríbete'}
        </Button>
        )}
    </div>
    </section>
    )}

    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-12 pb-8 lg:pb-12">
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
        {isGripEvent && (
        <a
            href="https://gripshipping.com"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-opacity hover:opacity-80"
            aria-label="Ir al sitio de GRIP Shipping"
        >
            <Image
            src="/Grip-Logo-final-blanco.gif"
            alt="GRIP Shipping"
            width={140}
            height={44}
            className="h-9 w-auto object-contain"
            />
        </a>
        )}
        <a
            href="https://www.uninorte.edu.co"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-opacity hover:opacity-80"
            aria-label="Ir al sitio de Uninorte 60"
        >
            <Image
            src="/Logo60-Uninorte.png"
            alt="Uninorte 60"
            width={140}
            height={44}
            className="h-9 w-auto object-contain"
            />
        </a>
        </div>
        </section>

    <Footer />
    </div>
);
};
