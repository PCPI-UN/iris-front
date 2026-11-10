// Component responsible for displaying the developers that have made IRIS possible.
'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowUpRight,
  Code2,
  Github,
  Grid2x2,
  Layers3,
  Rows3,
  Search,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import {
  ContributorRoleGroup,
  contributors,
} from '@/features/developers/data/contributors';
import {
  type ContributorSummary,
  buildRoleStats,
  compareVersions,
  countDistinctRoleGroups,
  filterContributors,
  getContributorsByVersion,
  getRelatedCollaborators,
  getVersionFilters,
  isLeadershipRoleLabel,
  summarizeContributors,
} from '@/features/developers/lib/contributor-utils';

const normalize = (value: string) => value.trim().toLowerCase();

const prismaticTitleStyle = {
  backgroundImage:
    'linear-gradient(115deg, oklch(0.78 0.15 195) 0%, oklch(0.82 0.18 330) 52%, oklch(0.88 0.16 85) 100%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
};

type RoleVisualMeta = {
  barClass: string;
  dotClass: string;
  badgeClass: string;
  avatarRingClass: string;
  spotlightColor: string;
};

const ROLE_VISUAL_META: Record<ContributorRoleGroup, RoleVisualMeta> = {
  'Software Architecture': {
    barClass: 'bg-amber-400',
    dotClass: 'bg-amber-400',
    badgeClass: 'border-amber-400/35 bg-amber-400/10 text-amber-200',
    avatarRingClass: 'border-amber-400/35 bg-amber-400/10 text-amber-200',
    spotlightColor: 'rgba(251, 191, 36, 0.14)',
  },
  Frontend: {
    barClass: 'bg-cyan-400',
    dotClass: 'bg-cyan-400',
    badgeClass: 'border-cyan-400/35 bg-cyan-400/10 text-cyan-200',
    avatarRingClass: 'border-cyan-400/35 bg-cyan-400/10 text-cyan-200',
    spotlightColor: 'rgba(34, 211, 238, 0.14)',
  },
  Backend: {
    barClass: 'bg-fuchsia-400',
    dotClass: 'bg-fuchsia-400',
    badgeClass: 'border-fuchsia-400/35 bg-fuchsia-400/10 text-fuchsia-200',
    avatarRingClass: 'border-fuchsia-400/35 bg-fuchsia-400/10 text-fuchsia-200',
    spotlightColor: 'rgba(232, 121, 249, 0.14)',
  },
  FullStack: {
    barClass: 'bg-emerald-400',
    dotClass: 'bg-emerald-400',
    badgeClass: 'border-emerald-400/35 bg-emerald-400/10 text-emerald-200',
    avatarRingClass: 'border-emerald-400/35 bg-emerald-400/10 text-emerald-200',
    spotlightColor: 'rgba(52, 211, 153, 0.14)',
  },
  'UX & UI': {
    barClass: 'bg-pink-400',
    dotClass: 'bg-pink-400',
    badgeClass: 'border-pink-400/35 bg-pink-400/10 text-pink-200',
    avatarRingClass: 'border-pink-400/35 bg-pink-400/10 text-pink-200',
    spotlightColor: 'rgba(244, 114, 182, 0.14)',
  },
  DevOps: {
    barClass: 'bg-violet-400',
    dotClass: 'bg-violet-400',
    badgeClass: 'border-violet-400/35 bg-violet-400/10 text-violet-200',
    avatarRingClass: 'border-violet-400/35 bg-violet-400/10 text-violet-200',
    spotlightColor: 'rgba(167, 139, 250, 0.14)',
  },
  'Scrum Master': {
    barClass: 'bg-teal-300',
    dotClass: 'bg-teal-300',
    badgeClass: 'border-teal-300/35 bg-teal-300/10 text-teal-200',
    avatarRingClass: 'border-teal-300/35 bg-teal-300/10 text-teal-200',
    spotlightColor: 'rgba(94, 234, 212, 0.14)',
  },
  Otros: {
    barClass: 'bg-slate-400',
    dotClass: 'bg-slate-400',
    badgeClass: 'border-white/20 bg-white/[0.06] text-white/80',
    avatarRingClass: 'border-white/20 bg-white/[0.06] text-white/80',
    spotlightColor: 'rgba(148, 163, 184, 0.12)',
  },
};

const ROLE_PRIORITY_ORDER: ContributorRoleGroup[] = [
  'Software Architecture',
  'UX & UI',
  'Frontend',
  'Backend',
  'FullStack',
  'DevOps',
  'Scrum Master',
  'Otros',
];

const getPrimaryRoleGroup = (roleGroups: ContributorRoleGroup[]): ContributorRoleGroup => {
  for (const priorityRole of ROLE_PRIORITY_ORDER) {
    if (roleGroups.includes(priorityRole)) {
      return priorityRole;
    }
  }
  return roleGroups[0] ?? 'Otros';
};

const getVersionPillStyle = (version: string, index: number) => {
  const normalizedVersion = normalize(version);
  if (normalizedVersion === 'v2.0' || index === 0) {
    return {
      pillClass: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200',
      dotClass: 'bg-cyan-400',
      cohortSubtitle: 'Generación Actual & Consolidación',
    };
  }
  if (normalizedVersion === 'v1.0' || index === 1) {
    return {
      pillClass: 'border-fuchsia-400/30 bg-fuchsia-400/10 text-fuchsia-200',
      dotClass: 'bg-fuchsia-400',
      cohortSubtitle: 'Generación Fundacional',
    };
  }
  return {
    pillClass: 'border-amber-300/30 bg-amber-300/10 text-amber-200',
    dotClass: 'bg-amber-300',
    cohortSubtitle: `Generación ${version}`,
  };
};

interface ContributorAvatarProps {
  contributor: ContributorSummary;
  size?: 'md' | 'lg';
}

function ContributorAvatar({ contributor, size = 'md' }: ContributorAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const primaryRole = getPrimaryRoleGroup(contributor.roleGroups);
  const meta = ROLE_VISUAL_META[primaryRole];

  const dimensions =
    size === 'lg'
      ? 'h-14 w-14 rounded-2xl text-sm'
      : 'h-11 w-11 rounded-xl text-xs';

  return (
    <div
      className={`relative shrink-0 overflow-hidden border font-mono font-bold tracking-wider flex items-center justify-center transition-transform duration-300 group-hover:scale-[1.03] ${dimensions} ${meta.avatarRingClass}`}
    >
      <span>{contributor.initials}</span>
      {contributor.avatarUrl && !imageError && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={contributor.avatarUrl}
          alt={contributor.fullName}
          loading="lazy"
          onError={() => setImageError(true)}
          className="absolute inset-0 h-full w-full object-cover grayscale-[25%] contrast-[1.04] transition-all duration-300 group-hover:grayscale-0"
        />
      )}
    </div>
  );
}

interface ContributorCardItemProps {
  developer: ContributorSummary;
  versionValues: string[];
  highlightedRole: ContributorRoleGroup | null;
  onSelect: (developer: ContributorSummary) => void;
  reducedMotion: boolean;
}

function ContributorCardItem({
  developer,
  versionValues,
  highlightedRole,
  onSelect,
  reducedMotion,
}: ContributorCardItemProps) {
  const cardRef = useRef<HTMLElement>(null);
  const primaryRole = getPrimaryRoleGroup(developer.roleGroups);
  const meta = ROLE_VISUAL_META[primaryRole];

  const isDimmedBySynergy =
    highlightedRole !== null && !developer.roleGroups.includes(highlightedRole);
  const isHighlightedBySynergy =
    highlightedRole !== null && developer.roleGroups.includes(highlightedRole);

  const handleMouseMove = useCallback((event: ReactMouseEvent<HTMLElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    el.style.setProperty('--mouse-x', `${x}px`);
    el.style.setProperty('--mouse-y', `${y}px`);
  }, []);

  return (
    <motion.article
      ref={cardRef}
      layout={!reducedMotion ? 'position' : false}
      initial={reducedMotion ? false : { opacity: 0, y: 14 }}
      animate={{
        opacity: isDimmedBySynergy ? 0.38 : 1,
        y: 0,
        scale: isHighlightedBySynergy && !reducedMotion ? 1.012 : 1,
      }}
      exit={reducedMotion ? undefined : { opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      onMouseMove={handleMouseMove}
      onClick={() => onSelect(developer)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect(developer);
        }
      }}
      aria-label={`Ver ficha técnica de ${developer.fullName}`}
      style={
        {
          '--spotlight-color': meta.spotlightColor,
        } as React.CSSProperties
      }
      className={`group relative rounded-2xl border p-5 flex flex-col justify-between gap-4 overflow-hidden cursor-pointer text-left transition-colors duration-200 backdrop-blur-xl ${
        isHighlightedBySynergy
          ? 'border-cyan-400/45 bg-[#151828]/90 shadow-[0_0_28px_-6px_rgba(34,211,238,0.25)]'
          : 'border-white/[0.08] bg-[#111320]/75 hover:border-white/[0.2] hover:bg-[#16192b]/85 shadow-[0_8px_28px_-10px_rgba(0,0,0,0.55)]'
      }`}
    >
      {/* Cursor-tracked radial spotlight */}
      <div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background:
            'radial-gradient(360px circle at var(--mouse-x, 50%) var(--mouse-y, 0%), var(--spotlight-color), transparent 70%)',
        }}
      />

      {/* Subtle top hairline accent on hover */}
      <div
        className="pointer-events-none absolute top-0 left-5 right-5 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background:
            'linear-gradient(90deg, transparent, oklch(0.75 0.15 195 / 0.7), oklch(0.82 0.18 330 / 0.7), transparent)',
        }}
      />

      {/* Card Header: Avatar + Name / GitHub Handle + Version Badges */}
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3.5 min-w-0">
          <ContributorAvatar contributor={developer} size="md" />

          <div className="min-w-0">
            <h3
              className="text-base font-semibold text-white leading-snug truncate group-hover:text-cyan-200 transition-colors"
              title={developer.fullName}
            >
              {developer.fullName}
            </h3>

            {developer.github ? (
              <a
                href={developer.github}
                target="_blank"
                rel="noreferrer"
                onClick={(event) => event.stopPropagation()}
                className="mt-0.5 inline-flex items-center gap-1.5 font-mono text-xs text-white/50 hover:text-cyan-300 transition-colors max-w-full"
                aria-label={`GitHub de ${developer.fullName}`}
              >
                <Github className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  @{developer.githubHandle || 'github'}
                </span>
                <ArrowUpRight className="h-3 w-3 shrink-0 opacity-60 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            ) : (
              <span
                className="mt-0.5 inline-flex items-center gap-1.5 font-mono text-xs text-white/35"
                aria-label="GitHub pendiente"
              >
                <Github className="h-3.5 w-3.5 shrink-0" />
                <span>GitHub pendiente</span>
              </span>
            )}
          </div>
        </div>

        {/* Version Badges */}
        <div className="flex flex-wrap items-center justify-end gap-1 shrink-0">
          {developer.versions.map((version) => {
            const versionIndex = versionValues.findIndex(
              (val) => normalize(val) === normalize(version),
            );
            const vStyle = getVersionPillStyle(
              version,
              versionIndex >= 0 ? versionIndex : 0,
            );
            return (
              <span
                key={`${developer.fullName}-${version}`}
                className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-xs font-medium ${vStyle.pillClass}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${vStyle.dotClass}`} />
                {version}
              </span>
            );
          })}
        </div>
      </div>

      {/* Card Footer: Structured Role Badges + Inspector Affordance */}
      <div className="relative z-10 pt-3 border-t border-white/[0.06] flex items-end justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {developer.roleLabels.map((roleLabel) => {
            const isLead = isLeadershipRoleLabel(roleLabel);
            return (
              <span
                key={`${developer.fullName}-${roleLabel}`}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${
                  isLead
                    ? 'border-amber-300/30 bg-amber-300/[0.08] text-amber-200'
                    : 'border-white/[0.08] bg-white/[0.03] text-white/75'
                }`}
              >
                {isLead && (
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-300 shrink-0" />
                )}
                <span>{roleLabel}</span>
              </span>
            );
          })}
        </div>

        <span className="shrink-0 font-mono text-xs text-white/35 group-hover:text-cyan-300 transition-colors inline-flex items-center gap-1">
          <span className="hidden sm:inline">Ficha</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </motion.article>
  );
}

export function Developers() {
  const [versionFilter, setVersionFilter] = useState<string>('Todas');
  const [roleFilter, setRoleFilter] = useState<ContributorRoleGroup | 'Todos'>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewLayout, setViewLayout] = useState<'cohorts' | 'grid'>('cohorts');
  const [hoveredRole, setHoveredRole] = useState<ContributorRoleGroup | null>(null);
  const [selectedDeveloper, setSelectedDeveloper] = useState<ContributorSummary | null>(
    null,
  );

  const searchInputRef = useRef<HTMLInputElement>(null);
  const prefersReducedMotion = Boolean(useReducedMotion());

  const summarizedContributors = useMemo(
    () => summarizeContributors(contributors),
    [],
  );

  const versions = useMemo(() => getVersionFilters(contributors), []);

  const versionValues = useMemo<string[]>(
    () => versions.filter((version) => version !== 'Todas'),
    [versions],
  );

  const totalVersions = versionValues.length;
  const totalContributors = summarizedContributors.length;
  const totalDistinctRoles = useMemo(
    () => countDistinctRoleGroups(summarizedContributors),
    [summarizedContributors],
  );

  const latestVersion = useMemo(() => {
    if (versionValues.length === 0) return null;
    return versionValues.reduce((latest, current) =>
      compareVersions(current, latest) > 0 ? current : latest,
    );
  }, [versionValues]);

  const contributorsByVersionFilter = useMemo(
    () => getContributorsByVersion(summarizedContributors, versionFilter),
    [summarizedContributors, versionFilter],
  );

  const totalContributorsBySelectedVersion = contributorsByVersionFilter.length;

  const roleStats = useMemo(
    () => buildRoleStats(contributorsByVersionFilter),
    [contributorsByVersionFilter],
  );

  const activeRoleGroups = useMemo(() => {
    return ROLE_PRIORITY_ORDER.filter((role) => (roleStats[role] ?? 0) > 0);
  }, [roleStats]);

  const roles = useMemo(() => {
    return ['Todos', ...activeRoleGroups] as Array<'Todos' | ContributorRoleGroup>;
  }, [activeRoleGroups]);

  const filtered = useMemo(
    () =>
      filterContributors(
        summarizedContributors,
        versionFilter,
        roleFilter,
        searchQuery,
      ),
    [summarizedContributors, versionFilter, roleFilter, searchQuery],
  );

  // Group filtered contributors by version cohort when "Todas" + "cohorts" mode is active
  const cohorts = useMemo(() => {
    return versionValues
      .map((version, index) => {
        const members = filtered.filter((dev) =>
          dev.versions.some((v) => normalize(v) === normalize(version)),
        );
        return {
          version,
          style: getVersionPillStyle(version, index),
          members,
        };
      })
      .filter((cohort) => cohort.members.length > 0);
  }, [filtered, versionValues]);

  // Total role assignments for proportional synergy bar
  const totalRoleAssignments = useMemo(() => {
    return activeRoleGroups.reduce((sum, role) => sum + (roleStats[role] ?? 0), 0);
  }, [activeRoleGroups, roleStats]);

  const relatedToSelected = useMemo(() => {
    if (!selectedDeveloper) return { sameDiscipline: [], sameGeneration: [] };
    return getRelatedCollaborators(selectedDeveloper, summarizedContributors);
  }, [selectedDeveloper, summarizedContributors]);

  // Keyboard shortcuts: '/' to focus search, 'Escape' to close inspector drawer
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedDeveloper) {
        setSelectedDeveloper(null);
        return;
      }
      if (
        event.key === '/' &&
        !selectedDeveloper &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDeveloper]);

  const resetFilters = () => {
    setVersionFilter('Todas');
    setRoleFilter('Todos');
    setSearchQuery('');
  };

  return (
    <section
      id="contributors-section"
      className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 md:py-14 space-y-8 relative z-10"
    >
      {/* 1. EDITORIAL HERO & ARCHITECTURAL TELEMETRY PANEL */}
      <header className="relative border-b border-white/[0.08] pb-8 md:pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
          {/* Left Narrative Column */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs text-white/75 border border-white/10 bg-white/[0.03] backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="font-mono uppercase tracking-wider">
                Contribuidores IRIS · Uninorte
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-[3.25rem] font-black tracking-tight leading-[1.08] text-white">
              <span style={prismaticTitleStyle}>IRIS</span> — Equipo de Desarrollo
            </h1>

            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
              Detrás de IRIS hay un equipo que crea, conecta y construye, llevando cada
              detalle desde la idea inicial hasta una experiencia pensada para dar
              sentido y orden a cada evento.{' '}
              <strong className="text-white/90 font-medium">
                Conoce a quienes hacen posible esta experiencia.
              </strong>
            </p>
          </div>

          {/* Right Telemetry & Interactive Discipline Synergy Bar */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-white/[0.08] bg-[#111320]/80 p-4 sm:p-5 backdrop-blur-xl shadow-[0_12px_36px_-12px_rgba(0,0,0,0.6)] space-y-4">
              {/* 4 Core Metrics Preserved in Clean Specification Strip */}
              <div className="grid grid-cols-4 gap-2 sm:gap-3 text-left">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-white/50">
                    <Users className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                    <span className="truncate">Contribuidores</span>
                  </div>
                  <p className="mt-1 font-mono text-xl sm:text-2xl font-bold text-white">
                    {totalContributors}
                  </p>
                </div>

                <div className="border-l border-white/[0.07] pl-2.5 sm:pl-3">
                  <div className="flex items-center gap-1.5 text-xs text-white/50">
                    <Layers3 className="h-3.5 w-3.5 text-fuchsia-400 shrink-0" />
                    <span className="truncate">Versiones</span>
                  </div>
                  <p className="mt-1 font-mono text-xl sm:text-2xl font-bold text-white">
                    {totalVersions}
                  </p>
                </div>

                <div className="border-l border-white/[0.07] pl-2.5 sm:pl-3">
                  <div className="flex items-center gap-1.5 text-xs text-white/50">
                    <Sparkles className="h-3.5 w-3.5 text-amber-300 shrink-0" />
                    <span className="truncate">Roles activos</span>
                  </div>
                  <p className="mt-1 font-mono text-xl sm:text-2xl font-bold text-white">
                    {totalDistinctRoles}
                  </p>
                </div>

                <div className="border-l border-white/[0.07] pl-2.5 sm:pl-3">
                  <div className="flex items-center gap-1.5 text-xs text-white/50">
                    <Code2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">Última versión</span>
                  </div>
                  <p className="mt-1 font-mono text-xl sm:text-2xl font-bold text-cyan-300">
                    {latestVersion ?? 'N/A'}
                  </p>
                </div>
              </div>

              {/* Interactive Discipline Distribution Bar */}
              {totalRoleAssignments > 0 && (
                <div className="pt-3 border-t border-white/[0.07] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono uppercase tracking-wider text-white/45">
                      Distribución por área ({versionFilter})
                    </span>
                    <span className="font-mono text-xs text-cyan-300/90">
                      {hoveredRole
                        ? `${hoveredRole}: ${roleStats[hoveredRole]} integrantes`
                        : 'Pasa el cursor para resaltar'}
                    </span>
                  </div>

                  <div
                    className="flex h-2 w-full overflow-hidden rounded-full bg-white/[0.05] p-0.5 gap-1"
                    onMouseLeave={() => setHoveredRole(null)}
                  >
                    {activeRoleGroups.map((roleGroup) => {
                      const count = roleStats[roleGroup] ?? 0;
                      const widthPercent = Math.max(
                        6,
                        Math.round((count / totalRoleAssignments) * 100),
                      );
                      const meta = ROLE_VISUAL_META[roleGroup];
                      const isSelected =
                        roleFilter === roleGroup || hoveredRole === roleGroup;

                      return (
                        <button
                          key={`dist-${roleGroup}`}
                          type="button"
                          onMouseEnter={() => setHoveredRole(roleGroup)}
                          onFocus={() => setHoveredRole(roleGroup)}
                          onBlur={() => setHoveredRole(null)}
                          onClick={() =>
                            setRoleFilter((prev) =>
                              prev === roleGroup ? 'Todos' : roleGroup,
                            )
                          }
                          style={{ width: `${widthPercent}%` }}
                          title={`${roleGroup}: ${count}`}
                          aria-label={`Filtrar o resaltar área ${roleGroup} (${count})`}
                          className={`h-full rounded-full transition-all duration-200 cursor-pointer ${
                            meta.barClass
                          } ${
                            hoveredRole && !isSelected
                              ? 'opacity-30'
                              : 'opacity-90 hover:opacity-100'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 2. UNIFIED COMMAND & FILTER TOOLBAR */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#10121e]/85 p-4 md:p-5 backdrop-blur-xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          {/* Version Segmented Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-wider text-white/45 mr-1">
              Versión:
            </span>
            <div className="inline-flex flex-wrap items-center rounded-xl border border-white/[0.08] bg-black/30 p-1 gap-1">
              {versions.map((version) => {
                const isActive = versionFilter === version;
                const versionCount =
                  version === 'Todas'
                    ? totalContributors
                    : getContributorsByVersion(summarizedContributors, version).length;

                return (
                  <button
                    key={version}
                    type="button"
                    onClick={() => setVersionFilter(version)}
                    className={`relative cursor-pointer px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      isActive
                        ? 'text-[#0c0d14] font-semibold'
                        : 'text-white/65 hover:text-white'
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="iris-contributors-version-pill"
                        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                        className="absolute inset-0 rounded-lg bg-cyan-400 shadow-[0_0_18px_rgba(34,211,238,0.35)]"
                      />
                    )}
                    <span className="relative z-10">{version}</span>
                    <span
                      className={`relative z-10 font-mono text-xs ${
                        isActive ? 'text-black/70' : 'text-white/40'
                      }`}
                    >
                      ({versionCount})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search Input + View Switcher + Live Counter */}
          <div className="flex flex-wrap items-center gap-3 flex-1 lg:max-w-xl justify-end">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Buscar por nombre, rol o @github..."
                aria-label="Buscar contribuidores"
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] pl-9 pr-8 py-1.5 text-xs sm:text-sm text-white placeholder:text-white/35 focus:border-cyan-400/50 focus:bg-white/[0.05] focus:outline-none transition-colors"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Limpiar búsqueda"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/45 hover:text-white cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : (
                <kbd className="pointer-events-none hidden sm:inline-flex absolute right-2.5 top-1/2 -translate-y-1/2 items-center rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-xs text-white/35">
                  /
                </kbd>
              )}
            </div>

            {/* Layout Mode Switcher (Cohorts vs Continuous Grid) */}
            {versionFilter === 'Todas' && (
              <div
                className="inline-flex items-center rounded-xl border border-white/[0.08] bg-black/30 p-1"
                role="group"
                aria-label="Modo de visualización"
              >
                <button
                  type="button"
                  onClick={() => setViewLayout('cohorts')}
                  title="Agrupar por generación (v2.0 / v1.0)"
                  className={`cursor-pointer inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                    viewLayout === 'cohorts'
                      ? 'bg-white/12 text-white'
                      : 'text-white/50 hover:text-white/85'
                  }`}
                >
                  <Rows3 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Generaciones</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewLayout('grid')}
                  title="Cuadrícula continua"
                  className={`cursor-pointer inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                    viewLayout === 'grid'
                      ? 'bg-white/12 text-white'
                      : 'text-white/50 hover:text-white/85'
                  }`}
                >
                  <Grid2x2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Continuo</span>
                </button>
              </div>
            )}

            <span className="text-xs sm:text-sm text-muted-foreground shrink-0">
              Mostrando:{' '}
              <span className="font-mono font-semibold text-cyan-300">
                {filtered.length}
              </span>{' '}
              contribuidores
            </span>
          </div>
        </div>

        {/* Role / Discipline Filter Pills */}
        <div className="pt-3 border-t border-white/[0.06] flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs uppercase tracking-wider text-white/45 mr-1">
            Roles:
          </span>
          {roles.map((role) => {
            const isActive = roleFilter === role;
            const count =
              role !== 'Todos'
                ? (roleStats[role as ContributorRoleGroup] ?? 0)
                : totalContributorsBySelectedVersion;
            const dotClass =
              role !== 'Todos'
                ? ROLE_VISUAL_META[role as ContributorRoleGroup].dotClass
                : 'bg-cyan-400';

            return (
              <button
                key={role}
                type="button"
                onClick={() => setRoleFilter(role)}
                onMouseEnter={() =>
                  setHoveredRole(role === 'Todos' ? null : (role as ContributorRoleGroup))
                }
                onMouseLeave={() => setHoveredRole(null)}
                className={`relative cursor-pointer px-3 py-1.5 rounded-xl text-xs sm:text-sm border transition-all inline-flex items-center gap-1.5 ${
                  isActive
                    ? 'border-cyan-400/50 bg-cyan-400/15 text-cyan-200 font-medium shadow-[0_0_16px_-4px_rgba(34,211,238,0.3)]'
                    : 'border-white/[0.08] bg-white/[0.02] text-muted-foreground hover:text-foreground hover:border-white/20'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
                <span>
                  {role} ({count})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. CONTRIBUTORS DIRECTORY (GROUPED COHORTS OR UNIFIED GRID) */}
      <LayoutGroup>
        <div id="contributors-grid" className="space-y-10">
          {filtered.length === 0 ? (
            <article className="rounded-2xl border border-white/[0.08] bg-[#111320]/60 p-10 text-center space-y-3">
              <p className="text-base font-medium text-white/85">
                No hay contribuidores para los filtros seleccionados.
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Prueba limpiando el texto de búsqueda o restableciendo los filtros de versión y rol.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-2 inline-flex items-center rounded-xl bg-cyan-400 px-4 py-2 text-xs font-semibold text-[#0c0d14] hover:brightness-110 transition-all cursor-pointer"
              >
                Restablecer filtros
              </button>
            </article>
          ) : versionFilter === 'Todas' && viewLayout === 'cohorts' ? (
            cohorts.map((cohort) => (
              <section
                key={`cohort-${cohort.version}`}
                aria-label={`Versión ${cohort.version}`}
                className="space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono text-xs font-semibold ${cohort.style.pillClass}`}
                    >
                      <span className={`h-2 w-2 rounded-full ${cohort.style.dotClass}`} />
                      {cohort.version}
                    </span>
                    <h2 className="text-base sm:text-lg font-bold text-white">
                      {cohort.style.cohortSubtitle}
                    </h2>
                  </div>
                  <span className="font-mono text-xs text-white/45">
                    {cohort.members.length}{' '}
                    {cohort.members.length === 1 ? 'integrante' : 'integrantes'}
                  </span>
                </div>

                <motion.div
                  layout={!prefersReducedMotion}
                  className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                >
                  <AnimatePresence mode="popLayout">
                    {cohort.members.map((developer) => (
                      <ContributorCardItem
                        key={`${cohort.version}-${developer.fullName}`}
                        developer={developer}
                        versionValues={versionValues}
                        highlightedRole={hoveredRole}
                        onSelect={setSelectedDeveloper}
                        reducedMotion={prefersReducedMotion}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
              </section>
            ))
          ) : (
            <motion.div
              layout={!prefersReducedMotion}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
            >
              <AnimatePresence mode="popLayout">
                {filtered.map((developer) => (
                  <ContributorCardItem
                    key={developer.fullName}
                    developer={developer}
                    versionValues={versionValues}
                    highlightedRole={hoveredRole}
                    onSelect={setSelectedDeveloper}
                    reducedMotion={prefersReducedMotion}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </LayoutGroup>

      {/* 4. INTERACTIVE COHORT & TRAJECTORY INSPECTOR (SLIDE-OVER FICHA TÉCNICA) */}
      <AnimatePresence>
        {selectedDeveloper && (
          <div
            className="fixed inset-0 z-50 flex justify-end"
            role="dialog"
            aria-modal="true"
            aria-labelledby="contributor-inspector-title"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSelectedDeveloper(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Slide-Over Panel */}
            <motion.aside
              initial={prefersReducedMotion ? { opacity: 0 } : { x: '100%' }}
              animate={prefersReducedMotion ? { opacity: 1 } : { x: 0 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { x: '100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 34 }}
              className="relative z-10 w-full max-w-md h-full overflow-y-auto border-l border-white/12 bg-[#0e101b]/95 p-6 sm:p-7 backdrop-blur-2xl shadow-2xl flex flex-col justify-between gap-6"
            >
              <div className="space-y-6">
                {/* Drawer Top Bar */}
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                  <span className="font-mono text-xs uppercase tracking-wider text-cyan-300">
                    Ficha de Contribuidor · IRIS
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedDeveloper(null)}
                    aria-label="Cerrar ficha de contribuidor"
                    className="rounded-lg border border-white/10 bg-white/[0.04] p-1.5 text-white/65 hover:text-white hover:border-white/25 transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Identity Header */}
                <div className="flex items-start gap-4">
                  <ContributorAvatar contributor={selectedDeveloper} size="lg" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <h2
                      id="contributor-inspector-title"
                      className="text-xl font-bold text-white leading-snug"
                    >
                      {selectedDeveloper.fullName}
                    </h2>

                    <div className="flex flex-wrap items-center gap-2">
                      {selectedDeveloper.roleGroups.map((group) => (
                        <span
                          key={`inspector-group-${group}`}
                          className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-xs ${ROLE_VISUAL_META[group].badgeClass}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${ROLE_VISUAL_META[group].dotClass}`}
                          />
                          {group}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Direct GitHub CTA */}
                {selectedDeveloper.github && (
                  <a
                    href={selectedDeveloper.github}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white hover:border-cyan-400/45 hover:bg-cyan-400/[0.08] transition-all"
                  >
                    <span className="inline-flex items-center gap-2.5">
                      <Github className="h-4 w-4 text-cyan-300" />
                      <span className="font-mono">
                        github.com/{selectedDeveloper.githubHandle}
                      </span>
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-cyan-300" />
                  </a>
                )}

                {/* Version History Timeline */}
                <div className="space-y-3">
                  <h3 className="font-mono text-xs uppercase tracking-wider text-white/50">
                    Trayectoria por versión ({selectedDeveloper.versionHistory.length})
                  </h3>
                  <div className="space-y-2.5">
                    {selectedDeveloper.versionHistory.map((entry, idx) => {
                      const vStyle = getVersionPillStyle(entry.version, idx);
                      return (
                        <div
                          key={`history-${entry.version}`}
                          className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3.5 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-xs font-semibold ${vStyle.pillClass}`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${vStyle.dotClass}`}
                              />
                              {entry.version}
                            </span>
                            <span className="text-xs text-white/45">
                              {vStyle.cohortSubtitle}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {entry.roleLabels.map((label) => (
                              <span
                                key={`hist-role-${entry.version}-${label}`}
                                className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-white/85"
                              >
                                {label}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Same-Discipline Collaborators */}
                {relatedToSelected.sameDiscipline.length > 0 && (
                  <div className="space-y-2.5">
                    <h3 className="font-mono text-xs uppercase tracking-wider text-white/50">
                      Compañeros en su misma área
                    </h3>
                    <div className="grid grid-cols-1 gap-2">
                      {relatedToSelected.sameDiscipline.map((peer) => (
                        <button
                          key={`peer-${peer.fullName}`}
                          type="button"
                          onClick={() => setSelectedDeveloper(peer)}
                          className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2 text-left hover:border-cyan-400/35 hover:bg-white/[0.05] transition-all cursor-pointer"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-white truncate">
                              {peer.fullName}
                            </p>
                            <p className="text-xs text-white/45 truncate">
                              {peer.roleLabels.join(' · ')}
                            </p>
                          </div>
                          <span className="ml-2 shrink-0 font-mono text-xs text-cyan-300">
                            {peer.versions.join(', ')}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Drawer Footer */}
              <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs text-white/45">
                <span>Presiona ESC para cerrar</span>
                <button
                  type="button"
                  onClick={() => {
                    const primaryGroup = getPrimaryRoleGroup(
                      selectedDeveloper.roleGroups,
                    );
                    setRoleFilter(primaryGroup);
                    setSelectedDeveloper(null);
                  }}
                  className="font-mono text-cyan-300 hover:underline cursor-pointer"
                >
                  Filtrar área {getPrimaryRoleGroup(selectedDeveloper.roleGroups)} →
                </button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}

