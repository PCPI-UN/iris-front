// Utils for processing contributor data, including version comparison, summarization, and filtering.
import {
  ContributorCard,
  ContributorRoleGroup,
  getContributorRoleLabels,
  getContributorRoleGroup,
} from '@/features/developers/data/contributors';

const normalize = (value: string) => value.trim().toLowerCase();

const getVersionParts = (version: string) => {
  const matches = normalize(version).match(/\d+/g);
  return matches ? matches.map(Number) : [0];
};
// Compare versions 
export const compareVersions = (a: string, b: string) => {
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

const compareVersionsDesc = (a: string, b: string) => compareVersions(b, a);
// Check if version matches the selected version (considering "Todas" as a wildcard)
const matchVersion = (version: string, selectedVersion: string) =>
  normalize(version) === normalize(selectedVersion);

export type ContributorSummary = {
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
// Transform the list of contributors into a summary
export const summarizeContributors = (contributors: ContributorCard[]): ContributorSummary[] => {
  const contributorsMap = new Map<
    string,
    {
      name: string;
      versions: Set<string>;
      roleGroups: Set<ContributorRoleGroup>;
      roleLabels: Set<string>;
    }
  >();

  contributors.forEach((contributor) => {
    const normalizedName = normalize(contributor.name);
    const roleLabels = getContributorRoleLabels(contributor.role);

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
    roleLabels.forEach((roleLabel) => {
  summary.roleGroups.add(getContributorRoleGroup(roleLabel));
  summary.roleLabels.add(roleLabel);
});

  });
// Convert sets to arrays and sort them before returning the final list of summaries
  return Array.from(contributorsMap.values())
    .map((summary) => ({
      name: summary.name,
      versions: Array.from(summary.versions).sort(compareVersionsDesc),
      roleGroups: Array.from(summary.roleGroups),
      roleLabels: Array.from(summary.roleLabels).sort((a, b) => a.localeCompare(b, 'es')),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
};
// Get unique version filters from the contributors list, sorted by version
export const getVersionFilters = (contributors: ContributorCard[]) => {
  const versions = Array.from(new Set(contributors.map((contributor) => contributor.version))).sort(compareVersionsDesc);
  return ['Todas', ...versions];
};
// Get unique role group filters from the contributors list, sorted alphabetically
export const getContributorsByVersion = (
  contributorSummaries: ContributorSummary[],
  versionFilter: string
) => {
  if (versionFilter === 'Todas') return contributorSummaries;

  return contributorSummaries.filter((contributor) =>
    contributor.versions.some((version) => matchVersion(version, versionFilter))
  );
};
export const countDistinctRoleGroups = (contributorSummaries: ContributorSummary[]) => {
  const rolesSet = new Set<ContributorRoleGroup>();

  contributorSummaries.forEach((contributor) => {
    contributor.roleGroups.forEach((role) => rolesSet.add(role));
  });

  return rolesSet.size;
};

export const buildRoleStats = (contributorSummaries: ContributorSummary[]) => {
  const stats = { ...roleStatsInitial };

  contributorSummaries.forEach((contributor) => {
    contributor.roleGroups.forEach((roleGroup) => {
      stats[roleGroup] += 1;
    });
  });

  return stats;
};
// Filter contributors based on selected version and role group
export const filterContributors = (
  contributorSummaries: ContributorSummary[],
  versionFilter: string,
  roleFilter: ContributorRoleGroup | 'Todos'
) =>
  contributorSummaries.filter((contributor) => {
    const versionOk =
      versionFilter === 'Todas' ||
      contributor.versions.some((version) => matchVersion(version, versionFilter));
    const roleOk = roleFilter === 'Todos' || contributor.roleGroups.includes(roleFilter);

    return versionOk && roleOk;
  }).sort((a, b) => {
    const aTopVersion = a.versions[0] ?? '';
    const bTopVersion = b.versions[0] ?? '';
    const versionComparison = compareVersionsDesc(aTopVersion, bTopVersion);

    if (versionComparison !== 0) return versionComparison;

    return a.name.localeCompare(b.name, 'es');
  });
