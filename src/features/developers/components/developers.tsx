// Component responsible for displaying the developers that have made IRIS possible.
'use client';

import { useMemo, useState } from 'react';
import {
  ContributorRoleGroup,
  contributors,
} from '@/features/developers/data/contributors';
// Utility functions for handling contributor data and filtering
import { Code2, Github, Layers3, Sparkles, Users } from 'lucide-react';
import {
  buildRoleStats,
  compareVersions,
  countDistinctRoleGroups,
  filterContributors,
  getContributorsByVersion,
  getVersionFilters,
  summarizeContributors,
} from '@/features/developers/lib/contributor-utils';

const normalize = (value: string) => value.trim().toLowerCase();
// Color palette for version accents
const versionAccentPalette = [
  { dotClass: 'bg-cyan-400', textClass: 'text-cyan-300' },
  { dotClass: 'bg-emerald-400', textClass: 'text-emerald-300' },
  { dotClass: 'bg-fuchsia-400', textClass: 'text-fuchsia-300' },
  { dotClass: 'bg-amber-300', textClass: 'text-amber-300' },
  { dotClass: 'bg-violet-300', textClass: 'text-violet-300' },
];

const rainbowTextStyle = {
  backgroundImage:
    'linear-gradient(90deg, oklch(0.75 0.15 195), oklch(0.82 0.18 330), oklch(0.88 0.16 85), oklch(0.75 0.15 195))',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
};

const rainbowBorderStyle = {
  background:
    'linear-gradient(var(--background), var(--background)) padding-box, linear-gradient(135deg, oklch(0.75 0.15 195), oklch(0.82 0.18 330), oklch(0.88 0.16 85), oklch(0.75 0.15 195)) border-box',
  border: '1px solid transparent',
};

const rainbowOutlineStyle = {
  background:
    'linear-gradient(135deg, oklch(0.75 0.15 195), oklch(0.82 0.18 330), oklch(0.88 0.16 85), oklch(0.75 0.15 195))',
  WebkitMask:
    'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
  WebkitMaskComposite: 'xor',
  maskComposite: 'exclude',
};

export function Developers() {
  const [versionFilter, setVersionFilter] = useState<string>('Todas');
  const [roleFilter, setRoleFilter] = useState<ContributorRoleGroup | 'Todos'>('Todos');

  const summarizedContributors = useMemo(
    () => summarizeContributors(contributors),
    []
  );

  const versions = useMemo(() => getVersionFilters(contributors), []);

  const versionValues = useMemo<string[]>(
    () => versions.filter((version) => version !== 'Todas'),
    [versions]
  );

  const getVersionAccent = (version: string) => {
    const versionIndex = versionValues.findIndex((value) => normalize(value) === normalize(version));
    const safeIndex = versionIndex >= 0 ? versionIndex : 0;
    return versionAccentPalette[safeIndex % versionAccentPalette.length];
  };

  const totalVersions = versionValues.length;
  const totalContributors = summarizedContributors.length;
  const totalDistinctRoles = useMemo(
    () => countDistinctRoleGroups(summarizedContributors),
    [summarizedContributors]
  );

  const latestVersion = useMemo(() => {
    if (versionValues.length === 0) return null;
    return versionValues.reduce((latest, current) =>
      compareVersions(current, latest) > 0 ? current : latest
    );
  }, [versionValues]);

  const contributorsByVersionFilter = useMemo(
    () => getContributorsByVersion(summarizedContributors, versionFilter),
    [summarizedContributors, versionFilter]
  );

  const totalContributorsBySelectedVersion = contributorsByVersionFilter.length;

  const roleStats = useMemo(
    () => buildRoleStats(contributorsByVersionFilter),
    [contributorsByVersionFilter]
  );

  const roles = useMemo(() => {
    const roleList = (Object.keys(roleStats) as ContributorRoleGroup[]).filter(
      (role) => roleStats[role] > 0
    );
    return ['Todos', ...roleList] as Array<'Todos' | ContributorRoleGroup>;
  }, [roleStats]);

  const filtered = useMemo(
    () => filterContributors(summarizedContributors, versionFilter, roleFilter),
    [summarizedContributors, versionFilter, roleFilter]
  );

  return (
    <section id="contributors-section" className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-6 relative z-10">
      <div
        className="rounded-[1.5rem] p-[1px] overflow-hidden shadow-[0_0_45px_oklch(0.82_0.18_330_/_0.12)]"
        style={rainbowBorderStyle}
      >
        <header className="rounded-[1.45rem] bg-transparent p-6 md:p-8">
          <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs text-muted-foreground border border-white/15 bg-transparent mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span>Contribuidores IRIS</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
            <span style={rainbowTextStyle}>IRIS</span> — Equipo de Desarrollo
          </h1>

          <p className="mt-3 text-muted-foreground max-w-3xl">
            Detrás de IRIS hay un equipo que crea, conecta y construye, llevando cada detalle desde la idea inicial hasta una experiencia pensada para dar sentido y orden a cada evento.
<b> Conoce a quienes hacen posible esta experiencia.</b>
          </p>
        </header>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div
          className="rounded-[1.5rem] p-[1px] overflow-hidden"
          style={rainbowBorderStyle}
        >
          <article className="rounded-[1.45rem] bg-transparent p-4 text-center h-full">
            <Users className="h-5 w-5 mx-auto text-primary mb-2" />
            <p className="text-2xl md:text-3xl font-bold" style={rainbowTextStyle}>{totalContributors}</p>
            <p className="text-sm text-muted-foreground">Contribuidores</p>
          </article>
        </div>
        <div
          className="rounded-[1.5rem] p-[1px] overflow-hidden"
          style={rainbowBorderStyle}
        >
          <article className="rounded-[1.45rem] bg-transparent p-4 text-center h-full">
            <Layers3 className="h-5 w-5 mx-auto text-primary mb-2" />
            <p className="text-2xl md:text-3xl font-bold" style={rainbowTextStyle}>{totalVersions}</p>
            <p className="text-sm text-muted-foreground">Versiones</p>
          </article>
        </div>
        <div
          className="rounded-[1.5rem] p-[1px] overflow-hidden"
          style={rainbowBorderStyle}
        >
          <article className="rounded-[1.45rem] bg-transparent p-4 text-center h-full">
            <Sparkles className="h-5 w-5 mx-auto text-primary mb-2" />
            <p className="text-2xl md:text-3xl font-bold" style={rainbowTextStyle}>{totalDistinctRoles}</p>
            <p className="text-sm text-muted-foreground">Roles activos</p>
          </article>
        </div>
        <div
          className="rounded-[1.5rem] p-[1px] overflow-hidden"
          style={rainbowBorderStyle}
        >
          <article className="rounded-[1.45rem] bg-transparent p-4 text-center h-full">
            <Code2 className="h-5 w-5 mx-auto text-primary mb-2" />
            <p className="text-2xl md:text-3xl font-bold" style={rainbowTextStyle}>{latestVersion ?? 'N/A'}</p>
            <p className="text-sm text-muted-foreground">Última versión</p>
          </article>
        </div>
      </div>

      <div
        className="rounded-[1.5rem] p-[1px] overflow-hidden"
        style={rainbowBorderStyle}
      >
        <div className="rounded-[1.45rem] bg-transparent p-4 md:p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
            <span className="text-sm text-muted-foreground md:ml-auto md:order-2">
              Mostrando: <span className="font-semibold" style={rainbowTextStyle}>{filtered.length}</span> contribuidores
            </span>

            <div className="flex flex-wrap items-center gap-2 md:order-1">
              <span className="text-sm text-muted-foreground mr-2">Versión:</span>
            {versions.map((version) => (
              <button
                key={version}
                type="button"
                onClick={() => setVersionFilter(version)}
                className={`cursor-pointer px-3 py-1.5 rounded-lg text-sm border transition-all ${
                  versionFilter === version
                    ? 'text-black border-transparent shadow-[0_0_22px_oklch(0.82_0.18_330_/_0.45)]'
                    : 'bg-transparent text-muted-foreground border-border hover:text-foreground hover:border-primary/40'
                }`}
                style={
                  versionFilter === version
                    ? {
                        background:
                          'linear-gradient(135deg, oklch(0.75 0.15 195), oklch(0.82 0.18 330), oklch(0.88 0.16 85))',
                      }
                    : undefined
                }
              >
                {version}
              </button>
            ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground mr-2">Roles:</span>
            {roles.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setRoleFilter(role)}
                className={`cursor-pointer px-3 py-1.5 rounded-lg text-sm border transition-all ${
                  roleFilter === role
                    ? 'text-black border-transparent shadow-[0_0_22px_oklch(0.82_0.18_330_/_0.45)]'
                    : 'bg-transparent text-muted-foreground border-border hover:text-foreground hover:border-primary/40'
                }`}
                style={
                  roleFilter === role
                    ? {
                        background:
                          'linear-gradient(135deg, oklch(0.75 0.15 195), oklch(0.82 0.18 330), oklch(0.88 0.16 85))',
                      }
                    : undefined
                }
              >
                {role}
                {role !== 'Todos'
                  ? ` (${roleStats[role as ContributorRoleGroup] ?? 0})`
                  : ` (${totalContributorsBySelectedVersion})`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div id="contributors-grid" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((developer) => (
          <div
            key={developer.fullName}
            className="relative rounded-[1.5rem] overflow-hidden transition-all hover:-translate-y-1 hover:shadow-[0_0_26px_oklch(0.82_0.18_330_/_0.35)]"
          >
            <div className="absolute inset-0 rounded-[1.5rem] p-[1.5px] pointer-events-none" style={rainbowOutlineStyle} />
            <article className="relative z-10 rounded-[1.45rem] bg-transparent p-5 h-full text-center flex flex-col items-center">
              <div
                className="h-1 w-full rounded-full mb-4"
                style={{
                  background:
                    'linear-gradient(90deg, oklch(0.75 0.15 195), oklch(0.82 0.18 330), oklch(0.88 0.16 85))',
                }}
              />

              <h3 className="text-lg sm:text-xl font-semibold text-white">{developer.fullName}</h3>
              <div className="mt-3 flex w-full flex-wrap items-center justify-center gap-2">
                <p className="inline-flex min-h-8 max-w-full items-center rounded-full border border-white/45 bg-transparent px-3 text-sm italic text-white justify-center text-center break-words">
                  {developer.roleLabels.join(' • ')}
                </p>

                {developer.github ? (
                  <a
                    href={developer.github}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white transition-opacity hover:opacity-80"
                    aria-label={`GitHub de ${developer.fullName}`}
                  >
                    <Github className="h-4 w-4" />
                  </a>
                ) : (
                  <span
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/45"
                    aria-label="GitHub pendiente"
                  >
                    <Github className="h-4 w-4" />
                  </span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1">
                {developer.versions.map((version) => {
                  const accent = getVersionAccent(version);
                  return (
                    <span
                      key={`${developer.fullName}-${version}`}
                      className={`inline-flex items-center gap-1.5 text-sm ${accent.textClass}`}
                    >
                      <span className={`h-2.5 w-2.5 rounded-sm ${accent.dotClass}`} />
                      {version}
                    </span>
                  );
                })}
              </div>

            </article>
          </div>
        ))}

        {filtered.length === 0 && (
          <article className="rounded-[1.45rem] border border-border/40 bg-background/50 p-8 text-center text-muted-foreground md:col-span-2 xl:col-span-3">
            No hay contribuidores para los filtros seleccionados.
          </article>
        )}
      </div>
    </section>
  );
}
