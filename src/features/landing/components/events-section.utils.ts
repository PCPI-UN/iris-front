import { landingContent } from "../content";

const EVENT_COLORS = [
  {
    color: "oklch(0.75 0.15 195)",
    gradient: "from-cyan-500/20 via-blue-500/20 to-cyan-500/20",
  },
  {
    color: "oklch(0.82 0.18 330)",
    gradient: "from-pink-500/20 via-rose-500/20 to-pink-500/20",
  },
  {
    color: "oklch(0.88 0.16 85)",
    gradient: "from-yellow-500/20 via-orange-500/20 to-yellow-500/20",
  },
] as const;

export const PRISMATIC_GRADIENT =
  "linear-gradient(115deg, oklch(0.75 0.15 195), oklch(0.82 0.18 330), oklch(0.88 0.16 85), oklch(0.75 0.15 195))";

export const PRISMATIC_GRADIENT_DIM =
  "linear-gradient(115deg, oklch(0.75 0.15 195 / 0.3), oklch(0.82 0.18 330 / 0.3), oklch(0.88 0.16 85 / 0.3), oklch(0.75 0.15 195 / 0.3))";

export const getEventColor = (_eventId: number, index: number) => {
  const colorIndex = index % EVENT_COLORS.length;
  return EVENT_COLORS[colorIndex];
};

export const formatDateRange = (startDate: string, endDate: string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const endDay = end.getDate();
  const month = start.toLocaleDateString("es", { month: "long" });
  const year = start.getFullYear();

  return `${endDay} de ${month} ${year}`;
};

export const getStatusText = (statusName: string) => {
  const normalizedStatus = statusName.trim().toUpperCase();
  if (normalizedStatus === "CLOSED") {
    return landingContent.events.status.closed;
  }

  return landingContent.events.status.upcoming;
};
