import { paths } from "@/config/paths";
import { formatTermCode } from "@/features/events/api/get-terms";
import type { Term } from "@/types/api";

export const TOUR_360_BASE_URL =
  "https://tours-360-coral.vercel.app/tour/v1125/ar";

type IdInput = number | string | null | undefined;
type TermCodeInput = string | Pick<Term, "year" | "period"> | null | undefined;

const normalizeIdentifier = (value: IdInput): string | null => {
  if (typeof value === "number") {
    return Number.isInteger(value) && value > 0 ? String(value) : null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const prefixedMatch = /^(?:event|project)-0*(\d+)$/i.exec(trimmed);
  if (prefixedMatch) {
    return prefixedMatch[1];
  }

  if (/^\d+$/.test(trimmed)) {
    const parsed = Number(trimmed);
    return Number.isSafeInteger(parsed) && parsed > 0 ? String(parsed) : null;
  }

  return /^[A-Za-z0-9_-]+$/.test(trimmed) ? trimmed : null;
};

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

export const formatTourTeamCode = ({
  termCode,
  eventId,
  projectId,
}: {
  termCode?: TermCodeInput;
  eventId: IdInput;
  projectId: IdInput;
}): string | null => {
  const cleanEventId = normalizeIdentifier(eventId);
  const cleanProjectId = normalizeIdentifier(projectId);

  if (!cleanEventId || !cleanProjectId) {
    return null;
  }

  const baseCode = `E${cleanEventId}-P${cleanProjectId}`;
  const cleanTerm = normalizeTermCode(termCode);

  return cleanTerm ? `${cleanTerm}-${baseCode}` : baseCode;
};

export const buildTourUrl = ({
  termCode,
  eventId,
  projectId,
  origin,
}: {
  termCode?: TermCodeInput;
  eventId: IdInput;
  projectId: IdInput;
  origin: string;
}): string | null => {
  const teamCode = formatTourTeamCode({ termCode, eventId, projectId });
  const rawProjectId =
    projectId === null || projectId === undefined ? "" : String(projectId).trim();

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

