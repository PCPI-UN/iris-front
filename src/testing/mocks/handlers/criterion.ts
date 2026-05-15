import { HttpResponse, http } from "msw";

import { env } from "@/config/env";

import { db, persistDb } from "../db";
import { requireAuth, requireAdmin, networkDelay } from "../utils";

type CriterionBody = {
  eventId: string;
  name: string;
  description?: string;
  weight: number;
  active?: boolean;
  categoryIds?: number[];
  courseIds?: number[];
  componentId?: number | string;
  component?: { id?: number | string; name?: string; weight?: number } | null;
};

export const criterionHandlers = [
  http.get(
    `${env.API_URL}/criterions/course/:courseId`,
    async ({ params, cookies }) => {
      await networkDelay();
      try {
        const { error } = requireAuth(cookies);
        if (error) {
          return HttpResponse.json({ message: error }, { status: 401 });
        }

        const { courseId } = params as { courseId: string };
        if (!courseId) {
          return HttpResponse.json(
            { message: "courseId is required" },
            { status: 400 }
          );
        }

        const items = db.criterion
          .getAll()
          .filter(
            (c: any) =>
              Array.isArray(c.categoryIds ?? c.courseIds) &&
              (c.categoryIds ?? c.courseIds).includes(Number(courseId))
          )
            .map((c: any) => ({
              id: c.id,
              eventId: c.eventId,
              name: c.name,
              description: c.description,
              weight: c.weight,
              active: c.active ?? true,
              categoryIds: c.categoryIds || c.courseIds || [],
              courseIds: c.courseIds || c.categoryIds || [],
              // Optional component references supported by backend
              component_id: c.component_id ?? c.componentId ?? null,
              component_name: c.component_name ?? c.componentName ?? (c.component?.name ?? null),
              component_weight: c.component_weight ?? c.componentWeight ?? (c.component?.weight ?? null),
              component: c.component ?? null,
            }));

        return HttpResponse.json({ criterions: items });
      } catch (error: any) {
        return HttpResponse.json(
          { message: error?.message || "Server Error" },
          { status: 500 }
        );
      }
    }
  ),
  // GET paginado
  http.get(`${env.API_URL}/criterions`, async ({ cookies, request }) => {
    await networkDelay();
    try {
      const { error } = requireAuth(cookies);
      if (error) {
        return HttpResponse.json({ message: error }, { status: 401 });
      }
      const url = new URL(request.url);
      const page = Number(url.searchParams.get("page") || 1);
      const eventId = url.searchParams.get("eventId");
      const categoryId = url.searchParams.get("categoryId") || url.searchParams.get("courseId");
      const categoryIdsRaw = url.searchParams.get("categoryIds") || url.searchParams.get("courseIds");
      const categoryIds = categoryIdsRaw
        ? categoryIdsRaw
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];
      const effectiveCategoryIds =
        categoryIds.length > 0 ? categoryIds : categoryId ? [categoryId] : [];

      let all = db.criterion.getAll();
      if (eventId) {
        all = all.filter((c: any) => String(c.eventId) === String(eventId));
      }
      if (effectiveCategoryIds.length > 0) {
        all = all.filter(
          (c: any) =>
            Array.isArray(c.categoryIds ?? c.courseIds) &&
            (c.categoryIds ?? c.courseIds).some((id: number | string) =>
              effectiveCategoryIds.includes(String(id))
            )
        );
      }
      const total = all.length;
      const totalPages = Math.ceil(total / 10);
      const criteria = all.slice((page - 1) * 10, page * 10).map((c: any) => ({
        id: c.id,
        eventId: c.eventId,
        name: c.name,
        description: c.description,
        weight: c.weight,
        active: c.active ?? true,
        categoryIds: c.categoryIds || c.courseIds || [],
        courseIds: c.courseIds || c.categoryIds || [],
        createdAt: c.createdAt,
        component_id: c.component_id ?? c.componentId ?? null,
        component_name: c.component_name ?? c.componentName ?? (c.component?.name ?? null),
        component_weight: c.component_weight ?? c.componentWeight ?? (c.component?.weight ?? null),
        component: c.component ?? null,
      }));
      return HttpResponse.json({
        criterions: criteria,
        meta: {
          total,
          itemsOnCurrentPage: criteria.length,
          itemsPerPage: 10,
          currentPage: page,
          totalPages,
        },
      });
    } catch (error: any) {
      return HttpResponse.json(
        { message: error?.message || "Server Error" },
        { status: 500 }
      );
    }
  }),

  // GET por id
  http.get(`${env.API_URL}/criterions/:id`, async ({ params, cookies }) => {
    await networkDelay();
    try {
      const { error } = requireAuth(cookies);
      if (error) {
        return HttpResponse.json({ message: error }, { status: 401 });
      }
      const criterionId = params.id as string;
      const criterion = db.criterion.findFirst({
        where: { id: { equals: criterionId } },
      });
      if (!criterion) {
        return HttpResponse.json(
          { message: "Criterion not found" },
          { status: 404 }
        );
      }
      const c = criterion as any;
      return HttpResponse.json({
        id: c.id,
        eventId: c.eventId,
        name: c.name,
        description: c.description,
        weight: c.weight,
        active: c.active ?? true,
        categoryIds: c.categoryIds || c.courseIds || [],
        courseIds: c.courseIds || c.categoryIds || [],
        createdAt: c.createdAt,
        component_id: c.component_id ?? c.componentId ?? null,
        component_name: c.component_name ?? c.componentName ?? (c.component?.name ?? null),
        component_weight: c.component_weight ?? c.componentWeight ?? (c.component?.weight ?? null),
        component: c.component ?? null,
      });
    } catch (error: any) {
      return HttpResponse.json(
        { message: error?.message || "Server Error" },
        { status: 500 }
      );
    }
  }),

  // POST
  http.post(`${env.API_URL}/criterions`, async ({ cookies, request }) => {
    await networkDelay();
    try {
      const { error } = requireAuth(cookies);
      if (error) {
        return HttpResponse.json({ message: error }, { status: 401 });
      }
      const body = await request.json();
      if (
        !body ||
        typeof body !== "object" ||
        !body.eventId ||
        !body.name ||
        typeof body.weight !== "number"
      ) {
        return HttpResponse.json({ message: "Invalid body" }, { status: 400 });
      }
      const criterionBody: CriterionBody = {
        eventId: body.eventId,
        name: body.name,
        description: body.description,
        weight: body.weight,
        active: body.active ?? true,
        categoryIds: Array.isArray(body.categoryIds)
          ? body.categoryIds
          : Array.isArray(body.courseIds)
            ? body.courseIds
            : [],
        courseIds: Array.isArray(body.courseIds)
          ? body.courseIds
          : Array.isArray(body.categoryIds)
            ? body.categoryIds
            : [],
        componentId: body.componentId ?? body.component_id ?? null,
        component: body.component ?? null,
      };
      const created = db.criterion.create(criterionBody);
      await persistDb("criterion");
      return HttpResponse.json({ data: created }, { status: 201 });
    } catch (error: any) {
      return HttpResponse.json(
        { message: error?.message || "Server Error" },
        { status: 500 }
      );
    }
  }),

  // PUT
  http.put(
    `${env.API_URL}/criterions/:id`,
    async ({ cookies, request, params }) => {
      await networkDelay();
      try {
        const { error } = requireAuth(cookies);
        if (error) {
          return HttpResponse.json({ message: error }, { status: 401 });
        }
        const criterionId = params.id as string;
        const data = await request.json();
        if (!data || typeof data !== "object") {
          return HttpResponse.json(
            { message: "Invalid body" },
            { status: 400 }
          );
        }
        // Solo tomar los campos válidos de CriterionBody
        const updateData: Partial<CriterionBody> = {};
        if (typeof data.eventId === "number")
          updateData.eventId = String(data.eventId);
        if (typeof data.name === "string") updateData.name = data.name;
        if (typeof data.description === "string")
          updateData.description = data.description;
        if (typeof data.weight === "number") updateData.weight = data.weight;
        if (typeof data.active === "boolean") updateData.active = data.active;
        if (Array.isArray(data.categoryIds)) {
          updateData.categoryIds = data.categoryIds;
          updateData.courseIds = data.categoryIds;
        }
        if (data.componentId !== undefined) {
          (updateData as any).componentId = data.componentId ?? data.component_id ?? null;
        }
        if (Array.isArray(data.courseIds)) {
          updateData.categoryIds = data.courseIds;
          updateData.courseIds = data.courseIds;
        }
        const criterion = db.criterion.update({
          where: { id: { equals: criterionId } },
          data: updateData,
        });
        if (!criterion) {
          return HttpResponse.json(
            { message: "Criterion not found" },
            { status: 404 }
          );
        }
        await persistDb("criterion");
        return HttpResponse.json({ data: criterion });
      } catch (error: any) {
        return HttpResponse.json(
          { message: error?.message || "Server Error" },
          { status: 500 }
        );
      }
    }
  ),

  // DELETE
  http.delete(`${env.API_URL}/criterions/:id`, async ({ params, cookies }) => {
    await networkDelay();
    try {
      const { error } = requireAuth(cookies);
      if (error) {
        return HttpResponse.json({ message: error }, { status: 401 });
      }
      const criterionId = params.id as string;
      const criterion = db.criterion.delete({
        where: { id: { equals: criterionId } },
      });
      if (!criterion) {
        return HttpResponse.json(
          { message: "Criterion not found" },
          { status: 404 }
        );
      }
      await persistDb("criterion");
      return HttpResponse.json({ data: criterion });
    } catch (error: any) {
      return HttpResponse.json(
        { message: error?.message || "Server Error" },
        { status: 500 }
      );
    }
  }),
];
