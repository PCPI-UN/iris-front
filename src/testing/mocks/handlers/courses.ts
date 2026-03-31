import { HttpResponse, http } from "msw";

import { env } from "@/config/env";

import { db, persistDb } from "../db";

import {
    networkDelay,
} from "../utils";

type CourseBody = {
    code: string;
    description?: string;
    eventId: string;
    active: boolean;
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
        }
    }),
];