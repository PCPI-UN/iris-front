import { Event } from "@/types/api";

export type EventAward = NonNullable<Event["awards"]>[number];

const POSITION_LABELS: Record<number, string> = {
  1: "Primer puesto",
  2: "Segundo puesto",
  3: "Tercer puesto",
  4: "Cuarto puesto",
};

const hasText = (value?: string | null) => Boolean(value?.trim());

/** Automatic label from the position, used only when the award has no title. */
export const getAwardPositionLabel = (position: number) =>
  POSITION_LABELS[position] ?? `${position}° puesto`;

/**
 * The title the admin registered is what identifies the award: not every event
 * has a hierarchy (e.g. a certificate for everyone), so the position label is
 * only a fallback.
 */
export const getAwardTitle = (award: EventAward) =>
  hasText(award.title)
    ? award.title.trim()
    : getAwardPositionLabel(award.position);

/** "$3.000.000 COP", or null when the award has no monetary value. */
export const formatAwardValue = (value?: number | null) => {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return null;
  }
  return `$${new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(value)} COP`;
};

export const getAwardDescription = (award: EventAward) =>
  hasText(award.description) ? award.description!.trim() : null;

/** Awards ordered by position, dropping malformed entries. */
export const getVisibleAwards = (
  awards?: Event["awards"] | null,
): EventAward[] =>
  (Array.isArray(awards) ? awards : [])
    .filter(
      (award): award is EventAward =>
        Boolean(award) && typeof award.position === "number",
    )
    .sort((left, right) => left.position - right.position);
