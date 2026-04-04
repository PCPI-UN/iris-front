export type PublicEventType = "Competition" | "Exposition";

const EVENT_TYPE_BY_ID: Record<number, PublicEventType> = {
  1: "Exposition",
  2: "Competition",
};

export const normalizeEventType = (value: unknown): PublicEventType | null => {
  if (typeof value === "number") {
    return EVENT_TYPE_BY_ID[value] ?? null;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (normalized === "competition") {
      return "Competition";
    }

    if (normalized === "exposition") {
      return "Exposition";
    }

    const numericValue = Number(normalized);
    if (Number.isInteger(numericValue)) {
      return EVENT_TYPE_BY_ID[numericValue] ?? null;
    }
  }

  return null;
};

export const toPublicEventType = (
  value: unknown,
  fallback: PublicEventType = "Exposition",
): PublicEventType => {
  return normalizeEventType(value) ?? fallback;
};
