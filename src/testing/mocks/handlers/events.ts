import { HttpResponse, http } from "msw";
import { env } from "@/config/env";
import { db, persistDb } from "../db";
import {
  requireAuth,
  // requireAdmin,
  networkDelay,
} from "../utils";

type EventBody = {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  inscriptionDeadline?: string;
  evaluationsStatus?: "open" | "closed";
  isPublic?: boolean;
  location: string;
  locationDetail?: string;
  eventType: "Competition" | "Exhibition";
  inscriptionRequirements?: string;
  cost?: number;
  minimumTeamSize?: number;
  specificInscriptionDetails?: { title: string; description: string }[];
  aboutOurAllies?: string;
  organizations?: string[];
  collaborators?: string[];
  awards?: { top: number; category: string; description: string; prizeMoney?: number }[];
};

const PAGE_SIZE = 10;

const toPublicNumericId = (value: string, prefix: string): number => {
  const match = value.match(new RegExp(`^${prefix}-(\\d+)$`));
  if (match) return Number(match[1]);
  const numeric = Number(value);
  return Number.isNaN(numeric) ? 0 : numeric;
};

const toInternalPrefixedId = (value: string, prefix: string): string => {
  if (value.startsWith(`${prefix}-`)) return value;
  if (/^\d+$/.test(value)) return `${prefix}-${value.padStart(3, "0")}`;
  return value;
};

const getNextEventId = (): string => {
  const maxNumericId = db.event
    .getAll()
    .map((event) => toPublicNumericId(String(event.id), "event"))
    .reduce((max, current) => (current > max ? current : max), 0);

  return `event-${String(maxNumericId + 1).padStart(3, "0")}`;
};

type EventDTO = {
  id: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  inscriptionDeadline: string;
  accessCode: string;
  isPublic: boolean;
  evaluationsStatus: "open" | "closed";
  location: string;
  locationDetail?: string;
  eventType: "Competition" | "Exhibition";
  inscriptionRequirements?: string;
  cost?: number;
  minimumTeamSize?: number;
  specificInscriptionDetails?: { title: string; description: string }[];
  aboutOurAllies?: string;
  organizations?: string[];
  collaborators?: string[];
  awards?: { top: number; category: string; description: string; prizeMoney?: number }[];
  createdAt: string;
  userEventRole?: "Participant" | "JURY";
};

const mapEventToDTO = (event: any, membership?: any): EventDTO => {
  return {
    id: toPublicNumericId(String(event.id), "event"),
    name: event.name as string,
    description: event.description,
    startDate: event.startDate,
    endDate: event.endDate,
    inscriptionDeadline: event.inscriptionDeadline,
    accessCode: event.accessCode,
    isPublic: event.isPublic,
    evaluationsStatus: event.evaluationsStatus,
    location: event.location,
    locationDetail: event.locationDetail,
    eventType: event.eventType,
    inscriptionRequirements: event.inscriptionRequirements,
    cost: event.cost,
    minimumTeamSize: event.minimumTeamSize,
    specificInscriptionDetails: event.specificInscriptionDetails,
    aboutOurAllies: event.aboutOurAllies,
    organizations: event.organizations,
    collaborators: event.collaborators,
    awards: event.awards,
    createdAt: event.createdAt,
    ...(membership && { userEventRole: membership.eventRole }),
  };
};

const validatePage = (page: number): number => {
  return Math.max(1, Math.floor(page)) || 1;
};

const calculatePagination = (total: number, page: number) => {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return {
    page: Math.min(page, totalPages),
    total,
    totalPages,
  };
};

const toDualResponse = (events: EventDTO[], pagination: { page: number; total: number; totalPages: number }) => ({
  data: events,
  meta: pagination,
  events,
  page: pagination.page,
  limit: PAGE_SIZE,
  total: pagination.total,
  totalPages: pagination.totalPages,
});

export const eventsHandlers = [
  http.get(`${env.API_URL}/events`, async ({ cookies, request }) => {
    await networkDelay();

    try {
      const { user, error } = requireAuth(cookies);
      if (error || !user) {
        return HttpResponse.json({ message: error || "Unauthorized" }, { status: 401 });
      }

      const url = new URL(request.url);
      const page = Number(url.searchParams.get("page") || 1);
      const validPage = validatePage(page);

      // Si el usuario es ADMIN, mostrar todos los eventos
      if (user.role === "ADMIN") {
        const total = db.event.count();
        const pagination = calculatePagination(total, validPage);

        const events = db.event
          .findMany({
            take: PAGE_SIZE,
            skip: PAGE_SIZE * (pagination.page - 1),
          })
          .map((event) => mapEventToDTO(event));

        return HttpResponse.json(toDualResponse(events, pagination));
      }

      // Para usuarios USER, solo mostrar eventos donde tienen membresía
      const userMemberships = db.eventMembership?.findMany({
        where: {
          userId: { equals: user.id },
        },
      }) || [];

      // Si no tiene membresías, retornar lista vacía
      if (userMemberships.length === 0) {
        const pagination = calculatePagination(0, validPage);
        return HttpResponse.json(toDualResponse([], pagination));
      }

      const eventIds = userMemberships.map((m) => m.eventId);

      // Obtener eventos del usuario con sus membresías
      const userEvents = db.event
        .findMany({
          where: {
            id: { in: eventIds },
          },
        })
        .map((event) => {
          const membership = userMemberships.find((m) => m.eventId === event.id);
          return mapEventToDTO(event, membership);
        });

      // Aplicar paginación manual (ya que necesitamos todos los eventos para mapear membresías)
      const total = userEvents.length;
      const pagination = calculatePagination(total, validPage);
      const startIndex = PAGE_SIZE * (pagination.page - 1);
      const endIndex = startIndex + PAGE_SIZE;
      const paginatedEvents = userEvents.slice(startIndex, endIndex);

      return HttpResponse.json(toDualResponse(paginatedEvents, pagination));
    } catch (error: any) {
      return HttpResponse.json(
        { message: error?.message || "Server Error" },
        { status: 500 }
      );
    }
  }),

  http.get(`${env.API_URL}/events/public`, async ({ request }) => {
    await networkDelay();

    try {
      const url = new URL(request.url);
      const page = Number(url.searchParams.get("page") || 1);
      const validPage = validatePage(page);

      const publicEvents = db.event
        .findMany({
          where: {
            isPublic: {
              equals: true,
            },
          },
        })
        .map((event) => mapEventToDTO(event));

      const total = publicEvents.length;
      const pagination = calculatePagination(total, validPage);
      const startIndex = PAGE_SIZE * (pagination.page - 1);
      const endIndex = startIndex + PAGE_SIZE;
      const paginatedEvents = publicEvents.slice(startIndex, endIndex);

      return HttpResponse.json(toDualResponse(paginatedEvents, pagination));
    } catch (error: any) {
      return HttpResponse.json(
        { message: error?.message || "Server Error" },
        { status: 500 }
      );
    }
  }),

  http.get(`${env.API_URL}/events/my-events`, async ({ cookies, request }) => {
    await networkDelay();

    try {
      const { user, error } = requireAuth(cookies);
      if (error || !user) {
        return HttpResponse.json({ message: error || "Unauthorized" }, { status: 401 });
      }

      const url = new URL(request.url);
      const page = Number(url.searchParams.get("page") || 1);
      const validPage = validatePage(page);

      const memberships = db.eventMembership?.findMany({
        where: {
          userId: {
            equals: user.id,
          },
        },
      }) || [];

      if (memberships.length === 0) {
        const pagination = calculatePagination(0, validPage);
        return HttpResponse.json(toDualResponse([], pagination));
      }

      const eventIds = memberships.map((m) => m.eventId);
      const myEvents = db.event
        .findMany({
          where: {
            id: {
              in: eventIds,
            },
          },
        })
        .map((event) => {
          const membership = memberships.find((m) => m.eventId === event.id);
          return mapEventToDTO(event, membership);
        });

      const total = myEvents.length;
      const pagination = calculatePagination(total, validPage);
      const startIndex = PAGE_SIZE * (pagination.page - 1);
      const endIndex = startIndex + PAGE_SIZE;
      const paginatedEvents = myEvents.slice(startIndex, endIndex);

      return HttpResponse.json(toDualResponse(paginatedEvents, pagination));
    } catch (error: any) {
      return HttpResponse.json(
        { message: error?.message || "Server Error" },
        { status: 500 }
      );
    }
  }),

  http.get(`${env.API_URL}/events-dropdown`, async ({ cookies }) => {
    await networkDelay();

    try {
      const { error } = requireAuth(cookies);
      if (error) {
        return HttpResponse.json({ message: error }, { status: 401 });
      }

      const events = db.event.findMany({}).map((event) => {
        return {
          id: toPublicNumericId(String(event.id), "event"),
          name: event.name,
        };
      });

      return HttpResponse.json({ data: events });
    } catch (error: any) {
      return HttpResponse.json(
        { message: error?.message || "Server Error" },
        { status: 500 }
      );
    }
  }),

  http.get(`${env.API_URL}/events/:eventId`, async ({ params, cookies }) => {
    await networkDelay();

    try {
      const { /*user,*/ error } = requireAuth(cookies);
      if (error) {
        return HttpResponse.json({ message: error }, { status: 401 });
      }

      const eventId = toInternalPrefixedId(String(params.eventId), "event");
      const event = db.event.findFirst({
        where: {
          id: {
            equals: eventId,
          },
        },
      });

      if (!event) {
        return HttpResponse.json(
          { message: "Event not found" },
          { status: 404 }
        );
      }

      return HttpResponse.json({ data: mapEventToDTO(event) });
    } catch (error: any) {
      return HttpResponse.json(
        { message: error?.message || "Server Error" },
        { status: 500 }
      );
    }
  }),

  http.post(`${env.API_URL}/events`, async ({ request, cookies }) => {
    await networkDelay();

    try {
      const { user, error } = requireAuth(cookies);
      if (error) {
        return HttpResponse.json({ message: error }, { status: 401 });
      }
      const data = (await request.json()) as EventBody;
      // requireAdmin(user);

      const event = db.event.create({
        id: getNextEventId(),
        name: data.name,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        inscriptionDeadline: data.inscriptionDeadline ?? data.startDate,
        accessCode: `EVT${Date.now().toString().slice(-6)}`,
        isPublic: data.isPublic ?? true,
        evaluationsStatus: data.evaluationsStatus ?? "closed",
        location: data.location,
        locationDetail: data.locationDetail,
        eventType: data.eventType,
        inscriptionRequirements: data.inscriptionRequirements,
        cost: data.cost,
        minimumTeamSize: data.minimumTeamSize,
        specificInscriptionDetails: data.specificInscriptionDetails || [],
        aboutOurAllies: data.aboutOurAllies,
        organizations: data.organizations || [],
        collaborators: data.collaborators || [],
        awards: data.awards || [],
      });

      await persistDb("event");

      return HttpResponse.json({ data: mapEventToDTO(event) });
    } catch (error: any) {
      return HttpResponse.json(
        { message: error?.message || "Server Error" },
        { status: 500 }
      );
    }
  }),

  http.patch(`${env.API_URL}/events/:eventId`, async ({ params, request, cookies }) => {
    await networkDelay();

    try {
      const { /*user,*/ error } = requireAuth(cookies);
      if (error) {
        return HttpResponse.json({ message: error }, { status: 401 });
      }
      const eventId = toInternalPrefixedId(String(params.eventId), "event");
      const data = (await request.json()) as Partial<EventBody>;
      // requireAdmin(user);
      const event = db.event.update({
        where: {
          id: {
            equals: eventId,
          },
        },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.description && { description: data.description }),
          ...(data.startDate && { startDate: data.startDate }),
          ...(data.endDate && { endDate: data.endDate }),
          ...(data.inscriptionDeadline && {
            inscriptionDeadline: data.inscriptionDeadline,
          }),
          ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
          ...(data.evaluationsStatus && {
            evaluationsStatus: data.evaluationsStatus,
          }),
        },
      });

      if (!event) {
        return HttpResponse.json(
          { message: "Event not found" },
          { status: 404 }
        );
      }

      await persistDb("event");

      return HttpResponse.json({ data: event ? mapEventToDTO(event) : event });
    } catch (error: any) {
      return HttpResponse.json(
        { message: error?.message || "Server Error" },
        { status: 500 }
      );
    }
  }
  ),

  http.delete(`${env.API_URL}/events/:eventId`, async ({ params, cookies }) => {
    await networkDelay();

    try {
      const { /*user,*/ error } = requireAuth(cookies);
      if (error) {
        return HttpResponse.json({ message: error }, { status: 401 });
      }
      const eventId = toInternalPrefixedId(String(params.eventId), "event");
      // requireAdmin(user);
      const event = db.event.delete({
        where: {
          id: {
            equals: eventId,
          },
        },
      });

      if (!event) {
        return HttpResponse.json(
          { message: "Event not found" },
          { status: 404 }
        );
      }

      await persistDb("event");

      return HttpResponse.json({ data: event ? mapEventToDTO(event) : event });
    } catch (error: any) {
      return HttpResponse.json(
        { message: error?.message || "Server Error" },
        { status: 500 }
      );
    }
  }),
];
