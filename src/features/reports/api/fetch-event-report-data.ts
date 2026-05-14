import { getProjects, ProjectWithJurors } from "@/features/projects/api/get-projects";
import type { CategoryCount, DashboardStats, EventReportData, Project } from "../../../types/report-types";
import { EventJuror, getEventJuries } from "@/features/juries/api/get-event-juries";
import { getEvent } from "@/features/events/api/get-event";

export async function fetchEventReportData(eventId: number): Promise<EventReportData> {
  const projectsQuery = await getProjects({ page: 1, eventId });
  const dataJuriesQuery = await getEventJuries({eventId});
  const dataEventQuery = await getEvent({eventId});

  const data = projectsQuery.data ?? [];
  const dataJuries = dataJuriesQuery?.data;
  const dataEvent = dataEventQuery?.data;

  // States
  const projectsApproved = data.filter(data => data.state === "APPROVED");
  const projectsRejected = data.filter(data => data.state === "REJECTED");
  const projectsRequire = data.filter(data => data.state === "REQUEST_CHANGES");
  const projectsReview = data.filter(data => data.state === "UNDER_REVIEW");

  // Map categories
  const categories: CategoryCount[] = dataEvent.categories?.map(category => {
    return {
      category: category.name,
      count: data.filter(proj => proj.courseId === category.id).length
    }
  }) ?? [];

  const studentsByProjects: number[] = data.map(proj => {
    return proj.participants.length
  })

  const numStudents = studentsByProjects.reduce((acc, curr) => acc + curr, 0)

  const dashboardData: DashboardStats = { 
    totalProjects: data.length, 
    approved: projectsApproved.length, 
    rejected: projectsRejected.length, 
    underReview: projectsReview.length, 
    changesRequired: projectsRequire.length,
    projectsByCategory: categories,
    participants: {noStudents: numStudents},
  }

  // Helper juries
  const jurorsInfo = (project: ProjectWithJurors, dataJuries: EventJuror[] | undefined) => {
    return project.jurors?.map(juryProject => {
      const jury = dataJuries?.find(j => j.id == juryProject.id);
      const ev = jury?.assignedProjects?.find(e => e.id === project.id);
      return {
        name: `${juryProject.firstName} ${juryProject.lastName}`, email: juryProject.email, evaluated: ev?.evaluated ?? false
      };
    }) ?? []
  }

  const projects: Project[] = data.map(proj => ({
    id: proj.id,
    eventId: proj.eventId,
    categoryId: proj.courseId,
    number: proj.projectCode ?? "#",
    name: proj.name,
    category: dataEvent.categories?.find(cat => proj.courseId === cat.id)?.name ?? "NaN",
    status: proj.state,
    members: proj.participants.length,
    description: proj.description ?? "",
    documents: [],
    jurors: proj.jurors?.map(juror => ({ 
      id: Number(juror.id), 
      firstName: juror.firstName ?? "", 
      lastName: juror.lastName ?? "", 
      email: juror.email ?? "" 
    })) ?? [],
    createdAt: new Date(proj.createdAt).toISOString(),
    participants: proj.participants?.map(participant => ({

      name: `${participant.firstName ?? ""} ${participant.lastName ?? ""}`.trim(),
      email: participant.email ?? "",
      career: participant.career ?? "",
    })) ?? [],
    jurorAssignments: jurorsInfo(proj, dataJuries),
  }));

  return {
    eventId: dataEvent.id, 
    eventName: dataEvent.name, 
    reportDate: new Date().toISOString(),
    dashboard: dashboardData,
    projects
  }
}