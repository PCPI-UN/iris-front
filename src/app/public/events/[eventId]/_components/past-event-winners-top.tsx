'use client';

import { useState, useMemo, RefObject } from 'react';
import { Trophy, Users, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { Chip } from '@heroui/chip';
import { Divider } from '@heroui/divider';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/features/landing/components/glass-card';
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
};

type PastEventWinnersTopProps = {
  rankingByCategory: Map<number, RankedProject[]>;
  categories: { id: number; name: string }[];
  winnersRef?: RefObject<HTMLElement>;
  isExposition?: boolean;
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

const TopWinnerCard = ({ ranked, position, categoryName, isExposition }: { ranked: RankedProject; position: 1 | 2; categoryName?: string; isExposition?: boolean }) => {
  const [membersExpanded, setMembersExpanded] = useState(false);
  const members = getParticipantLabels(ranked.project);
  const posterUrl = isExposition ? getPosterUrl(ranked.project) : undefined;

  const positionLabel = position === 1 ? '1° Lugar' : '2° Lugar';
  const positionBadgeClass =
    position === 1 ? 'award-position-badge first' :
    'award-position-badge second';
  
  const visibleMembers = membersExpanded ? members : members.slice(0, VISIBLE_MEMBERS_LIMIT);
  const hiddenCount = members.length - VISIBLE_MEMBERS_LIMIT;

  return (
    <div className="event-awards-card rounded-3xl p-8 sm:p-10 lg:p-10 relative overflow-hidden feature-card shadow-2xl border border-border/20 bg-gradient-to-br from-background/5 to-background/10 mx-auto max-w-6xl w-full">
      <div className="event-awards-blob pointer-events-none absolute top-0 right-0 h-48 w-48 rounded-full blur-3xl opacity-18" />

      <div className="relative z-10 flex flex-col lg:flex-row items-start gap-6 w-full">
        <div className="flex-1 space-y-4">
          <div className="flex items-start justify-between gap-3 w-full">
            <div className="flex items-center gap-3">
              <span
                className={`${positionBadgeClass} text-sm font-bold px-3 py-1 rounded-full uppercase tracking-wide`}
                title={positionLabel}
                aria-label={`Posición ${ranked.position}: ${positionLabel}`}
              >
                {positionLabel}
              </span>
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
            <div className="mt-3 lg:hidden">
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
            <h3 className="winner-title text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground leading-tight">
              {ranked.project.name}
            </h3>
            {categoryName && (
              <p className="mt-2 text-sm font-semibold text-cyan-400 uppercase tracking-widest">
                {categoryName}
              </p>
            )}
            {hasText(ranked.project.description) && (
              <p className="mt-3 text-sm sm:text-base text-foreground/85 leading-relaxed description">
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
}: PastEventWinnersTopProps) {
  const [currentPage, setCurrentPage] = useState(0);

  // Create a map of categoryId to category name
  const categoryMap = useMemo(() => {
    const map = new Map<number, string>();
    categories.forEach((cat) => {
      map.set(cat.id, cat.name);
    });
    return map;
  }, [categories]);

  // Get all winners across all categories with their category info
  const allWinners = useMemo(() => {
    const winners: RankedProject[] = [];
    for (const [categoryId, categoryWinners] of rankingByCategory.entries()) {
      categoryWinners.forEach((winner) => {
        winners.push({
          ...winner,
          categoryId,
        });
      });
    }
    return [...winners].sort((a, b) => a.position - b.position);
  }, [rankingByCategory]);

  // Get TOP 1 and TOP 2
  const top1 = useMemo(() => allWinners.find((w) => w.position === 1), [allWinners]);
  const top2 = useMemo(() => allWinners.find((w) => w.position === 2), [allWinners]);

  const winners = [top1, top2].filter((w): w is RankedProject => !!w);
  const totalPages = Math.ceil(winners.length / 1);

  if (winners.length === 0) return null;

  const pages = Array.from({ length: totalPages }, (_, pageIndex) => {
    const start = pageIndex * 1;
    return winners.slice(start, start + 1);
  });

  return (
    <section
      ref={winnersRef}
      className="relative z-10 min-h-0 px-6 pt-12 pb-4 sm:pt-16 sm:pb-6 md:px-12 md:pt-20 md:pb-8"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8 sm:mb-10 md:mb-12">
          <div className="event-section-icon w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
            <Trophy className="h-5 w-5" />
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight prismatic-text">
            Proyectos Ganadores
          </h2>
          <Divider className="event-divider flex-1" />
        </div>

        <div className="space-y-4 sm:space-y-6">
          <div className="overflow-x-hidden overflow-y-visible pb-1">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentPage * 100}%)` }}
            >
              {pages.map((page, pageIndex) => (
                <div key={`winners-page-${pageIndex}`} className="min-w-full overflow-hidden">
                  <div className="space-y-6">
                    {page.map((winner, idx) => (
                      <TopWinnerCard
                        key={`winner-${winner.position}`}
                        ranked={winner}
                        position={winner.position as 1 | 2}
                        categoryName={winner.categoryId ? categoryMap.get(winner.categoryId) : undefined}
                        isExposition={isExposition}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 sm:gap-4 mt-6">
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
                    key={`winners-dot-${pageIndex}`}
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
      </div>
    </section>
  );
}

