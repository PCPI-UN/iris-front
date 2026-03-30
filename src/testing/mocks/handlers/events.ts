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
  evaluationsOpened?: boolean;
  isPubliclyJoinable?: boolean;
  location: string;
  locationDetails?: string;
  eventType: "Competition" | "Exposition";
  evaluationType?: "ZERO_TO_FIVE" | "ZERO_TO_HUNDRED";
  inscriptionRequirements?: string;
  inscriptionCost?: number;
  minimumTeamSize?: number;
  specificInscriptionDetails?: { title: string; description: string }[];
  aboutOurAllies?: string;
  organizers?: string[];
  collaborators?: string[];
  awards?: {
    title: string;
    description?: string;
    value?: number;
    position: number;
    categoryId?: string;
  }[];
  evaluationsStatus?: "open" | "closed";
  isPublic?: boolean;
  locationDetail?: string;
  cost?: number;
  organizations?: string[];
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
  isPubliclyJoinable: boolean;
  evaluationsOpened: boolean;
  location: string;
  locationDetails?: string;
  eventType: "Competition" | "Exposition";
  evaluationType?: "ZERO_TO_FIVE" | "ZERO_TO_HUNDRED";
  inscriptionRequirements?: string;
  inscriptionCost?: number;
  minimumTeamSize?: number;
  specificInscriptionDetails?: { title: string; description: string }[];
  aboutOurAllies?: string;
  organizers?: string[];
  collaborators?: string[];
  awards?: {
    title: string;
    description?: string;
    value?: number;
    position: number;
    categoryId?: string;
  }[];
  isPublic: boolean;
  evaluationsStatus: "open" | "closed";
  locationDetail?: string;
  cost?: number;
  organizations?: string[];
  createdAt: string;
  userEventRole?: "Participant" | "JURY";
};

const mapEventToDTO = (event: any, membership?: any): EventDTO => {
  const evaluationsOpened =
    typeof event.evaluationsOpened === "boolean"
      ? event.evaluationsOpened
      : event.evaluationsStatus === "open";
  const isPubliclyJoinable =
    typeof event.isPubliclyJoinable === "boolean"
      ? event.isPubliclyJoinable
      : Boolean(event.isPublic);
  const locationDetails = event.locationDetails ?? event.locationDetail;
  const inscriptionCost =
    typeof event.inscriptionCost === "number"
      ? event.inscriptionCost
      : event.cost;
  const organizers = event.organizers ?? event.organizations ?? [];
  const eventType = event.eventType === "Exhibition" ? "Exposition" : event.eventType;

  return {
    id: toPublicNumericId(String(event.id), "event"),
    name: event.name as string,
    description: event.description,
    startDate: event.startDate,
    endDate: event.endDate,
    inscriptionDeadline: event.inscriptionDeadline,
    accessCode: event.accessCode,
    isPubliclyJoinable,
    evaluationsOpened,
    location: event.location,
    locationDetails,
    eventType,
    evaluationType: event.evaluationType,
    inscriptionRequirements: event.inscriptionRequirements,
    inscriptionCost,
    minimumTeamSize: event.minimumTeamSize,
    specificInscriptionDetails: event.specificInscriptionDetails,
    aboutOurAllies: event.aboutOurAllies,
    organizers,
    collaborators: event.collaborators,
    awards: event.awards,
    isPublic: isPubliclyJoinable,
    evaluationsStatus: evaluationsOpened ? "open" : "closed",
    locationDetail: locationDetails,
    cost: inscriptionCost,
    organizations: organizers,
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
            isPubliclyJoinable: {
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
        isPubliclyJoinable: data.isPubliclyJoinable ?? data.isPublic ?? true,
        evaluationsOpened:
          data.evaluationsOpened ?? (data.evaluationsStatus === "open"),
        location: data.location,
        locationDetails: data.locationDetails ?? data.locationDetail,
        eventType: data.eventType,
        evaluationType: data.evaluationType,
        inscriptionRequirements: data.inscriptionRequirements,
        inscriptionCost: data.inscriptionCost ?? data.cost,
        minimumTeamSize: data.minimumTeamSize,
        specificInscriptionDetails: data.specificInscriptionDetails || [],
        aboutOurAllies: data.aboutOurAllies,
        organizers: data.organizers ?? data.organizations ?? [],
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
      const hasField = <K extends keyof EventBody>(key: K) =>
        Object.prototype.hasOwnProperty.call(data, key);
      // requireAdmin(user);
      const event = db.event.update({
        where: {
          id: {
            equals: eventId,
          },
        },
        data: {
          ...(hasField("name") && { name: data.name }),
          ...(hasField("description") && { description: data.description }),
          ...(hasField("startDate") && { startDate: data.startDate }),
          ...(hasField("endDate") && { endDate: data.endDate }),
          ...(hasField("inscriptionDeadline") && {
            inscriptionDeadline: data.inscriptionDeadline,
          }),
          ...(hasField("isPubliclyJoinable") && {
            isPubliclyJoinable: data.isPubliclyJoinable,
          }),
          ...(hasField("isPublic") && { isPubliclyJoinable: data.isPublic }),
          ...(hasField("evaluationsOpened") && {
            evaluationsOpened: data.evaluationsOpened,
          }),
          ...(hasField("evaluationsStatus") && {
            evaluationsOpened: data.evaluationsStatus === "open",
          }),
          ...(hasField("location") && { location: data.location }),
          ...(hasField("locationDetails") && {
            locationDetails: data.locationDetails,
          }),
          ...(hasField("locationDetail") && {
            locationDetails: data.locationDetail,
          }),
          ...(hasField("eventType") && { eventType: data.eventType }),
          ...(hasField("evaluationType") && { evaluationType: data.evaluationType }),
          ...(hasField("inscriptionRequirements") && {
            inscriptionRequirements: data.inscriptionRequirements,
          }),
          ...(hasField("inscriptionCost") && {
            inscriptionCost: data.inscriptionCost,
          }),
          ...(hasField("cost") && { inscriptionCost: data.cost }),
          ...(hasField("minimumTeamSize") && { minimumTeamSize: data.minimumTeamSize }),
          ...(hasField("specificInscriptionDetails") && {
            specificInscriptionDetails: data.specificInscriptionDetails,
          }),
          ...(hasField("aboutOurAllies") && { aboutOurAllies: data.aboutOurAllies }),
          ...(hasField("organizers") && { organizers: data.organizers }),
          ...(hasField("organizations") && { organizers: data.organizations }),
          ...(hasField("collaborators") && { collaborators: data.collaborators }),
          ...(hasField("awards") && { awards: data.awards }),
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
