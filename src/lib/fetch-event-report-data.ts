import { getProjects, useProjects } from "@/features/projects/api/get-projects";
import type { EventReportData } from "../types/report-types";
import { MOCK_EVENT_REPORT } from "./mock-data";

export async function fetchEventReportData(eventId: number): Promise<EventReportData> {
  const projectsQuery = await getProjects({ page: 1, eventId });
  const { data, meta } = projectsQuery;
  console.log('this is data', data)

  return MOCK_EVENT_REPORT
}