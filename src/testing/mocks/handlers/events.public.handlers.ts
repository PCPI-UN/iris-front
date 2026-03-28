import { HttpResponse, http } from "msw";

import { env } from "@/config/env";

import { db } from "../db";
import { networkDelay } from "../utils";
import { mapEventToPublicDTO } from "./events.mapper";
import {
  PAGE_SIZE,
  calculatePagination,
  validatePage,
} from "./events.pagination";

export const eventsPublicHandlers = [
  http.get(`${env.API_URL}/events/public`, async ({ request }) => {
    await networkDelay();

    try {
      const url = new URL(request.url);
      const page = Number(url.searchParams.get("page") || 1);
      const validPage = validatePage(page);

      const publicEvents = db.event.findMany({
        where: {
          isPublic: {
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
        { status: 500 },
      );
    }
  }),

  http.get(`${env.API_URL}/events/public/:eventId`, async ({ params }) => {
    await networkDelay();

    try {
      const eventId = params.eventId as string;

      const event = db.event.findFirst({
        where: {
          id: {
            equals: eventId,
          },
        },
      });

      if (!event) {
        return HttpResponse.json({ message: "Event not found" }, { status: 404 });
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
        event: {
          ...mapEventToPublicDTO(event),
          organization: "Universidad del Norte",
          company: "Universidad del Norte",
          participants: uniqueParticipants,
          awardsInfo:
            "Premiación institucional a los mejores proyectos de cada categoría.",
        },
      });
    } catch (error: any) {
      return HttpResponse.json(
        { message: error?.message || "Server Error" },
        { status: 500 },
      );
    }
  }),
];
