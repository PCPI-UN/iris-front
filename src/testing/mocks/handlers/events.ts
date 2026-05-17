import { HttpResponse, http } from "msw";
import { env } from "@/config/env";
import { db, persistDb } from "../db";
import {
  requireAuth,
  // requireAdmin,
  networkDelay,
} from "../utils";
import { toEventTypeCode, toEvaluationTypeCode } from "@/features/events/utils/event-enums";

type EventBody = {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  inscriptionDeadline?: string;
  evaluationsOpened?: boolean;
  active?: boolean;
  isPubliclyJoinable?: boolean;
  location: string;
  locationDetails?: string;
  eventType: "Competition" | "Exposition";
  evaluationType?: 1 | 2 | "ZERO_TO_FIVE" | "ZERO_TO_HUNDRED" | "0-5" | "0-100";
  inscriptionRequirements?: string;
  inscriptionCost?: number;
  minimumTeamSize?: number;
  specificInscriptionDetails?: {
    id?: number;
    eventId?: number;
    title: string;
    description: string;
    value?: number;
    isRequired?: boolean;
  }[];
  aboutOurAllies?: string;
  organizers?: string[];
  collaborators?: string[];
  awards?: {
    id?: number;
    title: string;
    description?: string;
    value?: number;
    position: number;
    categoryId?: number;
  }[];
};

const isValidEventTypeLabel = (value: unknown): value is "Competition" | "Exposition" => {
  return value === "Competition" || value === "Exposition";
};

const PAGE_SIZE = 10;
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const FIVE_HOURS_IN_MS = 5 * 60 * 60 * 1000;

const formatDateTime = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const addFiveHoursToMockDate = (value?: string) => {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    return value;
  }

  let parsedDate: Date;

  if (DATE_ONLY_PATTERN.test(normalized)) {
    const [year, month, day] = normalized.split("-").map(Number);
    parsedDate = new Date(year, month - 1, day, 0, 0, 0);
  } else {
    parsedDate = new Date(normalized);
  }

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return formatDateTime(new Date(parsedDate.getTime() + FIVE_HOURS_IN_MS));
};

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
  eventType: 1 | 2;
  evaluationType?: 1 | 2;
  inscriptionRequirements?: string;
  inscriptionCost?: number;
  minimumTeamSize?: number;
  active: boolean;
  specificInscriptionDetails?: {
    id?: number;
    eventId?: number;
    title: string;
    description: string;
    value?: number;
    isRequired?: boolean;
  }[];
  categories?: {
    id: number;
    eventId?: number;
    name: string;
    description?: string;
    active?: boolean;
  }[];
  aboutOurAllies?: string;
  organizers?: string[];
  collaborators?: string[];
  awards?: {
    id?: number;
    title: string;
    description?: string;
    value?: number;
    position: number;
    categoryId?: number;
  }[];
  status?: number;
  createdAt: string | number;
  updatedAt: string | number;
  userEventRole?: "Participant" | "JURY";
};

type PublicEventDTO = {
  id: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  inscriptionDeadline: string;
  accessCode: string;
  statusName: string;
  isPubliclyJoinable: boolean;
  evaluationsOpened: boolean;
  role: string;
  active: boolean;
  location?: string;
  locationDetails?: string;
  eventType?: 1 | 2;
  inscriptionCost?: number;
  inscriptionRequirements?: string;
  aboutOurAllies?: string;
  evaluationType?: 1 | 2;
  minimumTeamSize?: number;
  specificInscriptionDetails?: Array<{
    title: string;
    description: string;
  }>;
  categories?: Array<{
    id: number;
    name: string;
    active?: boolean;
  }>;
  organizers?: string[];
  collaborators?: string[];
  awards?: Array<{
    title: string;
    description?: string;
    value?: number;
    position: number;
    categoryId?: number;
  }>;
  status?: number;
  createdAt: number;
  updatedAt: number;
};

const mapEventToDTO = (event: any, membership?: any): EventDTO => {
  const evaluationsOpened =
    typeof event.evaluationsOpened === "boolean"
      ? event.evaluationsOpened
      : event.evaluationsStatus === "open";
  const active =
    typeof event.active === "boolean" ? event.active : event.status === 1;
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
    eventType: toEventTypeCode(event.eventType),
    evaluationType: toEvaluationTypeCode(event.evaluationType),
    inscriptionRequirements: event.inscriptionRequirements,
    inscriptionCost,
    minimumTeamSize: event.minimumTeamSize,
    active,
    specificInscriptionDetails: event.specificInscriptionDetails,
    categories: event.categories,
    aboutOurAllies: event.aboutOurAllies,
    organizers,
    collaborators: event.collaborators,
    awards: event.awards,
    status: event.status,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt ?? event.createdAt,
    ...(membership && { userEventRole: membership.eventRole }),
  };
};

const mapEventToPublicDTO = (event: any): PublicEventDTO => {
  const now = new Date();
  const inscriptionDeadline = new Date(event.inscriptionDeadline);
  
  // Compare by calendar day (not exact timestamp) - valid all day if deadline is today or future
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const deadlineDay = new Date(
    inscriptionDeadline.getFullYear(),
    inscriptionDeadline.getMonth(),
    inscriptionDeadline.getDate()
  );
  const isOpen = Number.isFinite(inscriptionDeadline.getTime()) && deadlineDay >= today;
  const active = typeof event.active === "boolean" ? event.active : event.status === 1;

  const statusName = String(event.statusName ?? (isOpen ? "OPEN" : "CLOSED"));
  const location =
    typeof event.location === "string"
      ? event.location
      : event.location?.name ?? event.location?.venue;
  const locationDetails = (
    event.locationDetails ??
    event.locationDetail ??
    (
      [event.location?.institution, event.location?.address ?? event.location?.city]
        .filter(Boolean)
        .join(" · ")
    )
  ) ||
    undefined;

  const standardizedAwards = Array.isArray(event.prizeConfig?.items)
    ? event.prizeConfig.items.map((item: any) => ({
        title:
          item?.title ??
          (Number(item?.position) === 1
            ? "Top 1"
            : Number(item?.position) === 2
              ? "Top 2"
              : `Top ${item?.position}`),
        description: undefined,
        value: Number(item?.amount ?? 0),
        position: Number(item?.position ?? 0),
        categoryId: undefined,
      }))
    : undefined;

  return {
    id: toPublicNumericId(String(event.id), "event"),
    name: event.name ?? event.title,
    description: event.description,
    startDate: event.startDate,
    endDate: event.endDate,
    inscriptionDeadline: event.inscriptionDeadline,
    accessCode: event.accessCode,
    statusName,
    isPubliclyJoinable: Boolean(event.isPubliclyJoinable ?? event.isPublic),
    evaluationsOpened: Boolean(event.evaluationsOpened ?? statusName === "OPEN"),
    role: String(event.role ?? "USER"),
    active,
    location,
    locationDetails,
    eventType: toEventTypeCode(event.eventType),
    inscriptionCost:
      event.inscriptionCost != null
        ? Number(event.inscriptionCost)
        : event.cost != null
          ? Number(event.cost)
          : undefined,
    inscriptionRequirements:
      event.inscriptionRequirements ?? event.requirements?.description,
    aboutOurAllies: event.aboutOurAllies ?? event.sponsorInfo,
    evaluationType: toEvaluationTypeCode(event.evaluationType),
    minimumTeamSize:
      event.minimumTeamSize != null
        ? Number(event.minimumTeamSize)
        : event.requirements?.teamSize
          ? Number(String(event.requirements.teamSize).split(" ")[0])
          : undefined,
    specificInscriptionDetails:
      event.specificInscriptionDetails ??
      (event.requirements
        ? [
            {
              title: "Tamaño del equipo",
              description: String(event.requirements.teamSize ?? ""),
            },
            {
              title: "Disciplinas requeridas",
              description: Array.isArray(event.requirements.disciplines)
                ? event.requirements.disciplines.join(", ")
                : "",
            },
          ].filter((item) => item.description)
        : undefined),
    categories: event.categories,
    organizers:
      event.organizers ??
      (event.organization ? [event.organization] : undefined),
    collaborators:
      event.collaborators ??
      (event.company ? [event.company] : undefined),
    awards:
      event.awards ??
      standardizedAwards,
    status: event.status,
    createdAt: Number(event.createdAt ?? Date.now()),
    updatedAt: Number(event.updatedAt ?? event.createdAt ?? Date.now()),
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
  http.get(`${env.API_URL}/events/public`, async ({ request }) => {
    await networkDelay();

    try {
      const url = new URL(request.url);
      const page = Number(url.searchParams.get("page") || 1);
      const validPage = validatePage(page);

      const publicEvents = db.event.findMany({
        where: {
          isPubliclyJoinable: {
            equals: true,
          },
        },
      });

      const total = publicEvents.length;
      const pagination = calculatePagination(total, validPage);
      const startIndex = PAGE_SIZE * (pagination.page - 1);
      const endIndex = startIndex + PAGE_SIZE;

      const events = publicEvents
        .slice(startIndex, endIndex)
        .map((event) => mapEventToPublicDTO(event));

      return HttpResponse.json({
        events,
        meta: {
          total,
          itemsOnCurrentPage: events.length,
          itemsPerPage: PAGE_SIZE,
          currentPage: pagination.page,
          totalPages: pagination.totalPages,
        },
      });
    } catch (error: any) {
      return HttpResponse.json(
        { message: error?.message || "Server Error" },
        { status: 500 }
      );
    }
  }),

  http.get(`${env.API_URL}/events/public/past`, async ({ request }) => {
    await networkDelay();

    try {
      const url = new URL(request.url);
      const page = Number(url.searchParams.get("page") || 1);
      const validPage = validatePage(page);

      const pastEvents = db.event.findMany({
        where: {
          isPubliclyJoinable: {
            equals: true,
          },
        },
      });

      const total = pastEvents.length;
      const pagination = calculatePagination(total, validPage);
      const startIndex = PAGE_SIZE * (pagination.page - 1);
      const endIndex = startIndex + PAGE_SIZE;

      const events = pastEvents
        .slice(startIndex, endIndex)
        .map((event) => mapEventToPublicDTO(event));

      return HttpResponse.json({
        events,
        meta: {
          total,
          itemsOnCurrentPage: events.length,
          itemsPerPage: PAGE_SIZE,
          currentPage: pagination.page,
          totalPages: pagination.totalPages,
        },
      });
    } catch (error: any) {
      return HttpResponse.json(
        { message: error?.message || "Server Error" },
        { status: 500 }
      );
    }
  }),

  http.get(`${env.API_URL}/events/public/past/:eventId`, async ({ params }) => {
    await networkDelay();

    try {
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

      if (event.status !== 4) {
        return HttpResponse.json(
          { message: "Event is not a past event" },
          { status: 403 }
        );
      }

      const eventProjects = db.project.findMany({
        where: {
          eventId: {
            equals: event.id,
          },
        },
      });

      const participants = eventProjects
        .flatMap((project) => project.participants ?? [])
        .map((participant: any) => {
          const firstName = participant?.firstName ?? "";
          const lastName = participant?.lastName ?? "";
          return `${firstName} ${lastName}`.trim() || participant?.email || "";
        })
        .filter(Boolean);

      const uniqueParticipants = [...new Set(participants)];

      return HttpResponse.json({
        data: {
          ...mapEventToPublicDTO(event),
          participants: uniqueParticipants,
        },
      });
    } catch (error: any) {
      return HttpResponse.json(
        { message: error?.message || "Server Error" },
        { status: 500 }
      );
    }
  }),

  http.get(`${env.API_URL}/events/public/:eventId`, async ({ params }) => {
    await networkDelay();

    try {
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

      const eventProjects = db.project.findMany({
        where: {
          eventId: {
            equals: event.id,
          },
        },
      });

      const participants = eventProjects
        .flatMap((project) => project.participants ?? [])
        .map((participant: any) => {
          const firstName = participant?.firstName ?? "";
          const lastName = participant?.lastName ?? "";
          return `${firstName} ${lastName}`.trim() || participant?.email || "";
        })
        .filter(Boolean);

      const uniqueParticipants = [...new Set(participants)];

      return HttpResponse.json({
        data: {
          ...mapEventToPublicDTO(event),
          participants: uniqueParticipants,
        },
      });
    } catch (error: any) {
      return HttpResponse.json(
        { message: error?.message || "Server Error" },
        { status: 500 }
      );
    }
  }),

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

  http.get(`${env.API_URL}/events/dropdown`, async ({ cookies }) => {
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

      if (!isValidEventTypeLabel(data.eventType)) {
        return HttpResponse.json(
          {
            message: "Validation Error",
            errors: [
              "eventType should not be empty",
              "eventType must be a string",
            ],
          },
          { status: 400 },
        );
      }

      const normalizedStartDate = addFiveHoursToMockDate(data.startDate) ?? data.startDate;
      const normalizedEndDate = addFiveHoursToMockDate(data.endDate) ?? data.endDate;
      const normalizedInscriptionDeadline =
        addFiveHoursToMockDate(data.inscriptionDeadline ?? data.startDate) ??
        data.inscriptionDeadline ??
        data.startDate;

      const eventData: any = {
        id: getNextEventId(),
        name: data.name,
        description: data.description,
        startDate: normalizedStartDate,
        endDate: normalizedEndDate,
        inscriptionDeadline: normalizedInscriptionDeadline,
        accessCode: `EVT${Date.now().toString().slice(-6)}`,
        isPubliclyJoinable: data.isPubliclyJoinable ?? true,
        active: data.active ?? true,
        evaluationsOpened:
          data.evaluationsOpened ?? (data.evaluationsOpened === true),
        location: data.location,
        locationDetails: data.locationDetails,
        eventType: toEventTypeCode(data.eventType) as any,
        evaluationType:
          data.evaluationType === undefined
            ? undefined
            : (toEvaluationTypeCode(data.evaluationType) as any),
        inscriptionRequirements: data.inscriptionRequirements,
        inscriptionCost: data.inscriptionCost,
        minimumTeamSize: data.minimumTeamSize,
        specificInscriptionDetails: data.specificInscriptionDetails || [],
        aboutOurAllies: data.aboutOurAllies,
        organizers: data.organizers || [],
        collaborators: data.collaborators || [],
        awards: data.awards || [],
      };

      const event = db.event.create(eventData as any);

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

      if (hasField("eventType") && !isValidEventTypeLabel(data.eventType)) {
        return HttpResponse.json(
          {
            message: "Validation Error",
            errors: [
              "eventType should not be empty",
              "eventType must be a string",
            ],
          },
          { status: 400 },
        );
      }

      const normalizedStartDate = hasField("startDate")
        ? addFiveHoursToMockDate(data.startDate)
        : undefined;
      const normalizedEndDate = hasField("endDate")
        ? addFiveHoursToMockDate(data.endDate)
        : undefined;
      const normalizedInscriptionDeadline = hasField("inscriptionDeadline")
        ? addFiveHoursToMockDate(data.inscriptionDeadline)
        : undefined;

      // requireAdmin(user);
      const updateData: any = {
        ...(hasField("name") && { name: data.name }),
        ...(hasField("description") && { description: data.description }),
        ...(hasField("startDate") && { startDate: normalizedStartDate ?? data.startDate }),
        ...(hasField("endDate") && { endDate: normalizedEndDate ?? data.endDate }),
        ...(hasField("inscriptionDeadline") && {
          inscriptionDeadline: normalizedInscriptionDeadline ?? data.inscriptionDeadline,
        }),
        ...(hasField("active") && { active: data.active }),
        ...(hasField("isPubliclyJoinable") && {
          isPubliclyJoinable: data.isPubliclyJoinable,
        }),

        ...(hasField("evaluationsOpened") && {
          evaluationsOpened: data.evaluationsOpened,
        }),

        ...(hasField("location") && { location: data.location }),
        ...(hasField("locationDetails") && {
          locationDetails: data.locationDetails,
        }),
        ...(hasField("eventType") && { eventType: toEventTypeCode(data.eventType) as any }),
        ...(hasField("evaluationType") && {
          evaluationType:
            data.evaluationType === undefined
              ? undefined
              : (toEvaluationTypeCode(data.evaluationType) as any),
        }),
        ...(hasField("inscriptionRequirements") && {
          inscriptionRequirements: data.inscriptionRequirements,
        }),
        ...(hasField("inscriptionCost") && {
          inscriptionCost: data.inscriptionCost,
        }),
        ...(hasField("minimumTeamSize") && { minimumTeamSize: data.minimumTeamSize }),
        ...(hasField("specificInscriptionDetails") && {
          specificInscriptionDetails: data.specificInscriptionDetails,
        }),
        ...(hasField("aboutOurAllies") && { aboutOurAllies: data.aboutOurAllies }),
        ...(hasField("organizers") && { organizers: data.organizers }),
        ...(hasField("collaborators") && { collaborators: data.collaborators }),
        ...(hasField("awards") && { awards: data.awards }),
      };

      const event = db.event.update({
        where: {
          id: {
            equals: eventId,
          },
        },
        data: updateData as any,
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
