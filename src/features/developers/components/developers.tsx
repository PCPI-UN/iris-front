'use client';

import { useMemo, useState } from 'react';
import {
  ContributorCard,
  ContributorRoleGroup,
  contributors,
  getContributorRoleGroup,
} from '@/features/developers/data/contributors';
import { Code2, Layers3, Sparkles, Users } from 'lucide-react';

const normalize = (value: string) => value.trim().toLowerCase();

const getVersionParts = (version: string) => {
  const matches = normalize(version).match(/\d+/g);
  return matches ? matches.map(Number) : [0];
};

const compareVersions = (a: string, b: string) => {
  const aParts = getVersionParts(a);
  const bParts = getVersionParts(b);
  const length = Math.max(aParts.length, bParts.length);

  for (let index = 0; index < length; index += 1) {
    const aValue = aParts[index] ?? 0;
    const bValue = bParts[index] ?? 0;

    if (aValue > bValue) return 1;
    if (aValue < bValue) return -1;
  }

  return 0;
};

type ContributorSummary = {
  name: string;
  versions: string[];
  roleGroups: ContributorRoleGroup[];
  roleLabels: string[];
};

const roleStatsInitial: Record<ContributorRoleGroup, number> = {
  Frontend: 0,
  Backend: 0,
  FullStack: 0,
  'UX & UI': 0,
  'Software Architecture': 0,
  DevOps: 0,
  'Scrum Master': 0,
  Otros: 0,
};

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

  const summarizedContributors = useMemo<ContributorSummary[]>(() => {
    const contributorsMap = new Map<
      string,
      {
        name: string;
        versions: Set<string>;
        roleGroups: Set<ContributorRoleGroup>;
        roleLabels: Set<string>;
      }
    >();

    contributors.forEach((contributor: ContributorCard) => {
      const normalizedName = normalize(contributor.name);
      const roleGroup = getContributorRoleGroup(contributor.role);

      if (!contributorsMap.has(normalizedName)) {
        contributorsMap.set(normalizedName, {
          name: contributor.name,
          versions: new Set<string>(),
          roleGroups: new Set<ContributorRoleGroup>(),
          roleLabels: new Set<string>(),
        });
      }

      const summary = contributorsMap.get(normalizedName);
      if (!summary) return;

      summary.versions.add(contributor.version);
      summary.roleGroups.add(roleGroup);
      summary.roleLabels.add(contributor.role.trim());
    });

    return Array.from(contributorsMap.values())
      .map((summary) => ({
        name: summary.name,
        versions: Array.from(summary.versions).sort(compareVersions),
        roleGroups: Array.from(summary.roleGroups),
        roleLabels: Array.from(summary.roleLabels).sort((a, b) => a.localeCompare(b, 'es')),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }, []);

  const versions = useMemo<string[]>(() => {
    const list = Array.from(new Set(contributors.map((contributor: ContributorCard) => contributor.version))).sort(
      compareVersions
    );
    return ['Todas', ...list];
  }, []);

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
  const totalDistinctRoles = useMemo(() => {
    const rolesSet = new Set<ContributorRoleGroup>();
    summarizedContributors.forEach((contributor) => {
      contributor.roleGroups.forEach((role) => rolesSet.add(role));
    });
    return rolesSet.size;
  }, [summarizedContributors]);

  const latestVersion = useMemo(() => {
    if (versionValues.length === 0) return null;
    return versionValues.reduce((latest, current) =>
      compareVersions(current, latest) > 0 ? current : latest
    );
  }, [versionValues]);

  const contributorsByVersionFilter = useMemo(() => {
    if (versionFilter === 'Todas') return summarizedContributors;

    return summarizedContributors.filter((contributor) =>
      contributor.versions.some((version) => normalize(version) === normalize(versionFilter))
    );
  }, [summarizedContributors, versionFilter]);

  const totalContributorsBySelectedVersion = contributorsByVersionFilter.length;

  const roleStats = useMemo(() => {
    const stats = { ...roleStatsInitial };

    contributorsByVersionFilter.forEach((contributor) => {
      contributor.roleGroups.forEach((roleGroup) => {
        stats[roleGroup] += 1;
      });
    });

    return stats;
  }, [contributorsByVersionFilter]);

  const roles = useMemo(() => {
    const roleList = (Object.keys(roleStats) as ContributorRoleGroup[]).filter(
      (role) => roleStats[role] > 0
    );
    return ['Todos', ...roleList] as Array<'Todos' | ContributorRoleGroup>;
  }, [roleStats]);

  const filtered = useMemo(() => {
    return summarizedContributors
      .filter((contributor) => {
        const versionOk = versionFilter === 'Todas' || contributor.versions.some(
          (version) => normalize(version) === normalize(versionFilter)
        );
        const roleOk = roleFilter === 'Todos' || contributor.roleGroups.includes(roleFilter);
        return versionOk && roleOk;
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }, [summarizedContributors, versionFilter, roleFilter]);

  return (
    <section className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-6 relative z-10">
      <div
        className="rounded-[1.5rem] p-[1px] overflow-hidden shadow-[0_0_45px_oklch(0.82_0.18_330_/_0.12)]"
        style={rainbowBorderStyle}
      >
        <header className="rounded-[1.45rem] bg-transparent p-6 md:p-8">
          <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs text-muted-foreground border border-white/15 bg-transparent mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span>Contribuidores IRIS</span>
          </div>

          <h1 className="text-5xl md:text-5xl font-bold leading-tight">
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
          <div className="flex flex-wrap items-center gap-2">
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
            <span className="ml-auto text-sm text-muted-foreground">
              Mostrando: <span className="font-semibold" style={rainbowTextStyle}>{filtered.length}</span> contribuidores
            </span>
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((developer) => (
          <div
            key={developer.name}
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

              <h3 className="text-xl font-semibold text-white">{developer.name}</h3>
              <p className="mt-3 inline-flex rounded-full border border-white/45 bg-transparent px-3 py-1 text-sm text-white justify-center text-center">
                {developer.roleLabels.join(' • ')}
              </p>

              <div className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1">
                {developer.versions.map((version) => {
                  const accent = getVersionAccent(version);
                  return (
                    <span
                      key={`${developer.name}-${version}`}
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