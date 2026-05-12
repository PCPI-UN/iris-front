import { HttpResponse, http } from "msw";

import { env } from "@/config/env";

import { db, persistDb } from "../db";
import { networkDelay } from "../utils";

type CourseBody = {
  id?: number;
  code: string;
  description?: string;
  eventId?: number;
  active?: boolean;
};

const PAGE_SIZE = 10;

const toPublicNumericId = (value: string, prefix: string): number => {
  const match = value.match(new RegExp(`^${prefix}-(\\d+)$`));
  if (match) return Number(match[1]);
  const numeric = Number(value);
  return Number.isNaN(numeric) ? 0 : numeric;
};

const toInternalPrefixedId = (value: string | number, prefix: string): string => {
  const raw = String(value);
  if (raw.startsWith(`${prefix}-`)) return raw;
  if (/^\d+$/.test(raw)) return `${prefix}-${raw.padStart(3, "0")}`;
  return raw;
};

const getNextCourseId = (): string => {
  const maxNumericId = db.course
    .getAll()
    .map((course) => toPublicNumericId(String(course.id), "course"))
    .reduce((max, current) => (current > max ? current : max), 0);

  return `course-${String(maxNumericId + 1).padStart(3, "0")}`;
};

const mapCourseToDTO = (course: any) => {
  const event = db.event.findFirst({ where: { id: { equals: course.eventId } } });

  return {
    id: toPublicNumericId(String(course.id), "course"),
    code: course.code,
    description: course.description,
    eventId: toPublicNumericId(String(course.eventId), "event"),
    event: event
      ? {
          id: toPublicNumericId(String(event.id), "event"),
          title: event.name,
        }
      : null,
    active: course.active,
  };
};

const getPaginatedCourses = ({
  page,
  eventId,
}: {
  page: number;
  eventId?: string;
}) => {
  let allCourses = db.course.getAll();

  if (eventId) {
    allCourses = allCourses.filter((course) => String(course.eventId) === String(eventId));
  }

  const total = allCourses.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.max(1, page);

  const paginated = allCourses.slice(
    PAGE_SIZE * (currentPage - 1),
    PAGE_SIZE * currentPage,
  );

  return {
    items: paginated.map(mapCourseToDTO),
    page: currentPage,
    total,
    totalPages,
  };
};

const findCourseByAnyId = (id: string | number) => {
  const internalCourseId = toInternalPrefixedId(id, "course");
  return db.course.findFirst({
    where: {
      id: { equals: internalCourseId },
    },
  });
};

const createCourseInternal = async (payload: CourseBody) => {
  const eventId = payload.eventId;
  if (!eventId) {
    return HttpResponse.json({ message: "eventId is required" }, { status: 400 });
  }

  const internalEventId = toInternalPrefixedId(eventId, "event");

  const event = db.event.findFirst({
    where: { id: { equals: internalEventId } },
  });

  if (!event) {
    return HttpResponse.json({ message: "Event not found" }, { status: 404 });
  }

  const existingCourse = db.course.findFirst({
    where: {
      code: { equals: payload.code },
      eventId: { equals: internalEventId },
    },
  });

  if (existingCourse) {
    return HttpResponse.json(
      { message: "Course code already exists for this event" },
      { status: 400 },
    );
  }

  const course = db.course.create({
    id: getNextCourseId(),
    code: payload.code,
    description: payload.description || "",
    eventId: internalEventId,
    active: payload.active ?? true,
  });

  await persistDb("course");

  return HttpResponse.json({ data: mapCourseToDTO(course) });
};

const updateCourseInternal = async (payload: CourseBody) => {
  if (!payload.id) {
    return HttpResponse.json({ message: "id is required" }, { status: 400 });
  }

  const internalCourseId = toInternalPrefixedId(payload.id, "course");
  const existingCourse = db.course.findFirst({
    where: { id: { equals: internalCourseId } },
  });

  if (!existingCourse) {
    return HttpResponse.json({ message: "Course not found" }, { status: 404 });
  }

  let internalEventId: string | undefined;
  if (payload.eventId !== undefined) {
    internalEventId = toInternalPrefixedId(payload.eventId, "event");
    const event = db.event.findFirst({ where: { id: { equals: internalEventId } } });
    if (!event) {
      return HttpResponse.json({ message: "Event not found" }, { status: 404 });
    }
  }

  if (payload.code && payload.code !== existingCourse.code) {
    const eventIdToCheck = internalEventId || existingCourse.eventId;
    const duplicateCourse = db.course.findFirst({
      where: {
        code: { equals: payload.code },
        eventId: { equals: eventIdToCheck },
      },
    });

    if (duplicateCourse && duplicateCourse.id !== existingCourse.id) {
      return HttpResponse.json(
        { message: "Course code already exists for this event" },
        { status: 400 },
      );
    }
  }

  const updated = db.course.update({
    where: { id: { equals: internalCourseId } },
    data: {
      ...(payload.code && { code: payload.code }),
      ...(payload.description !== undefined && { description: payload.description }),
      ...(internalEventId && { eventId: internalEventId }),
      ...(payload.active !== undefined && { active: payload.active }),
    },
  });

  await persistDb("course");

  return HttpResponse.json({ data: mapCourseToDTO(updated) });
};

const deleteCourseInternal = async (id: string | number) => {
  const internalCourseId = toInternalPrefixedId(id, "course");

  const existing = db.course.findFirst({
    where: { id: { equals: internalCourseId } },
  });

  if (!existing) {
    return HttpResponse.json({ message: "Course not found" }, { status: 404 });
  }

  const deleted = db.course.delete({
    where: { id: { equals: internalCourseId } },
  });

  await persistDb("course");

  return HttpResponse.json({ data: mapCourseToDTO(deleted) });
};

export const coursesHandlers = [
  // Legacy route (kept for compatibility)
  http.get(`${env.API_URL}/courses`, async ({ request }) => {
    await networkDelay();

    try {
      const url = new URL(request.url);
      const page = Number(url.searchParams.get("page") || 1);
      const eventIdParam = url.searchParams.get("eventId");
      const internalEventId = eventIdParam
        ? toInternalPrefixedId(eventIdParam, "event")
        : undefined;

      const result = getPaginatedCourses({ page, eventId: internalEventId });

      return HttpResponse.json({
        data: result.items,
        meta: { page: result.page, total: result.total, totalPages: result.totalPages },
      });
    } catch (error: any) {
      return HttpResponse.json(
        { message: error?.message || "Server Error" },
        { status: 500 },
      );
    }
  }),

  // Current app contract: list all
  http.get(`${env.API_URL}/events/courses/all`, async ({ request }) => {
    await networkDelay();

    try {
      const url = new URL(request.url);
      const page = Number(url.searchParams.get("page") || 1);
      const eventIdParam = url.searchParams.get("eventId");
      const internalEventId = eventIdParam
        ? toInternalPrefixedId(eventIdParam, "event")
        : undefined;

      const result = getPaginatedCourses({ page, eventId: internalEventId });

      return HttpResponse.json({
        courses: result.items,
        nextPageToken: result.page < result.totalPages ? String(result.page + 1) : undefined,
      });
    } catch (error: any) {
      return HttpResponse.json(
        { message: error?.message || "Server Error" },
        { status: 500 },
      );
    }
  }),

  // Legacy route (kept for compatibility)
  http.get(`${env.API_URL}/courses/:courseId`, async ({ params }) => {
    await networkDelay();

    try {
      const course = findCourseByAnyId(String(params.courseId));

      if (!course) {
        return HttpResponse.json({ message: "Course not found" }, { status: 404 });
      }

      return HttpResponse.json({ data: mapCourseToDTO(course) });
    } catch (error: any) {
      return HttpResponse.json(
        { message: error?.message || "Server Error" },
        { status: 500 },
      );
    }
  }),

  // Current app contract: get by ID
  http.get(`${env.API_URL}/events/courses/:courseId`, async ({ params }) => {
    await networkDelay();

    try {
      const course = findCourseByAnyId(String(params.courseId));

      if (!course) {
        return HttpResponse.json({ message: "Course not found" }, { status: 404 });
      }

      return HttpResponse.json({ course: mapCourseToDTO(course) });
    } catch (error: any) {
      return HttpResponse.json(
        { message: error?.message || "Server Error" },
        { status: 500 },
      );
    }
  }),

  // Legacy route (kept for compatibility)
  http.post(`${env.API_URL}/courses`, async ({ request }) => {
    await networkDelay();

    try {
      const payload = (await request.json()) as CourseBody;
      return createCourseInternal(payload);
    } catch (error: any) {
      return HttpResponse.json(
        { message: error?.message || "Server Error" },
        { status: 500 },
      );
    }
  }),

  // Current app contract: create
  http.post(`${env.API_URL}/events/courses`, async ({ request }) => {
    await networkDelay();

    try {
      const payload = (await request.json()) as CourseBody;
      return createCourseInternal(payload);
    } catch (error: any) {
      return HttpResponse.json(
        { message: error?.message || "Server Error" },
        { status: 500 },
      );
    }
  }),

  // Legacy route (kept for compatibility)
  http.patch(`${env.API_URL}/courses/:courseId`, async ({ params, request }) => {
    await networkDelay();

    try {
      const courseId = toPublicNumericId(String(params.courseId), "course");
      const payload = (await request.json()) as CourseBody;
      return updateCourseInternal({ ...payload, id: courseId });
    } catch (error: any) {
      return HttpResponse.json(
        { message: error?.message || "Server Error" },
        { status: 500 },
      );
    }
  }),

  // Current app contract: update
  http.patch(`${env.API_URL}/events/courses/:id`, async ({ params, request }) => {
    await networkDelay();

    try {
      const courseId = toPublicNumericId(String(params.id), "course");
      const payload = (await request.json()) as CourseBody;
      return updateCourseInternal({ ...payload, id: courseId });
    } catch (error: any) {
      return HttpResponse.json(
        { message: error?.message || "Server Error" },
        { status: 500 },
      );
    }
  }),

  // Legacy route (kept for compatibility)
  http.delete(`${env.API_URL}/courses/:courseId`, async ({ params }) => {
    await networkDelay();

    try {
      return deleteCourseInternal(String(params.courseId));
    } catch (error: any) {
      return HttpResponse.json(
        { message: error?.message || "Server Error" },
        { status: 500 },
      );
    }
  }),

  // Current app contract: delete
  http.delete(`${env.API_URL}/events/courses/:id`, async ({ params }) => {
    await networkDelay();

    try {
      return deleteCourseInternal(String(params.id));
    } catch (error: any) {
      return HttpResponse.json(
        { message: error?.message || "Server Error" },
        { status: 500 },
      );
    }
  }),

  // Legacy route (kept for compatibility)
  http.get(`${env.API_URL}/courses/by-event/:eventId`, async ({ params, request }) => {
    await networkDelay();

    try {
      const page = Number(new URL(request.url).searchParams.get("page") || 1);
      const internalEventId = toInternalPrefixedId(String(params.eventId), "event");

      const event = db.event.findFirst({ where: { id: { equals: internalEventId } } });
      if (!event) {
        return HttpResponse.json({ message: "Event not found" }, { status: 404 });
      }

      const result = getPaginatedCourses({ page, eventId: internalEventId });

      return HttpResponse.json({
        data: result.items,
        meta: { page: result.page, total: result.total, totalPages: result.totalPages },
      });
    } catch (error: any) {
      return HttpResponse.json(
        { message: error?.message || "Server Error" },
        { status: 500 },
      );
    }
  }),

  // Current app contract: dropdown/list by event
  http.get(`${env.API_URL}/events/courses/event/:eventId`, async ({ params, request }) => {
    await networkDelay();

    try {
      const page = Number(new URL(request.url).searchParams.get("page") || 1);
      const internalEventId = toInternalPrefixedId(String(params.eventId), "event");

      const event = db.event.findFirst({ where: { id: { equals: internalEventId } } });
      if (!event) {
        return HttpResponse.json({ message: "Event not found" }, { status: 404 });
      }

      const result = getPaginatedCourses({ page, eventId: internalEventId });

      return HttpResponse.json({
        courses: result.items,
        nextPageToken: result.page < result.totalPages ? String(result.page + 1) : undefined,
      });
    } catch (error: any) {
      return HttpResponse.json(
        { message: error?.message || "Server Error" },
        { status: 500 },
      );
    }
  }),

  // Legacy route used by some selects
  http.get(`${env.API_URL}/courses-dropdown`, async ({ request }) => {
    await networkDelay();

    try {
      const url = new URL(request.url);
      const eventIdParam = url.searchParams.get("eventId");
      const internalEventId = eventIdParam
        ? toInternalPrefixedId(eventIdParam, "event")
        : undefined;

      let courses = db.course.findMany({});
      if (internalEventId) {
        courses = courses.filter((course) => String(course.eventId) === String(internalEventId));
      }

      const result = courses
        .filter((course) => course.active)
        .map((course) => ({
          id: toPublicNumericId(String(course.id), "course"),
          code: course.code,
          description: course.description,
        }));

      return HttpResponse.json({ data: result });
    } catch (error: any) {
      return HttpResponse.json(
        { message: error?.message || "Server Error" },
        { status: 500 },
      );
    }
  }),
];
