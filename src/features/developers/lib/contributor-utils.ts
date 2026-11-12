// Utils for processing contributor data, including version comparison, summarization, and filtering.
import {
  ContributorCard,
  ContributorRoleGroup,
  getContributorFullName,
  getContributorRoleLabels,
  getContributorRoleGroup,
} from '@/features/developers/data/contributors';

const normalize = (value: string) => value.trim().toLowerCase();

const normalizeSearchText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

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

export const extractGithubHandle = (githubUrl?: string): string => {
  if (!githubUrl) return '';
  const cleaned = githubUrl.trim().replace(/\/+$/, '');
  const segments = cleaned.split('/');
  return segments[segments.length - 1] ?? '';
};

export const getContributorInitials = ({
  firstName,
  lastName1,
}: Pick<ContributorCard, 'firstName' | 'lastName1'>): string => {
  const firstInitial = (firstName ?? '').trim().charAt(0);
  const lastInitial = (lastName1 ?? '').trim().charAt(0);
  return `${firstInitial}${lastInitial}`.toUpperCase() || 'IR';
};

export const isLeadershipRoleLabel = (roleLabel: string): boolean => {
  const normalized = normalize(roleLabel);
  return (
    normalized.includes('leader') ||
    normalized.includes('architect') ||
    normalized.includes('scrum')
  );
};

export type ContributorVersionEntry = {
  version: string;
  role: string;
  roleLabels: string[];
  roleGroups: ContributorRoleGroup[];
};

export type ContributorSummary = {
  firstName: string;
  middleName: string;
  lastName1: string;
  lastName2: string;
  fullName: string;
  initials: string;
  github: string;
  githubHandle: string;
  avatarUrl: string;
  versions: string[];
  roleGroups: ContributorRoleGroup[];
  roleLabels: string[];
  isLeadership: boolean;
  versionHistory: ContributorVersionEntry[];
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
      firstName: string;
      middleName: string;
      lastName1: string;
      lastName2: string;
      fullName: string;
      initials: string;
      github: string;
      githubHandle: string;
      avatarUrl: string;
      versions: Set<string>;
      roleGroups: Set<ContributorRoleGroup>;
      roleLabels: Set<string>;
      versionMap: Map<string, ContributorVersionEntry>;
    }
  >();

  contributors.forEach((contributor) => {
    const fullName = getContributorFullName(contributor);
    const normalizedName = normalize(fullName);
    const roleLabels = getContributorRoleLabels(contributor.role);
    const roleGroupsForEntry = Array.from(
      new Set(roleLabels.map((roleLabel) => getContributorRoleGroup(roleLabel))),
    );
    const githubHandle = extractGithubHandle(contributor.github);

    if (!contributorsMap.has(normalizedName)) {
      contributorsMap.set(normalizedName, {
        firstName: contributor.firstName,
        middleName: contributor.middleName ?? '',
        lastName1: contributor.lastName1,
        lastName2: contributor.lastName2,
        fullName,
        initials: getContributorInitials(contributor),
        github: contributor.github ?? '',
        githubHandle,
        avatarUrl: githubHandle ? `https://github.com/${githubHandle}.png?size=160` : '',
        versions: new Set<string>(),
        roleGroups: new Set<ContributorRoleGroup>(),
        roleLabels: new Set<string>(),
        versionMap: new Map<string, ContributorVersionEntry>(),
      });
    }

    const summary = contributorsMap.get(normalizedName);
    if (!summary) return;

    if (!summary.github && contributor.github) {
      summary.github = contributor.github;
      summary.githubHandle = githubHandle;
      summary.avatarUrl = githubHandle ? `https://github.com/${githubHandle}.png?size=160` : '';
    }

    summary.versions.add(contributor.version);
    roleLabels.forEach((roleLabel) => {
      summary.roleGroups.add(getContributorRoleGroup(roleLabel));
      summary.roleLabels.add(roleLabel);
    });

    const versionKey = contributor.version.trim();
    const existingVersionEntry = summary.versionMap.get(versionKey);
    if (!existingVersionEntry) {
      summary.versionMap.set(versionKey, {
        version: versionKey,
        role: contributor.role,
        roleLabels,
        roleGroups: roleGroupsForEntry,
      });
    } else {
      const mergedLabels = Array.from(new Set([...existingVersionEntry.roleLabels, ...roleLabels]));
      const mergedGroups = Array.from(
        new Set([...existingVersionEntry.roleGroups, ...roleGroupsForEntry]),
      );
      summary.versionMap.set(versionKey, {
        version: versionKey,
        role: mergedLabels.join(' - '),
        roleLabels: mergedLabels,
        roleGroups: mergedGroups,
      });
    }
  });

  // Convert sets to arrays and sort them before returning the final list of summaries
  return Array.from(contributorsMap.values())
    .map((summary) => {
      const roleLabels = Array.from(summary.roleLabels).sort((a, b) => a.localeCompare(b, 'es'));
      const versionHistory = Array.from(summary.versionMap.values()).sort((a, b) =>
        compareVersionsDesc(a.version, b.version),
      );
      return {
        firstName: summary.firstName,
        middleName: summary.middleName,
        lastName1: summary.lastName1,
        lastName2: summary.lastName2,
        fullName: summary.fullName,
        initials: summary.initials,
        github: summary.github,
        githubHandle: summary.githubHandle,
        avatarUrl: summary.avatarUrl,
        versions: Array.from(summary.versions).sort(compareVersionsDesc),
        roleGroups: Array.from(summary.roleGroups),
        roleLabels,
        isLeadership: roleLabels.some(isLeadershipRoleLabel),
        versionHistory,
      };
    })
    .sort((a, b) => a.fullName.localeCompare(b.fullName, 'es'));
};

// Get unique version filters from the contributors list, sorted by version
export const getVersionFilters = (contributors: ContributorCard[]) => {
  const versions = Array.from(new Set(contributors.map((contributor) => contributor.version))).sort(
    compareVersionsDesc,
  );
  return ['Todas', ...versions];
};

// Get contributors filtered by version
export const getContributorsByVersion = (
  contributorSummaries: ContributorSummary[],
  versionFilter: string,
) => {
  if (versionFilter === 'Todas') return contributorSummaries;

  return contributorSummaries.filter((contributor) =>
    contributor.versions.some((version) => matchVersion(version, versionFilter)),
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
  roleFilter: ContributorRoleGroup | 'Todos',
  searchQuery = '',
) => {
  const normalizedQuery = normalizeSearchText(searchQuery);

  return contributorSummaries
    .filter((contributor) => {
      const versionOk =
        versionFilter === 'Todas' ||
        contributor.versions.some((version) => matchVersion(version, versionFilter));
      const roleOk = roleFilter === 'Todos' || contributor.roleGroups.includes(roleFilter);
      const searchOk =
        !normalizedQuery ||
        normalizeSearchText(contributor.fullName).includes(normalizedQuery) ||
        normalizeSearchText(contributor.githubHandle).includes(normalizedQuery) ||
        contributor.roleLabels.some((label) =>
          normalizeSearchText(label).includes(normalizedQuery),
        ) ||
        contributor.roleGroups.some((group) =>
          normalizeSearchText(group).includes(normalizedQuery),
        ) ||
        contributor.versions.some((ver) => normalizeSearchText(ver).includes(normalizedQuery));

      return versionOk && roleOk && searchOk;
    })
    .sort((a, b) => {
      const aTopVersion = a.versions[0] ?? '';
      const bTopVersion = b.versions[0] ?? '';
      const versionComparison = compareVersionsDesc(aTopVersion, bTopVersion);

      if (versionComparison !== 0) return versionComparison;

      if (a.isLeadership !== b.isLeadership) {
        return a.isLeadership ? -1 : 1;
      }

      return a.fullName.localeCompare(b.fullName, 'es');
    });
};

export const getRelatedCollaborators = (
  target: ContributorSummary,
  allSummaries: ContributorSummary[],
) => {
  const others = allSummaries.filter((item) => item.fullName !== target.fullName);

  const sameDiscipline = others.filter((item) =>
    item.roleGroups.some((group) => target.roleGroups.includes(group)),
  );

  const sameGeneration = others.filter((item) =>
    item.versions.some((ver) => target.versions.includes(ver)),
  );

  return {
    sameDiscipline: sameDiscipline.slice(0, 6),
    sameGeneration: sameGeneration.slice(0, 8),
  };
};
