'use client';

import { useState, useMemo, RefObject } from 'react';
import { Trophy, Users, ExternalLink } from 'lucide-react';
import { Chip } from '@heroui/chip';
import { Divider } from '@heroui/divider';
import { Spinner } from '@/components/ui/spinner';
import { documentLink } from "@/lib/document-link";

export type PastEventRankedWinner = {
  position: number;
  project: {
    id?: number;
    name: string;
    description?: string;
    participants?: any[];
    pendingParticipants?: any[];
    documents?: any[];
  };
  categoryId?: number;
  categoryName?: string;
  score?: number | null;
};

type PastEventWinnersTopProps = {
  winners: PastEventRankedWinner[];
  categories: { id: number; name: string }[];
  winnersRef?: RefObject<HTMLElement>;
  isExposition?: boolean;
  isLoading?: boolean;
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
  return posterDoc ? documentLink(posterDoc) : undefined;
};

const hasText = (value?: string | null) =>
  typeof value === 'string' && value.trim().length > 0;

const VISIBLE_MEMBERS_LIMIT = 8;

// Before, every position from 3 on read "3° Lugar"
const getPositionLabel = (pos: number): string => `${pos}° Lugar`;

const getPositionBadgeClass = (pos: number): string =>
  pos === 1
    ? 'award-position-badge first'
    : pos === 2
      ? 'award-position-badge second'
      : 'award-position-badge third';

const TopWinnerCard = ({
  ranked,
  categoryName,
  showCategoryBadge,
  isExposition,
  showScore,
  isCoWinner,
}: {
  ranked: PastEventRankedWinner;
  categoryName?: string;
  showCategoryBadge?: boolean;
  isExposition?: boolean;
  showScore?: boolean;
  /** Shares the position with other projects in the active ranking (same rounded average) */
  isCoWinner?: boolean;
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
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`${getPositionBadgeClass(ranked.position)} text-sm font-bold px-3 py-1 rounded-full uppercase tracking-wide`}
                aria-label={`Posición ${ranked.position}: ${getPositionLabel(ranked.position)}${isCoWinner ? ', coganador' : ''}`}
              >
                {getPositionLabel(ranked.position)}
              </span>
              {isCoWinner && (
                <Chip size="sm" variant="flat" color="warning" startContent={<Users className="h-3 w-3" />}>
                  Coganador
                </Chip>
              )}
              {showCategoryBadge && categoryName && (
                <Chip size="sm" variant="flat" classNames={{ base: 'bg-white/10 border border-white/15' }}>
                  {categoryName}
                </Chip>
              )}
            </div>

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
  winners,
  categories,
  winnersRef,
  isExposition = false,
  isLoading = false,
  visiblePositions = 0,
  visibleScore = true,
  selectedCategoryId,
  onCategoryChange,
}: PastEventWinnersTopProps) {
  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories],
  );

  // Winners already come scoped from the backend for either the global ranking
  // ("Todas las categorías") or the chosen department/category (?categoryId=...).
  const sortedWinners = useMemo(
    () => [...winners].sort((a, b) => a.position - b.position),
    [winners],
  );

  const appliedLimit = Number(visiblePositions) || 0;

  const availableWinners = useMemo(() => {
    if (appliedLimit === 0) return sortedWinners;
    return sortedWinners.filter((w) => w.position >= 1 && w.position <= appliedLimit);
  }, [sortedWinners, appliedLimit]);

  // Positions come from the backend: in the active ranking (global or category),
  // projects sharing a position are co-winners.
  const coWinnerPositions = useMemo(() => {
    const counts = new Map<number, number>();
    for (const w of availableWinners) {
      counts.set(w.position, (counts.get(w.position) ?? 0) + 1);
    }
    return new Set([...counts].filter(([, n]) => n > 1).map(([pos]) => pos));
  }, [availableWinners]);

  const handleCategoryChange = (catId?: number) => {
    onCategoryChange?.(catId);
  };

  const isAllCategoriesSelected = selectedCategoryId === undefined;
  const hasWinners = availableWinners.length > 0;
  const hasMultipleCategories = categories.length > 1;

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

      {/* Category pill selector — includes "Todas las categorías" for global ranking */}
      {hasMultipleCategories && (
        <div className="w-full overflow-x-auto overscroll-x-contain scroll-smooth pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 hide-scrollbar mb-8">
          <div className="flex w-max min-w-full items-center gap-3 py-2">
            <button
              type="button"
              onClick={() => handleCategoryChange(undefined)}
              className={`category-button whitespace-nowrap snap-start px-4 sm:px-5 py-2 rounded-full text-sm font-semibold border transition-all duration-200 flex-shrink-0 ${
                isAllCategoriesSelected
                  ? 'prismatic-border prismatic-text selected-category'
                  : 'prismatic-text border-white/20 text-white/90 hover:border-white/40 hover:bg-white/5'
              }`}
              aria-pressed={isAllCategoriesSelected}
            >
              Todas las categorías
            </button>
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

      {/* All visible winners rendered directly in ranked order (1° Lugar, 2° Lugar, ...) */}
      <div>
        {isLoading ? (
          <div
            className="flex items-center justify-center min-h-[200px] rounded-2xl border border-dashed border-border/40"
            aria-busy="true"
          >
            <Spinner size="md" />
          </div>
        ) : hasWinners ? (
          <ol
            aria-label="Lista de proyectos ganadores"
            className="space-y-5 sm:space-y-6"
          >
            {availableWinners.map((winner, idx) => (
              <li
                key={`winner-${winner.categoryId ?? 0}-${winner.position}-${winner.project.id ?? winner.project.name}-${idx}`}
              >
                <TopWinnerCard
                  ranked={winner}
                  isCoWinner={coWinnerPositions.has(winner.position)}
                  showCategoryBadge={isAllCategoriesSelected && hasMultipleCategories}
                  categoryName={
                    winner.categoryName ??
                    (winner.categoryId ? categoryMap.get(winner.categoryId) : undefined)
                  }
                  isExposition={isExposition}
                  showScore={visibleScore}
                />
              </li>
            ))}
          </ol>
        ) : (
          <div className="flex items-center justify-center h-32 rounded-2xl border border-dashed border-border/40 text-sm text-muted-foreground">
            {isAllCategoriesSelected
              ? 'Aún no hay ganadores disponibles para mostrar.'
              : 'Aún no hay ganadores disponibles para la categoría seleccionada.'}
          </div>
        )}
      </div>
    </section>
  );
}
