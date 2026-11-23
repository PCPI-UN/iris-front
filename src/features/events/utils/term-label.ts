import { Term } from "@/types/api";

/** Text shown for an event created before academic terms existed (term id -1) */
export const NO_TERM_LABEL = "Sin periodo";

/**
 * Term of an event as the university writes it (2026 + "10" is 202610), or "Sin periodo" for an
 * event created before terms existed: it has no term id, or the -1 of the "no term" row.
 */
export const eventTermLabel = (
  termId: number | null | undefined,
  terms: Pick<Term, "id" | "year" | "period">[] | undefined,
): string => {
  if (typeof termId !== "number" || termId <= 0) {
    return NO_TERM_LABEL;
  }

  const term = terms?.find((candidate) => candidate.id === termId);

  return term ? `${term.year}${term.period}` : `Periodo ${termId}`;
};
