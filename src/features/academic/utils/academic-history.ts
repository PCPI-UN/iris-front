import type { AcademicEvent } from "../types";

import dayjs from "dayjs";
import "dayjs/locale/es";

export type SemesterGroup = {
  /** "2026-1" (January to June) or "2026-2" (July to December) */
  semester: string;
  /** Events of the semester, newest first */
  events: AcademicEvent[];
};

/** Semester of an event by its start date: "2026-1" up to June, "2026-2" from July */
export const semesterOf = (event: Pick<AcademicEvent, "startDate">) => {
  const start = dayjs(event.startDate);

  return `${start.year()}-${start.month() < 6 ? 1 : 2}`;
};

/** Events grouped by semester, newest semester and newest event first */
export const groupEventsBySemester = (
  events: AcademicEvent[],
): SemesterGroup[] => {
  const sorted = [...events].sort(
    (a, b) => dayjs(b.startDate).valueOf() - dayjs(a.startDate).valueOf(),
  );
  const groups: SemesterGroup[] = [];

  sorted.forEach((event) => {
    const semester = semesterOf(event);
    const last = groups[groups.length - 1];

    if (last?.semester === semester) last.events.push(event);
    else groups.push({ semester, events: [event] });
  });

  return groups;
};

export type EventStage = "results" | "evaluation" | "finished" | "ongoing";

export const EVENT_STAGE_LABELS: Record<EventStage, string> = {
  results: "Resultados publicados",
  evaluation: "En evaluación",
  finished: "Finalizado",
  ongoing: "En curso",
};

/** Where the event is: published results win over the open evaluation, then the dates */
export const eventStage = (event: AcademicEvent, now = dayjs()): EventStage => {
  if (event.resultsPublished) return "results";
  if (event.evaluationsOpened) return "evaluation";

  return dayjs(event.endDate).isBefore(now) ? "finished" : "ongoing";
};

/** "20 – 22 feb, 2026"; the month and the year appear once when they repeat */
export const formatEventRange = (event: AcademicEvent) => {
  const start = dayjs(event.startDate).locale("es");
  const end = dayjs(event.endDate).locale("es");

  if (!event.endDate || start.isSame(end, "day"))
    return start.format("D MMM, YYYY");
  if (start.isSame(end, "month"))
    return `${start.format("D")} – ${end.format("D MMM, YYYY")}`;
  if (start.isSame(end, "year"))
    return `${start.format("D MMM")} – ${end.format("D MMM, YYYY")}`;

  return `${start.format("D MMM, YYYY")} – ${end.format("D MMM, YYYY")}`;
};
