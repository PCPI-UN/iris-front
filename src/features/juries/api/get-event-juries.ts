import { queryOptions, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import { QueryConfig } from "@/lib/react-query";
import { InvitationsMeta } from "@/types/api";
import { getProjectsWithJurors } from "@/features/projects/api/get-projects-with-jurors";

export type EventJuror = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  assignedProjects?: Array<{ id: number; evaluated: boolean }>;
};

type GetEventJuriesParams = {
  eventId: string | number;
  page?: number;
  limit?: number;
};

type GetEventJuriesResponse = {
  jurors?: EventJuror[];
  data?: EventJuror[];
  meta?: InvitationsMeta;
};

const dedupeJurors = (jurors: EventJuror[] = []) => {
  const jurorMap = new Map<string, EventJuror>();

  jurors.forEach((juror) => {
    const key = juror.id?.trim() || juror.email?.trim().toLowerCase() || `${juror.firstName ?? ""}:${juror.lastName ?? ""}`;
    const currentJuror = jurorMap.get(key) ?? { ...juror, assignedProjects: [] };
    const currentAssignments = currentJuror.assignedProjects ?? [];
    const nextAssignments = juror.assignedProjects ?? [];
    const mergedAssignments = new Map<number, { id: number; evaluated: boolean }>();

    currentAssignments.forEach((assignment) => {
      mergedAssignments.set(Number(assignment.id), assignment);
    });

    nextAssignments.forEach((assignment) => {
      const existing = mergedAssignments.get(Number(assignment.id));
      mergedAssignments.set(Number(assignment.id), {
        id: Number(assignment.id),
        evaluated: Boolean(existing?.evaluated || assignment.evaluated),
      });
    });

    jurorMap.set(key, {
      ...currentJuror,
      ...juror,
      assignedProjects: Array.from(mergedAssignments.values()),
    });
  });

  return Array.from(jurorMap.values());
};

const buildEventJuriesFromProjects = async (eventId: string | number): Promise<GetEventJuriesResponse> => {
  const projectsQuery = await getProjectsWithJurors({
    currentPage: 1,
    itemsPerPage: 10000,
    eventId: Number(eventId),
  });

  const jurorMap = new Map<string, EventJuror>();

  (projectsQuery.data ?? []).forEach((project) => {
    (project.jurors ?? []).forEach((juror) => {
      const key = juror.id?.trim() || juror.email?.trim().toLowerCase() || `${juror.firstName ?? ""}:${juror.lastName ?? ""}`;
      const currentJuror = jurorMap.get(key) ?? {
        id: juror.id,
        firstName: juror.firstName ?? "",
        lastName: juror.lastName ?? "",
        email: juror.email ?? "",
        assignedProjects: [],
      };

      const assignedProjects = currentJuror.assignedProjects ?? [];
      const alreadyAssigned = assignedProjects.some((assignedProject) => Number(assignedProject.id) === Number(project.id));

      if (!alreadyAssigned) {
        assignedProjects.push({ id: Number(project.id), evaluated: Boolean(project.evaluated) });
      }

      jurorMap.set(key, {
        ...currentJuror,
        assignedProjects,
      });
    });
  });

  const jurors = dedupeJurors(Array.from(jurorMap.values()));

  return {
    data: jurors,
    jurors,
    meta: {
      total: jurors.length,
      itemsOnCurrentPage: jurors.length,
      itemsPerPage: jurors.length || 1,
      currentPage: 1,
      totalPages: 1,
    },
  };
};

export const getEventJuries = async ({
  eventId,
  page = 1,
  limit = 100,
}: GetEventJuriesParams): Promise<GetEventJuriesResponse> => {
  try {
    const response = await api.get<GetEventJuriesResponse>(
      `/events/${eventId}/jurors`,
      { suppressErrorNotification: true }
    );

    const jurors = dedupeJurors(response.jurors ?? response.data ?? []);

    return {
      data: jurors,
      jurors,
      meta: response.meta ?? {
        total: jurors.length,
        itemsOnCurrentPage: jurors.length,
        itemsPerPage: limit,
        currentPage: page,
        totalPages: 1,
      },
    };
  } catch {
    return buildEventJuriesFromProjects(eventId);
  }
};

export const getEventJuriesQueryOptions = ({
  eventId,
  page = 1,
  limit = 100,
}: GetEventJuriesParams) => {
  return queryOptions({
    queryKey: ["event-juries", eventId, page, limit],
    queryFn: () => getEventJuries({ eventId, page, limit }),
    enabled: eventId !== undefined && eventId !== null && eventId !== "",
  });
};

type UseEventJuriesOptions = {
  eventId?: string | number;
  page?: number;
  limit?: number;
  queryConfig?: QueryConfig<typeof getEventJuriesQueryOptions>;
};

export const useEventJuries = ({
  eventId,
  page = 1,
  limit = 100,
  queryConfig,
}: UseEventJuriesOptions) => {
  return useQuery({
    ...getEventJuriesQueryOptions({ eventId: eventId!, page, limit }),
    ...queryConfig,
    enabled:
      eventId !== undefined && eventId !== null && eventId !== "" &&
      (queryConfig?.enabled ?? true),
  });
};