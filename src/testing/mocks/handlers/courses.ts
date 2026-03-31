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

export const coursesHandlers = [
    // Get all courses public (optionally filtered by eventId)
    http.get(`${env.API_URL}/courses`, async ({ request }) => {
        await networkDelay();

        try {
            const url = new URL(request.url);
            const page = Number(url.searchParams.get("page") || 1);
            const filterEventId = url.searchParams.get("eventId");

            // Base dataset (optionally filtered by event)
            let allCourses = db.course.getAll();
            if (filterEventId) {
                allCourses = allCourses.filter((course) => course.eventId === filterEventId);
            }

            const total = allCourses.length;
            const totalPages = Math.ceil(total / 10);

            const paginated = allCourses.slice(10 * (page - 1), 10 * page);

            const courses = paginated.map((course) => {
                const event = db.event.findFirst({
                    where: { id: { equals: course.eventId } },
                });

                return {
                    id: course.id,
                    code: course.code,
                    description: course.description,
                    eventId: course.eventId,
                    event: event ? { id: event.id, title: event.name } : null,
                    active: course.active,
                };
            });

            return HttpResponse.json({
                data: courses,
                meta: { page, total, totalPages },
            });
        } catch (error: any) {
            return HttpResponse.json(
                { message: error?.message || "Server Error" },
                { status: 500 }
            );
        }
    }),

    // Get course public by ID
    http.get(`${env.API_URL}/courses/:courseId`, async ({ params }) => {
        await networkDelay();

        try {
            const courseId = params.courseId as string;
            const course = db.course.findFirst({
                where: { id: { equals: courseId } },
            });

            if (!course) {
                return HttpResponse.json(
                    { message: "Course not found" },
                    { status: 404 }
                );
            }

            const event = db.event.findFirst({
                where: { id: { equals: course.eventId } },
            });

            const result = {
                ...course,
                event: event ? { id: event.id, title: event.name } : null,
            };

            return HttpResponse.json({ data: result });
        } catch (error: any) {
            return HttpResponse.json(
                { message: error?.message || "Server Error" },
                { status: 500 }
            );
        }
    }),

    // Create course public
    http.post(`${env.API_URL}/courses`, async ({ request }) => {
        await networkDelay();

        try {
            const data = (await request.json()) as CourseBody;

            // Validate event exists
            const event = db.event.findFirst({
                where: { id: { equals: data.eventId } },
            });

            if (!event) {
                return HttpResponse.json(
                    { message: "Event not found" },
                    { status: 404 }
                );
            }

            // Check if course code already exists for this event
            const existingCourse = db.course.findFirst({
                where: {
                    code: { equals: data.code },
                    eventId: { equals: data.eventId }
                },
            });

            if (existingCourse) {
                return HttpResponse.json(
                    { message: "Course code already exists for this event" },
                    { status: 400 }
                );
            }

            const course = db.course.create({
                code: data.code,
                description: data.description || "",
                eventId: data.eventId,
                active: true,
            });

            await persistDb("course");

            return HttpResponse.json({
                data: {
                    ...course,
                    event: { id: event.id, title: event.name }
                },
            });
        } catch (error: any) {
            return HttpResponse.json(
                { message: error?.message || "Server Error" },
                { status: 500 }
            );
        }
    }),

    // Update course public
    http.patch(
        `${env.API_URL}/courses/:courseId`,
        async ({ params, request }) => {
            await networkDelay();

            try {
                const courseId = params.courseId as string;
                const data = (await request.json()) as Partial<CourseBody>;

                // Validate course exists
                const existingCourse = db.course.findFirst({
                    where: { id: { equals: courseId } },
                });

                if (!existingCourse) {
                    return HttpResponse.json(
                        { message: "Course not found" },
                        { status: 404 }
                    );
                }

                // If updating eventId, validate event exists
                if (data.eventId) {
                    const event = db.event.findFirst({
                        where: { id: { equals: data.eventId } },
                    });

                    if (!event) {
                        return HttpResponse.json(
                            { message: "Event not found" },
                            { status: 404 }
                        );
                    }
                }

                // If updating code, check for duplicates within the same event
                if (data.code && data.code !== existingCourse.code) {
                    const eventIdToCheck = data.eventId || existingCourse.eventId;
                    const duplicateCourse = db.course.findFirst({
                        where: {
                            code: { equals: data.code },
                            eventId: { equals: eventIdToCheck }
                        },
                    });

                    if (duplicateCourse && duplicateCourse.id !== courseId) {
                        return HttpResponse.json(
                            { message: "Course code already exists for this event" },
                            { status: 400 }
                        );
                    }
                }

                // Update course
                const course = db.course.update({
                    where: { id: { equals: courseId } },
                    data: {
                        ...(data.code && { code: data.code }),
                        ...(data.description !== undefined && { description: data.description }),
                        ...(data.eventId && { eventId: data.eventId }),
                        ...(data.active !== undefined && { active: data.active }),
                    },
                });

                await persistDb("course");

                // Get event info
                const event = course?.eventId ? db.event.findFirst({
                    where: { id: { equals: course.eventId } },
                }) : null;

                return HttpResponse.json({
                    data: {
                        ...course,
                        event: event ? { id: event.id, title: event.name } : null
                    },
                });
            } catch (error: any) {
                return HttpResponse.json(
                    { message: error?.message || "Server Error" },
                    { status: 500 }
                );
            }
        }
    ),

    // Delete course public
    http.delete(`${env.API_URL}/courses/:courseId`, async ({ params }) => {
        await networkDelay();

        try {
            const courseId = params.courseId as string;

            const course = db.course.findFirst({
                where: { id: { equals: courseId } },
            });

            if (!course) {
                return HttpResponse.json(
                    { message: "Course not found" },
                    { status: 404 }
                );
            }

            // Delete the course
            const deletedCourse = db.course.delete({
                where: { id: { equals: courseId } },
            });

            await persistDb("course");

            return HttpResponse.json({ data: deletedCourse });
        } catch (error: any) {
            return HttpResponse.json(
                { message: error?.message || "Server Error" },
                { status: 500 }
            );
        }
    }),

    // Get courses public by event
    http.get(
        `${env.API_URL}/courses/by-event/:eventId`,
        async ({ params, request }) => {
            await networkDelay();

            try {
                const eventId = params.eventId as string;
                const url = new URL(request.url);
                const page = Number(url.searchParams.get("page") || 1);

                // Validate event exists
                const event = db.event.findFirst({
                    where: { id: { equals: eventId } },
                });

                if (!event) {
                    return HttpResponse.json(
                        { message: "Event not found" },
                        { status: 404 }
                    );
                }

                // Get courses for this event
                const allCourses = db.course.findMany({
                    where: { eventId: { equals: eventId } },
                });

                const total = allCourses.length;
                const totalPages = Math.ceil(total / 10);

                const paginatedCourses = allCourses
                    .slice(10 * (page - 1), 10 * page)
                    .map((course) => ({
                        id: course.id,
                        code: course.code,
                        description: course.description,
                        eventId: course.eventId,
                        event: { id: event.id, title: event.name },
                        active: course.active,
                    }));

                return HttpResponse.json({
                    data: paginatedCourses,
                    meta: { page, total, totalPages },
                });
            } catch (error: any) {
                return HttpResponse.json(
                    { message: error?.message || "Server Error" },
                    { status: 500 }
                );
            }
        }
    ),

    // Get courses public dropdown (simplified list for select inputs)
    http.get(`${env.API_URL}/courses-dropdown`, async ({ request }) => {
        await networkDelay();

        try {
            const url = new URL(request.url);
            const eventId = url.searchParams.get("eventId");

            let courses;
            if (eventId) {
                courses = db.course.findMany({
                    where: { eventId: { equals: eventId } },
                });
            } else {
                courses = db.course.findMany({});
            }

            const result = courses
                .filter((course) => course.active)
                .map((course) => ({
                    id: course.id,
                    code: course.code,
                    description: course.description,
                }));

            return HttpResponse.json({ data: result });
        } catch (error: any) {
            return HttpResponse.json(
                { message: error?.message || "Server Error" },
                { status: 500 }
            );
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
  http.patch(`${env.API_URL}/events/courses/update`, async ({ request }) => {
    await networkDelay();

    try {
      const payload = (await request.json()) as CourseBody;
      return updateCourseInternal(payload);
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
  http.delete(`${env.API_URL}/events/courses/delete`, async ({ request }) => {
    await networkDelay();

    try {
      const body = (await request.json()) as { id?: number };
      if (!body?.id) {
        return HttpResponse.json({ message: "id is required" }, { status: 400 });
      }

      return deleteCourseInternal(body.id);
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
