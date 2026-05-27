'use client';

import { useMemo, useState } from 'react';
import {
  Calendar,
  Trophy,
  Users,
  Building2,
  Star,
  ExternalLink,
  Eye,
  Search,
  X,
} from 'lucide-react';
import Image from 'next/image';
import { Divider } from '@heroui/divider';
import { Chip } from '@heroui/chip';

import { Input } from '@/components/ui/input';

import { Spinner } from '@/components/ui/spinner';

import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { usePublicPastEventDetail } from '@/features/events/api/get-public-past-event-detail';
import { normalizeEventType } from '@/features/events/utils/normalize-event-type';
import {
  useProjectsWithJurors,
  type ProjectWithJurors,
} from '@/features/projects/api/get-projects-with-jurors';
import { normalizeCategoryId } from '@/lib/compat/category-legacy';
type RankedProject = any;

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const truncateText = (value: string, maxLength: number) => {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength).trimEnd()}…`;
};

import { Footer } from '@/features/landing/components/cta-footer';
import { EventType } from '@/types/api';
import { PRISMATIC_GRADIENT } from '@/features/landing/components/events-section.utils';

type ThemeKey = 'cyan' | 'pink' | 'yellow';

type EventDetailProps = {
  eventId: number;
};

const parseLocalDate = (value?: string) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const formatDateShort = (date?: string) => {
  const parsed = parseLocalDate(date);
  if (!parsed) return 'Por confirmar';

  // Detect if original value included a meaningful time (not midnight)
  const hasTime = !!date && /T\d{2}:\d{2}/.test(date) && !/T00:00(:00)?(Z|$)/.test(date);

  if (hasTime) {
    return parsed.toLocaleString('es', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return parsed.toLocaleDateString('es', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const formatDate = (date?: string) => {
  const parsed = parseLocalDate(date);
  if (!parsed) return 'Fecha por confirmar';

  const hasTime = !!date && /T\d{2}:\d{2}/.test(date) && !/T00:00(:00)?(Z|$)/.test(date);

  if (hasTime) {
    return parsed.toLocaleString('es', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return parsed.toLocaleDateString('es', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const hasText = (value?: string | null) =>
  typeof value === 'string' && value.trim().length > 0;

const getStoredTheme = (eventId: string): ThemeKey | null => {
  if (typeof window === 'undefined') return null;
  const direct = sessionStorage.getItem(`eventTheme:${eventId}`);
  if (direct === 'cyan' || direct === 'pink' || direct === 'yellow') return direct;
  const fallback = sessionStorage.getItem('eventTheme');
  if (fallback === 'cyan' || fallback === 'pink' || fallback === 'yellow') return fallback;
  return null;
};

const getParticipantLabels = (project: ProjectWithJurors): string[] => {
  const pending = (project.pendingParticipants ?? [])
    .map((p) => `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim())
    .filter((l) => l.length > 0);

  if (pending.length > 0) return pending;

  return (project.participants ?? []).map((p) => {
    if ('firstName' in p) {
      const full = `${(p as any).firstName ?? ''} ${(p as any).lastName ?? ''}`.trim();
      if (full) return full;
    }
    if ((p as any).studentCode) return `Código ${(p as any).studentCode}`;
    return 'Participante';
  });
};

const getPosterUrl = (project: ProjectWithJurors): string | undefined => {
  if (!Array.isArray(project.documents) || !project.documents.length) return undefined;
  const posterDoc = project.documents.find((d) =>
    d.type?.toLowerCase().includes('poster'),
  );
  return posterDoc?.url;
};

type WinnerCardProps = {
  ranked: RankedProject;
  categoryLabel: string;
  isExposition: boolean;
};

const VISIBLE_MEMBERS_LIMIT = 8;

const toAwardRanking = (awards: any[], fallbackCategoryId?: number) => {
  const rankingByCategory = new Map<number, RankedProject[]>();

  for (const award of awards) {
    const rawPosition = Number(award?.position);

    if (!Number.isFinite(rawPosition) || rawPosition < 1 || rawPosition > 3) {
      continue;
    }

    const categoryId = Number(award?.categoryId ?? fallbackCategoryId ?? 0);
    if (!Number.isFinite(categoryId) || categoryId <= 0) {
      continue;
    }

    const current = rankingByCategory.get(categoryId) ?? [];

    current.push({
      position: rawPosition,
      project: {
        name: String(award?.title ?? '').trim() || `Proyecto #${rawPosition}`,
        description: String(award?.description ?? '').trim() || undefined,
        participants: [],
        pendingParticipants: [],
        documents: [],
      },
    });

    rankingByCategory.set(categoryId, current);
  }

  for (const [categoryId, items] of rankingByCategory.entries()) {
    rankingByCategory.set(
      categoryId,
      [...items].sort((a, b) => Number(a.position) - Number(b.position)),
    );
  }

  return rankingByCategory;
};

const WinnerCard = ({ ranked, categoryLabel, isExposition }: WinnerCardProps) => {
  const [membersExpanded, setMembersExpanded] = useState(false);

  const members = getParticipantLabels(ranked.project);
  const posterUrl = isExposition ? getPosterUrl(ranked.project) : undefined;
  const positionLabel =
    ranked.position === 1
      ? '1° Lugar'
      : ranked.position === 2
        ? '2° Lugar'
        : '3° Lugar';

  const positionBadgeClass =
    ranked.position === 1 ? 'award-position-badge first' :
    ranked.position === 2 ? 'award-position-badge second' :
    'award-position-badge third';
  const visibleMembers = membersExpanded ? members : members.slice(0, VISIBLE_MEMBERS_LIMIT);
  const hiddenCount = members.length - VISIBLE_MEMBERS_LIMIT;

  return (
    <div className="event-awards-card rounded-3xl p-8 sm:p-10 lg:p-10 relative overflow-hidden feature-card shadow-2xl border border-border/20 bg-gradient-to-br from-background/5 to-background/10 mx-auto max-w-6xl w-full">
      <div className="event-awards-blob pointer-events-none absolute top-0 right-0 h-48 w-48 rounded-full blur-3xl opacity-18" />

      <div className="relative z-10 flex flex-col lg:flex-row items-start gap-6 w-full">
        <div className="flex-1 space-y-4">
          <div className="flex items-start justify-between gap-3 w-full">
            <div className="flex items-center gap-3">
              <span className="event-date-badge text-sm font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                {categoryLabel}
              </span>
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

type WinnersSectionProps = {
  categories: { id: number; name: string }[];
  rankingByCategory: Map<number, RankedProject[]>;
  isExposition: boolean;
  projects?: ProjectWithJurors[];
};

const WinnersSection = ({
  categories,
  rankingByCategory,
  isExposition,
  projects = [],
}: WinnersSectionProps) => {
  const hasMultipleCategories = categories.length > 1;

  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(
    categories[0]?.id ?? 0,
  );
  const [selectedPosition, setSelectedPosition] = useState<1 | 2 | 3>(1);

  const firstCategoryRanking = rankingByCategory.get(
    hasMultipleCategories ? selectedCategoryId : (categories[0]?.id ?? 0),
  );

  let ranked: RankedProject | undefined = hasMultipleCategories
    ? firstCategoryRanking?.[0]
    : firstCategoryRanking?.[selectedPosition - 1];

  // Try to enrich ranked.project with full project data from `projects` when available
  if (ranked && projects.length > 0) {
    const projectCandidate = ranked.project as any;
    let matched: ProjectWithJurors | undefined;

    // prefer numeric id match
    if (projectCandidate && (projectCandidate.id || projectCandidate.projectId)) {
      const pid = projectCandidate.id ?? projectCandidate.projectId;
      matched = projects.find((p) => Number(p.id) === Number(pid));
    }

    // fallback to name match (normalized)
    if (!matched && projectCandidate && projectCandidate.name) {
      const targetName = normalizeText(String(projectCandidate.name));
      matched = projects.find((p) => normalizeText(String(p.name ?? '')) === targetName);
    }

    if (matched) {
      ranked = { ...ranked, project: matched } as RankedProject;
    }
  }

  const categoryLabel = hasMultipleCategories
    ? categories.find((c) => c.id === selectedCategoryId)?.name ?? 'Categoría'
    : categories[0]?.name ?? 'Categoría';

  const hasAnyRanking = categories.some(
    (cat) => (rankingByCategory.get(cat.id)?.length ?? 0) > 0,
  );

  if (!hasAnyRanking) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-12 py-10 lg:py-16">
      <div className="flex items-center gap-4 mb-8 lg:mb-12">
        <div className="event-section-icon w-12 h-12 rounded-xl flex items-center justify-center shrink-0">
          <Trophy className="h-6 w-6" />
        </div>
        <h2 className="event-section-title prismatic-text text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight mx-auto text-center">
          Proyectos Ganadores
        </h2>
        <Divider className="event-divider flex-1" />
      </div>

      <div className="flex items-center overflow-x-auto gap-3 mb-8 py-2 hide-scrollbar">
        {hasMultipleCategories
          ? categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`category-button px-5 py-2 rounded-full text-sm font-semibold border transition-all duration-200 flex-shrink-0 ${
                  selectedCategoryId === cat.id
                    ? 'prismatic-border prismatic-text selected-category'
                    : 'prismatic-text border-white/20 text-white/90 hover:border-white/40 hover:bg-white/5'
                }`}
              >
                {cat.name}
              </button>
            ))
          : ([1, 2, 3] as const).map((pos) => (
              <button
                key={pos}
                onClick={() => setSelectedPosition(pos)}
                className={`category-button px-5 py-2 rounded-full text-sm font-semibold border transition-all duration-200 flex-shrink-0 ${
                  selectedPosition === pos
                    ? 'prismatic-border prismatic-text selected-category'
                    : 'prismatic-text border-white/20 text-white/90 hover:border-white/40 hover:bg-white/5'
                }`}
              >
                Top {pos}
              </button>
            ))}
      </div>
      {ranked ? (
        <div className="winner-grid">
          <WinnerCard
            ranked={ranked}
            categoryLabel={categoryLabel}
            isExposition={isExposition}
          />
        </div>
      ) : (
        <div className="flex items-center justify-center h-32 rounded-2xl border border-dashed border-border/40 text-sm text-muted-foreground">
          No hay información disponible para esta selección.
        </div>
      )}
    </section>
  );
};

type ParticipantsPopupProps = {
  project: ProjectWithJurors;
  isOpen: boolean;
  onClose: () => void;
  categoryName?: string;
  showPoster?: boolean;
};

const ParticipantsPopup = ({
  project,
  isOpen,
  onClose,
  categoryName,
  showPoster = true,
}: ParticipantsPopupProps) => {
  const members = getParticipantLabels(project);
  const posterUrl = getPosterUrl(project);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-hidden={false}
    >
      <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" />

      <div className="absolute left-1/2 top-1/2 w-[94vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border/50 bg-background/30 shadow-2xl backdrop-blur-xl p-5 sm:p-6 glass-card">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Proyecto</p>
            <h3 className="text-lg font-bold text-foreground mt-1">{project.name}</h3>
            {categoryName && <p className="text-sm text-muted-foreground mt-1">{categoryName}</p>}
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-background/20 transition-colors" aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </div>

        {hasText(project.description) && (
          <div className="mb-4">
            <p className="text-sm text-foreground/85 leading-relaxed">{project.description}</p>
          </div>
        )}

        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4" />
            <span className="text-sm uppercase tracking-widest font-bold text-muted-foreground">Participantes</span>
          </div>
          {members.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {members.map((name, i) => (
                <Chip key={`${name}-${i}`} size="sm" variant="flat" classNames={{ base: 'bg-background/30 border border-border/30 py-2 px-3', content: 'text-sm font-medium' }}>
                  {name}
                </Chip>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sin participantes registrados.</p>
          )}
        </div>

        {showPoster && posterUrl && (
          <div className="mt-2">
            <a
              href={posterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 text-sm font-semibold rounded-lg px-4 py-2 text-white shadow-lg"
              style={{
                backgroundImage: PRISMATIC_GRADIENT,
                backgroundSize: '200% auto',
                animation: 'prismatic-shift 8s ease-in-out infinite',
              }}
              aria-label={`Ver póster de ${project.name}`}
            >
              <ExternalLink className="h-4 w-4" />
              Ver póster
            </a>
          </div>
        )}

        <div className="mt-6 flex justify-end"></div>
      </div>
    </div>
  );
};


type ProjectsTableSectionProps = {
  projects: ProjectWithJurors[];
  isExposition: boolean;
  isLoading: boolean;
  isError: boolean;
  categories?: { id: number; name: string }[];
};

const ProjectsTableSection = ({
  projects,
  isExposition,
  isLoading,
  isError,
  categories = [],
}: ProjectsTableSectionProps) => {
  const [search, setSearch] = useState<string>('');
  const [openProject, setOpenProject] = useState<ProjectWithJurors | null>(null);

  const findCategoryName = (project: ProjectWithJurors) => {
    const categoryId = normalizeCategoryId(project) ?? (project as any).category?.id ?? null;
    if (categoryId) {
      const found = categories.find((c) => c.id === Number(categoryId));
      if (found) return found.name;
      // If not found in categories array, return formatted categoryId
      return `Categoría ${categoryId}`;
    }
    if ((project as any).categoryName) return (project as any).categoryName;
    return '—';
  };

  const filtered = useMemo(() => {
    const term = normalizeText(search);
    if (!term) return projects;
    return projects.filter((project) => {
      const memberText = getParticipantLabels(project).join(' ');
      return normalizeText(
        [project.name, project.description ?? '', memberText, findCategoryName(project)].join(' '),
      ).includes(term);
    });
  }, [projects, search, categories]);

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-12 py-10 lg:py-16">
      <div className="flex items-center gap-4 mb-8 lg:mb-10">
        <div className="event-section-icon w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
          <Users className="h-5 w-5" />
        </div>
        <h2 className="event-section-title prismatic-text text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight">
          Proyectos Participantes
        </h2>
        <Divider className="event-divider flex-1" />
      </div>

      <div className="mb-5">
        <Input
          isClearable
          className="w-full lg:max-w-xl"
          placeholder="Buscar por nombre de proyecto o participante…"
          startContent={<Search className="h-4 w-4 text-muted-foreground" />}
          value={search}
          onClear={() => setSearch('')}
          onValueChange={setSearch}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40 rounded-2xl border border-dashed border-border/40">
          <Spinner size="md" />
        </div>
      ) : isError ? (
        <div className="flex items-center justify-center h-40 rounded-2xl border border-dashed border-border/40 text-sm text-muted-foreground">
          No se pudieron cargar los proyectos participantes.
        </div>
      ) : projects.length === 0 ? (
        <div className="flex items-center justify-center h-40 rounded-2xl border border-dashed border-border/40 text-sm text-muted-foreground">
          No hay proyectos para mostrar.
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex items-center justify-center h-40 rounded-2xl border border-dashed border-border/40 text-sm text-muted-foreground">
          No se encontraron proyectos que coincidan con la búsqueda.
        </div>
      ) : (
        <div className="rounded-2xl border border-border/20 bg-background/10 overflow-hidden">
          <div className="max-h-[56vh] overflow-auto">
            {isExposition ? (
              <Table aria-label="Proyectos participantes" selectionMode="none">
                <TableHeader>
                  <TableColumn>Categoría</TableColumn>
                  <TableColumn>Nombre del Proyecto</TableColumn>
                  <TableColumn>Descripción</TableColumn>
                  <TableColumn className="w-28 text-center">Poster</TableColumn>
                  <TableColumn className="w-24 text-center">Ver más</TableColumn>
                </TableHeader>
                <TableBody items={filtered}>
                  {(project) => (
                    <TableRow key={project.id}>
                      <TableCell>
                        <p className="text-sm text-foreground/75">
                          {truncateText(findCategoryName(project), 70)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="font-semibold text-foreground">{project.name}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-foreground/70 line-clamp-2">
                          {truncateText(project.description ?? '—', 270)}
                        </p>
                      </TableCell>
                      <TableCell className="text-center">
                        {getPosterUrl(project) ? (
                          <a
                            href={getPosterUrl(project)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center rounded-full w-8 h-8 bg-gradient-to-br from-cyan-500/20 to-pink-500/20 border border-cyan-500/30 event-section-title hover:from-cyan-500/30 hover:to-pink-500/30 transition-all"
                            aria-label={`Ver poster de ${project.name}`}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <button
                          onClick={() => setOpenProject(project)}
                          className="inline-flex items-center justify-center rounded-full w-8 h-8 bg-background/20 border border-border/30 event-section-title hover:bg-background/40 hover:border-border/60 transition-all"
                          aria-label={`Ver más sobre ${project.name}`}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            ) : (
              <Table aria-label="Proyectos participantes" selectionMode="none">
                <TableHeader>
                  <TableColumn>Categoría</TableColumn>
                  <TableColumn>Nombre del Proyecto</TableColumn>
                  <TableColumn>Descripción</TableColumn>
                  <TableColumn className="w-24 text-center">Ver más</TableColumn>
                </TableHeader>
                <TableBody items={filtered}>
                  {(project) => (
                    <TableRow key={project.id}>
                      <TableCell>
                        <p className="text-sm text-foreground/75">
                          {truncateText(findCategoryName(project), 70)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="font-semibold text-foreground">{project.name}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-foreground/70 line-clamp-2">
                          {truncateText(project.description ?? '—', 270)}
                        </p>
                      </TableCell>
                      <TableCell className="text-center">
                        <button
                          onClick={() => setOpenProject(project)}
                          className="inline-flex items-center justify-center rounded-full w-8 h-8 bg-background/20 border border-border/30 event-section-title hover:bg-background/40 hover:border-border/60 transition-all"
                          aria-label={`Ver más sobre ${project.name}`}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      )}

      {openProject && (
        <ParticipantsPopup
          project={openProject}
          isOpen={Boolean(openProject)}
          onClose={() => setOpenProject(null)}
          categoryName={findCategoryName(openProject)}
          showPoster={isExposition}
        />
      )}
    </section>
  );
};

export const PastEventDetail = ({ eventId }: EventDetailProps) => {
  const eventQuery = usePublicPastEventDetail({ eventId });
  const event = eventQuery.data?.data;
  const projectsQuery = useProjectsWithJurors({
    eventId: event?.id,
    currentPage: 1,
    itemsPerPage: 1000,
    queryConfig: {
      enabled: Boolean(event?.id),
    },
  });

  const projects = projectsQuery.data?.data ?? [];
  const isProjectsLoading = projectsQuery.isLoading || projectsQuery.isFetching;
  const isProjectsError = projectsQuery.isError;
  const isRankingLoading = false;

  const eventTheme = useMemo((): ThemeKey => {
    const rawId = String(event?.id ?? eventId);
    const stored = getStoredTheme(rawId);
    if (stored) return stored;
    const themes: ThemeKey[] = ['cyan', 'pink', 'yellow'];
    const numericId = Number(rawId.replace(/\D/g, ''));
    if (Number.isNaN(numericId)) return themes[0];
    return themes[numericId % themes.length];
  }, [event?.id, eventId]);

  const isExposition = event?.eventType === EventType.Exposition;

  const categories = useMemo(() => {
    const categoryMap = new Map<number, string>();

    // First, add categories from event
    if (event?.categories?.length) {
      event.categories.forEach((c) => {
        categoryMap.set(c.id, c.name || c.description || `Categoría ${c.id}`);
      });
    }

    // Then, add categories from awards
    (event?.awards ?? []).forEach((award) => {
      const id = Number(award?.categoryId);
      if (Number.isFinite(id) && !categoryMap.has(id)) {
        categoryMap.set(id, `Categoría ${id}`);
      }
    });

    // Finally, add categories from projects
    projects.forEach((project) => {
      const id = Number(project?.categoryId);
      if (Number.isFinite(id) && !categoryMap.has(id)) {
        categoryMap.set(id, `Categoría ${id}`);
      }
    });

    return Array.from(categoryMap, ([id, name]) => ({ id, name }));
  }, [event?.categories, event?.awards, projects]);

  const rankingByCategory = useMemo(() => {
    if (!event?.awards?.length) {
      return new Map<number, RankedProject[]>();
    }

    return toAwardRanking(event.awards, categories[0]?.id);
  }, [event?.awards, categories]);

  const eventTypeLabel = useMemo(
    () => normalizeEventType(event?.eventType),
    [event?.eventType],
  );

  const program = useMemo(() => {
    const items: { label: string; date: string }[] = [];
    if (event?.inscriptionDeadline)
      items.push({
        label: 'Cierre de inscripciones',
        date: formatDateShort(event.inscriptionDeadline),
      });
    if (event?.startDate)
      items.push({
        label: 'Inicio del evento',
        date: formatDateShort(event.startDate),
      });
    if (event?.endDate)
      items.push({
        label: 'Fin del evento',
        date: formatDateShort(event.endDate),
      });
    return items;
  }, [event?.endDate, event?.inscriptionDeadline, event?.startDate]);

  const organizers = Array.isArray(event?.organizers)
    ? event.organizers.filter(hasText)
    : [];
  const collaborators = Array.isArray(event?.collaborators)
    ? event.collaborators.filter(hasText)
    : [];
  const primaryOrganizer = organizers[0];
  const primaryCollaborator = collaborators[0];
  const isFreeEvent = event?.inscriptionCost === 0;

  const hasGeneralDetails = Boolean(
    hasText(primaryOrganizer) ||
      hasText(primaryCollaborator) ||
      eventTypeLabel ||
      isFreeEvent ||
      hasText(event?.location),
  );

  const shouldShowAllies = hasText(event?.aboutOurAllies);

  const isGripEvent =
    collaborators.some((c) => c.toLowerCase().includes('grip shipping')) ||
    (event?.name ?? '').toLowerCase().includes('grip shipping');

  if (eventQuery.isLoading) {
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
    <div
      className="event-detail-page event-detail-page-offset min-h-screen w-full"
      data-theme={eventTheme}
    >
      <section className="relative w-full overflow-hidden">
        <div className="event-detail-blob pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full blur-3xl opacity-20" />
        <div className="event-detail-blob pointer-events-none absolute -bottom-20 -right-20 h-[400px] w-[400px] rounded-full blur-3xl opacity-15" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-12 pt-10 pb-8 lg:pt-16 lg:pb-12">
          <div className="mb-6 lg:mb-8">
            <p className="event-badge inline-flex items-center gap-2 glass-effect px-4 py-2 rounded-full text-xs sm:text-sm font-semibold">
              <Star className="h-3.5 w-3.5" fill="currentColor" />
              Evento pasado
            </p>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black tracking-tighter leading-none prismatic-text uppercase mb-6 lg:mb-8 text-center">
            {event.name}
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-10 items-start">
            <div className="lg:col-span-3 space-y-6">
              {hasText(event.description) && (
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
                    Sobre el evento
                  </p>
                  <p className="text-base sm:text-lg lg:text-xl text-foreground/80 leading-relaxed">
                    {event.description}
                  </p>
                </div>
              )}

              {program.length > 0 && (
                <div className="space-y-3">
                  {program.map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm text-muted-foreground">
                        {item.label}:
                      </span>
                      <span className="event-date-badge text-xs font-semibold px-2.5 py-1 rounded-lg">
                        {item.date}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {hasGeneralDetails && (
              <div className="lg:col-span-2">
                <div className="event-info-card glass-card rounded-2xl p-5 sm:p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <Building2 className="event-section-title h-5 w-5" />
                    <h3 className="text-base sm:text-lg font-bold">Información General</h3>
                  </div>
                  <Divider className="event-divider" />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {organizers.length > 0 && (
                      <div>
                        <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-1">
                          Organizaciones
                        </p>
                        <div className="flex flex-col gap-1">
                          {organizers.map((o, idx) => (
                            <p key={`org-${idx}`} className="text-sm font-semibold text-foreground/85">
                              {o}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {collaborators.length > 0 && (
                      <div>
                        <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-1">
                          Empresas Colaboradoras
                        </p>
                        <div className="flex flex-col gap-1">
                          {collaborators.map((c, idx) => (
                            <p key={`col-${idx}`} className="text-sm font-semibold text-foreground/85">
                              {c}
                            </p>
                          ))}
                        </div>
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
                          classNames={{
                            base: 'bg-background/30 border border-border/30 w-fit',
                            content: 'text-xs font-semibold uppercase',
                          }}
                        >
                          {eventTypeLabel}
                        </Chip>
                      </div>
                    )}

                    {isFreeEvent && (
                      <div>
                        <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-1">
                          Costo
                        </p>
                        <Chip
                          startContent={<span className="text-lg">✓</span>}
                          variant="flat"
                          size="sm"
                          classNames={{
                            base: 'bg-green-500/10 border border-green-500/30 w-fit',
                            content: 'text-xs font-bold text-green-600',
                          }}
                        >
                          Inscripción sin costo
                        </Chip>
                      </div>
                    )}

                    {hasText(event.location) && (
                      <div>
                        <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-1">
                          Ubicación
                        </p>
                        <p className="text-sm font-semibold text-foreground/90">
                          {event.location}
                        </p>
                        {hasText(event.locationDetails) && (
                          <p className="text-xs text-foreground/70 mt-0.5">
                            {event.locationDetails}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-12">
        <Divider className="event-divider" />
      </div>

      {isRankingLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="md" />
        </div>
      ) : (
        <WinnersSection
          categories={categories}
          rankingByCategory={rankingByCategory}
          isExposition={isExposition}
          projects={projects}
        />
      )}

      <>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-12">
          <Divider className="event-divider" />
        </div>
        <ProjectsTableSection
          projects={projects}
          isExposition={isExposition}
          isLoading={isProjectsLoading}
          isError={isProjectsError}
          categories={categories}
        />
      </>

      {shouldShowAllies && (
        <>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-12">
            <Divider className="event-divider" />
          </div>
          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-12 py-10 lg:py-16">
            <div className="flex items-center gap-4 mb-6 lg:mb-10">
              <div className="event-section-icon w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                <Star className="h-5 w-5" />
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight prismatic-text">
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
        </>
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

