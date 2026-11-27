import type { AwardWinner, CategoryAward } from "@/features/awards/types";

import { HttpResponse, http } from "msw";

import { networkDelay, requireAuth } from "../utils";

/** Premios por categoría y sus ganadores (/events/category-awards, /events/award-winners) */
let awards: CategoryAward[] = [];
let winners: AwardWinner[] = [];
let nextAwardId = 1;
let nextWinnerId = 1;

export const resetAwardsMockState = () => {
  awards = [];
  winners = [];
  nextAwardId = 1;
  nextWinnerId = 1;
};

/** Siembra premios y ganadores para un test o para el mock server */
export const seedAwardsMockState = (seed: {
  awards?: CategoryAward[];
  winners?: AwardWinner[];
}) => {
  awards = [...(seed.awards ?? [])];
  winners = [...(seed.winners ?? [])];
  nextAwardId = Math.max(0, ...awards.map((award) => award.id)) + 1;
  nextWinnerId = Math.max(0, ...winners.map((winner) => winner.id)) + 1;
};

const meta = (total: number, page: number, limit: number) => ({
  total,
  page,
  limit,
  totalPages: Math.max(1, Math.ceil(total / limit)),
});

const unauthorized = () =>
  HttpResponse.json({ message: "Unauthorized" }, { status: 401 });

const notFound = (entity: string, id: number) =>
  HttpResponse.json({ message: `${entity} ${id} not found` }, { status: 404 });

const now = () => new Date().toISOString();

export const awardsHandlers = [
  http.get(`*/events/category-awards`, async ({ request, cookies }) => {
    await networkDelay();
    if (requireAuth(cookies).error) return unauthorized();
    const url = new URL(request.url);
    const categoryId = Number(url.searchParams.get("categoryId")) || undefined;
    const page = Number(url.searchParams.get("page")) || 1;
    const limit = Number(url.searchParams.get("limit")) || 10;
    const filtered = awards
      .filter((award) => !categoryId || award.categoryId === categoryId)
      .sort(
        (left, right) => left.position - right.position || left.id - right.id,
      );

    return HttpResponse.json({
      awards: filtered.slice((page - 1) * limit, page * limit),
      meta: meta(filtered.length, page, limit),
    });
  }),

  http.post(`*/events/category-awards`, async ({ request, cookies }) => {
    await networkDelay();
    if (requireAuth(cookies).error) return unauthorized();
    const body = (await request.json()) as Partial<CategoryAward>;

    if (!body.categoryId || typeof body.title !== "string") {
      return HttpResponse.json({ message: "Datos inválidos" }, { status: 400 });
    }
    const award: CategoryAward = {
      id: nextAwardId++,
      categoryId: body.categoryId,
      title: body.title,
      description: body.description ?? "",
      value: body.value ?? 0,
      position: body.position ?? 0,
      createdAt: now(),
      updatedAt: now(),
    };

    awards.push(award);

    return HttpResponse.json({ award });
  }),

  http.patch(
    `*/events/category-awards/:id`,
    async ({ params, request, cookies }) => {
      await networkDelay();
      if (requireAuth(cookies).error) return unauthorized();
      const id = Number(params.id);
      const body = (await request.json()) as Partial<CategoryAward>;

      // UpdateCategoryAwardDTO exige `id` también en el cuerpo
      if (body.id !== id) {
        return HttpResponse.json(
          { message: ["id must be an integer number"] },
          { status: 400 },
        );
      }
      const index = awards.findIndex((award) => award.id === id);

      if (index < 0) return notFound("CategoryAward", id);
      const current = awards[index];

      awards[index] = {
        ...current,
        title: body.title || current.title,
        description: body.description ?? current.description,
        value: body.value ?? current.value,
        position: body.position ?? current.position,
        updatedAt: now(),
      };

      return HttpResponse.json({ award: awards[index] });
    },
  ),

  http.delete(`*/events/category-awards/:id`, async ({ params, cookies }) => {
    await networkDelay();
    if (requireAuth(cookies).error) return unauthorized();
    const id = Number(params.id);

    if (!awards.some((award) => award.id === id))
      return notFound("CategoryAward", id);
    // Sin borrado en cascada: la llave foránea de award_winners lo impide
    if (winners.some((winner) => winner.awardId === id)) {
      return HttpResponse.json(
        { message: "El premio tiene ganadores asignados" },
        { status: 500 },
      );
    }
    awards = awards.filter((award) => award.id !== id);

    return HttpResponse.json({ ok: true });
  }),

  http.get(`*/events/award-winners`, async ({ request, cookies }) => {
    await networkDelay();
    if (requireAuth(cookies).error) return unauthorized();
    const url = new URL(request.url);
    const awardId = Number(url.searchParams.get("awardId")) || undefined;
    const page = Number(url.searchParams.get("page")) || 1;
    const limit = Number(url.searchParams.get("limit")) || 10;
    const filtered = winners
      .filter((winner) => !awardId || winner.awardId === awardId)
      .sort((left, right) => right.grade - left.grade || left.id - right.id);

    return HttpResponse.json({
      winners: filtered.slice((page - 1) * limit, page * limit),
      meta: meta(filtered.length, page, limit),
    });
  }),

  http.post(`*/events/award-winners`, async ({ request, cookies }) => {
    await networkDelay();
    const { error, user } = requireAuth(cookies);

    if (error) return unauthorized();
    const body = (await request.json()) as Partial<AwardWinner>;

    if (!body.awardId || !body.projectId || typeof body.grade !== "number") {
      return HttpResponse.json({ message: "Datos inválidos" }, { status: 400 });
    }
    const winner: AwardWinner = {
      id: nextWinnerId++,
      awardId: body.awardId,
      projectId: body.projectId,
      grade: body.grade,
      createdAt: now(),
      assignedByUserId: Number(user?.id) || 1,
    };

    winners.push(winner);

    return HttpResponse.json({ winner });
  }),

  http.delete(`*/events/award-winners/:id`, async ({ params, cookies }) => {
    await networkDelay();
    if (requireAuth(cookies).error) return unauthorized();
    const id = Number(params.id);

    if (!winners.some((winner) => winner.id === id))
      return notFound("AwardWinner", id);
    winners = winners.filter((winner) => winner.id !== id);

    return HttpResponse.json({ ok: true });
  }),

  // Diploma of a winner (admin): only projects with an award; the mock has no
  // published-results flag, so every winner gets its PDF
  http.get(
    `*/events/:eventId/projects/:projectId/diploma`,
    async ({ params, cookies }) => {
      await networkDelay();
      if (requireAuth(cookies).error) return unauthorized();
      const projectId = Number(params.projectId);

      if (!winners.some((winner) => winner.projectId === projectId)) {
        return HttpResponse.json(
          {
            message:
              "El proyecto no tiene premios en este evento, así que no tiene diploma",
          },
          { status: 404 },
        );
      }

      return new HttpResponse(new Blob(["%PDF-1.3"]), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="diploma_proyecto_${projectId}.pdf"`,
        },
      });
    },
  ),

  // Diplomas of every winner of the event in one PDF (admin)
  http.get(`*/events/:eventId/diplomas`, async ({ params, cookies }) => {
    await networkDelay();
    if (requireAuth(cookies).error) return unauthorized();
    if (winners.length === 0) {
      return HttpResponse.json(
        {
          message:
            "El evento no tiene proyectos ganadores, así que no tiene diplomas",
        },
        { status: 404 },
      );
    }

    return new HttpResponse(new Blob(["%PDF-1.3"]), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="diplomas_evento_${params.eventId}.pdf"`,
      },
    });
  }),
];
