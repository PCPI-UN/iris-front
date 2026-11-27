import { paths } from "@/config/paths";
import { formatTermCode } from "@/features/events/api/get-terms";
import type { Term } from "@/types/api";

export const TOUR_360_BASE_URL =
  "https://tours-360-coral.vercel.app/tour/v1125/ar";

type IdInput = number | string | null | undefined;
type TermCodeInput = string | Pick<Term, "year" | "period"> | null | undefined;

const normalizeTermCode = (term: TermCodeInput): string | null => {
  if (!term) {
    return null;
  }

  const raw =
    typeof term === "string" ? term.trim() : formatTermCode(term).trim();

  if (!raw || !/^[A-Za-z0-9]+$/.test(raw)) {
    return null;
  }

  return raw;
};

const normalizeTextSegment = (value: IdInput): string | null => {
  if (value === null || value === undefined) {
    return null;
  }

  const trimmed = String(value).trim();

  return trimmed.length > 0 ? trimmed : null;
};

/**
 * Formats the Tour 360 `equipo` code using backend department name and assigned project number:
 * `<term.year><term.period>-<departmentName>-<projectCode>` (or `<departmentName>-<projectCode>`
 * when no academic term is available). Returns `null` if either departmentName or projectCode is missing.
 */
export const formatTourTeamCode = ({
  termCode,
  departmentName,
  projectCode,
}: {
  termCode?: TermCodeInput;
  departmentName: string | null | undefined;
  projectCode: IdInput;
}): string | null => {
  const cleanDepartment = normalizeTextSegment(departmentName);
  const cleanProjectCode = normalizeTextSegment(projectCode);

  if (!cleanDepartment || !cleanProjectCode) {
    return null;
  }

  const baseCode = `${cleanDepartment}-${cleanProjectCode}`;
  const cleanTerm = normalizeTermCode(termCode);

  return cleanTerm ? `${cleanTerm}-${baseCode}` : baseCode;
};

export const buildTourUrl = ({
  termCode,
  departmentName,
  projectCode,
  projectId,
  origin,
}: {
  termCode?: TermCodeInput;
  departmentName: string | null | undefined;
  projectCode: IdInput;
  projectId: IdInput;
  origin: string;
}): string | null => {
  const teamCode = formatTourTeamCode({
    termCode,
    departmentName,
    projectCode,
  });
  const rawProjectId = normalizeTextSegment(projectId);

  if (!teamCode || !rawProjectId || !origin) {
    return null;
  }

  let parsedOrigin: URL;
  try {
    parsedOrigin = new URL(origin);
  } catch {
    return null;
  }

  if (parsedOrigin.protocol !== "http:" && parsedOrigin.protocol !== "https:") {
    return null;
  }

  const evaluationPath = paths.app.evaluations.getHref(rawProjectId);
  const dynamicUrl = new URL(evaluationPath, parsedOrigin.origin).toString();

  const tourUrl = new URL(TOUR_360_BASE_URL);
  tourUrl.searchParams.set("url-dinamica", dynamicUrl);
  tourUrl.searchParams.set("equipo", teamCode);

  return tourUrl.toString();
};

export const navigateToTour = (url: string) => {
  window.location.assign(url);
};
