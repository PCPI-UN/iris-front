import type {
  ProjectJuror,
  ProjectWithJurors,
} from "@/features/projects/api/get-projects-with-jurors";

/** Lowercases and strips accents so "Pérez" matches "perez". */
export const normalizeSearchText = (value: string) =>
  value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();

const searchTokens = (term: string) =>
  normalizeSearchText(term).split(/\s+/).filter(Boolean);

const jurorFullName = (juror: ProjectJuror) =>
  normalizeSearchText(`${juror.firstName ?? ""} ${juror.lastName ?? ""}`);

/** A juror matches when every word of the term appears in their full name. */
export const jurorMatches = (juror: ProjectJuror, term: string) => {
  const tokens = searchTokens(term);

  if (tokens.length === 0) return false;
  const fullName = jurorFullName(juror);

  return tokens.every((token) => fullName.includes(token));
};

/** Projects that have at least one assigned juror whose name matches the term. */
export const filterProjectsByJuror = <T extends ProjectWithJurors>(
  projects: T[],
  term: string,
): T[] => {
  if (searchTokens(term).length === 0) return projects;

  return projects.filter((project) =>
    (project.jurors ?? []).some((juror) => jurorMatches(juror, term)),
  );
};

export const filterProjectsByName = <T extends { name?: string | null }>(
  projects: T[],
  term: string,
): T[] => {
  const needle = normalizeSearchText(term);

  if (!needle) return projects;

  return projects.filter((project) =>
    normalizeSearchText(project.name ?? "").includes(needle),
  );
};
