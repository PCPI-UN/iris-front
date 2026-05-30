'use client';

import { useState, useMemo, useEffect, RefObject } from 'react';
import { Trophy, Users, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { Chip } from '@heroui/chip';
import { Divider } from '@heroui/divider';
import { Button } from '@/components/ui/button';
import { PRISMATIC_GRADIENT, PRISMATIC_GRADIENT_DIM } from '@/features/landing/components/events-section.utils';

type RankedProject = {
  position: number;
  project: {
    name: string;
    description?: string;
    participants?: any[];
    pendingParticipants?: any[];
    documents?: any[];
  };
  categoryId?: number;
  score?: number | null;
};

type PastEventWinnersTopProps = {
  rankingByCategory: Map<number, RankedProject[]>;
  categories: { id: number; name: string }[];
  winnersRef?: RefObject<HTMLElement>;
  isExposition?: boolean;
  visiblePositions?: number;
  visibleScore?: boolean;
  selectedCategoryId?: number | undefined;
  onCategoryChange?: (id?: number) => void;
};

const getParticipantLabels = (project: any): string[] => {
  const pending = (project?.pendingParticipants ?? [])
    .map((p: any) => `${p?.firstName ?? ''} ${p?.lastName ?? ''}`.trim())
    .filter((l: string) => l.length > 0);

  if (pending.length > 0) return pending;

  const participantsArr = project?.participants ?? project?.teamMembers ?? [];

  return (participantsArr ?? []).map((p: any) => {
    if (!p && typeof p !== 'object') return 'Participante';
    if (typeof p === 'string') return p;
    if ('firstName' in p || 'lastName' in p) {
      const full = `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim();
      if (full) return full;
    }
    if (p.studentCode) return `Código ${p.studentCode}`;
    if (p.name) return p.name;
    if (p.fullName) return p.fullName;
    return 'Participante';
  });
};

const getPosterUrl = (project: any): string | undefined => {
  if (!Array.isArray(project.documents) || !project.documents.length) return undefined;
  const posterDoc = project.documents.find((d: any) =>
    d.type?.toLowerCase().includes('poster'),
  );
  return posterDoc?.url;
};

const hasText = (value?: string | null) =>
  typeof value === 'string' && value.trim().length > 0;

const VISIBLE_MEMBERS_LIMIT = 8;

const getPositionLabel = (pos: number): string =>
  pos === 1 ? '1° Lugar' : pos === 2 ? '2° Lugar' : '3° Lugar';

const getPositionBadgeClass = (pos: number): string =>
  pos === 1
    ? 'award-position-badge first'
    : pos === 2
      ? 'award-position-badge second'
      : 'award-position-badge third';

const TopWinnerCard = ({
  ranked,
  categoryName,
  isExposition,
  showScore,
}: {
  ranked: RankedProject;
  categoryName?: string;
  isExposition?: boolean;
  showScore?: boolean;
}) => {
  const [membersExpanded, setMembersExpanded] = useState(false);
  const members = getParticipantLabels(ranked.project);
  const posterUrl = isExposition ? getPosterUrl(ranked.project) : undefined;

  const visibleMembers = membersExpanded ? members : members.slice(0, VISIBLE_MEMBERS_LIMIT);
  const hiddenCount = members.length - VISIBLE_MEMBERS_LIMIT;

  return (
    <div className="event-awards-card rounded-3xl p-8 sm:p-10 relative overflow-hidden feature-card shadow-2xl border border-border/20 bg-gradient-to-br from-background/5 to-background/10 mx-auto max-w-6xl w-full">
      <div className="event-awards-blob pointer-events-none absolute top-0 right-0 h-48 w-48 rounded-full blur-3xl opacity-18" />

      <div className="relative z-10 flex flex-col lg:flex-row items-start gap-6 w-full">
        <div className="flex-1 space-y-4">
          <div className="flex items-start justify-between gap-3 w-full">
            <span
              className={`${getPositionBadgeClass(ranked.position)} text-sm font-bold px-3 py-1 rounded-full uppercase tracking-wide`}
              aria-label={`Posición ${ranked.position}: ${getPositionLabel(ranked.position)}`}
            >
              {getPositionLabel(ranked.position)}
            </span>

            {posterUrl && (
              <a
                href={posterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden lg:inline-flex winner-cta items-center gap-2 text-sm font-semibold rounded-md px-4 py-2 bg-gradient-to-r from-cyan-500 to-pink-500 text-white shadow-lg"
                aria-label={`Ver póster de ${ranked.project.name}`}
                title={`Ver póster de ${ranked.project.name}`}
              >
                <ExternalLink className="h-4 w-4" />
                Ver póster
              </a>
            )}
          </div>

          {posterUrl && (
            <div className="lg:hidden">
              <a
                href={posterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="winner-cta inline-flex items-center justify-center gap-2 w-full text-sm font-semibold rounded-md px-4 py-3 bg-gradient-to-r from-cyan-500 to-pink-500 text-white shadow-lg"
                aria-label={`Ver póster de ${ranked.project.name}`}
              >
                <ExternalLink className="h-4 w-4" />
                Ver póster
              </a>
            </div>
          )}

          <div>
            <h3 className="winner-title text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground leading-none">
              {ranked.project.name}
            </h3>
            {showScore && ranked.score !== undefined && ranked.score !== null && (
              <div className="mt-2">
                <Chip size="sm" variant="flat" color="success">
                  {String(Number(ranked.score).toFixed(2))}
                </Chip>
              </div>
            )}
            {hasText(ranked.project.description) && (
              <p className="mt-3 text-sm sm:text-base text-foreground/85 leading-relaxed">
                {ranked.project.description}
              </p>
            )}
          </div>

          {members.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users className="event-section-title h-4 w-4 shrink-0" />
                <span className="text-sm uppercase tracking-widest font-bold text-muted-foreground">
                  Equipo
                </span>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                {visibleMembers.map((name, i) => (
                  <Chip
                    key={`${name}-${i}`}
                    size="sm"
                    variant="flat"
                    classNames={{
                      base: 'bg-background/30 border border-border/30 py-2 px-3',
                      content: 'text-sm font-medium',
                    }}
                  >
                    {name}
                  </Chip>
                ))}
                {!membersExpanded && hiddenCount > 0 && (
                  <button
                    onClick={() => setMembersExpanded(true)}
                    className="text-sm font-semibold event-section-title underline underline-offset-2 hover:opacity-80 transition-opacity"
                  >
                    +{hiddenCount} más
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export function PastEventWinnersTop({
  rankingByCategory,
  categories,
  winnersRef,
  isExposition = false,
  visiblePositions = 0,
  visibleScore = true,
  selectedCategoryId,
  onCategoryChange,
}: PastEventWinnersTopProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Init: select first category on mount if none set
  useEffect(() => {
    if (selectedCategoryId === undefined && categories.length > 0) {
      onCategoryChange?.(categories[0].id);
    }
  }, [categories, onCategoryChange, selectedCategoryId]);

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories],
  );

  // Flatten all winners from all categories
  const allWinners = useMemo(() => {
    const list: (RankedProject & { categoryId: number })[] = [];
    for (const [catId, items] of rankingByCategory.entries()) {
      items.forEach((w) => list.push({ ...w, categoryId: catId }));
    }
    return list.sort((a, b) => a.position - b.position);
  }, [rankingByCategory]);

  const appliedLimit = Number(visiblePositions) || 0;

  const availableWinners = useMemo(() => {
    if (appliedLimit === 0) return [];
    return allWinners.filter((w) => w.position >= 1 && w.position <= appliedLimit);
  }, [allWinners, appliedLimit]);

  // Reset carousel index when winners change
  useEffect(() => {
    setCurrentIndex(0);
  }, [availableWinners.length, selectedCategoryId]);

  const handleCategoryChange = (catId: number) => {
    onCategoryChange?.(catId);
    setCurrentIndex(0);
  };

  const hasWinners = availableWinners.length > 0;
  const totalPages = hasWinners ? availableWinners.length : 0;
  const activeWinner = hasWinners ? (availableWinners[currentIndex] ?? availableWinners[0]) : undefined;
  const hasMultipleCategories = categories.length > 1;
  const hasMultiplePages = totalPages > 1;

  return (
    <section
      ref={winnersRef}
      className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-12 py-10 lg:py-16"
    >
      {/* Section header */}
      <div className="flex items-center gap-4 mb-8 lg:mb-12">
        <div className="event-section-icon w-12 h-12 rounded-xl flex items-center justify-center shrink-0">
          <Trophy className="h-6 w-6" />
        </div>
        <h2 className="event-section-title prismatic-text text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight text-left sm:text-center">
          Proyectos Ganadores
        </h2>
        <Divider className="event-divider flex-1" />
      </div>

      {/* Category pill selector — only shown when there are multiple categories */}
      {hasMultipleCategories && (
        <div className="w-full overflow-x-auto overscroll-x-contain scroll-smooth pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 hide-scrollbar mb-8">
          <div className="flex w-max min-w-full items-center gap-3 py-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryChange(cat.id)}
                className={`category-button whitespace-nowrap snap-start px-4 sm:px-5 py-2 rounded-full text-sm font-semibold border transition-all duration-200 flex-shrink-0 ${
                  selectedCategoryId === cat.id
                    ? 'prismatic-border prismatic-text selected-category'
                    : 'prismatic-text border-white/20 text-white/90 hover:border-white/40 hover:bg-white/5'
                }`}
                aria-pressed={selectedCategoryId === cat.id}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Winner card carousel */}
      <div className="space-y-4 sm:space-y-6">
        <div className="overflow-x-hidden overflow-y-visible pb-1">
          {hasWinners ? (
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {availableWinners.map((winner) => (
                <div key={`winner-${winner.position}`} className="min-w-full overflow-hidden">
                  <TopWinnerCard
                    ranked={winner}
                    categoryName={
                      winner.categoryId ? categoryMap.get(winner.categoryId) : undefined
                    }
                    isExposition={isExposition}
                    showScore={visibleScore}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 rounded-2xl border border-dashed border-border/40 text-sm text-muted-foreground">
              Aún no hay ganadores disponibles para la categoría seleccionada.
            </div>
          )}
        </div>

        {/* Prev / next navigation */}
        {hasMultiplePages && (
          <div className="flex items-center justify-center gap-3 sm:gap-4 mt-6">
            <Button
              variant="bordered"
              type="button"
              className="events-nav-button h-9 w-9 sm:h-10 sm:w-10 p-0 border-white/25 backdrop-blur-sm transition-all enabled:hover:shadow-[0_0_18px_rgba(244,114,182,0.28)] disabled:opacity-40 disabled:shadow-none disabled:cursor-default"
              onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
              isDisabled={currentIndex === 0}
              aria-label="Anterior ganador"
              style={
                currentIndex === 0
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
              {availableWinners.map((_, idx) => (
                <button
                  key={`dot-${idx}`}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full border border-white/20 transition-all ${
                    currentIndex === idx
                      ? 'scale-110 shadow-[0_0_10px_rgba(244,114,182,0.35)]'
                      : 'opacity-60 hover:opacity-90'
                  }`}
                  aria-label={`Ir al ${getPositionLabel(availableWinners[idx]?.position ?? idx + 1)}`}
                />
              ))}
            </div>

            <Button
              variant="bordered"
              type="button"
              className="events-nav-button h-9 w-9 sm:h-10 sm:w-10 p-0 border-white/25 backdrop-blur-sm transition-all enabled:hover:shadow-[0_0_18px_rgba(244,114,182,0.28)] disabled:opacity-40 disabled:shadow-none disabled:cursor-default"
              onClick={() => setCurrentIndex((prev) => Math.min(prev + 1, totalPages - 1))}
              isDisabled={currentIndex === totalPages - 1}
              aria-label="Siguiente ganador"
              style={
                currentIndex === totalPages - 1
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
    </section>
  );
}
