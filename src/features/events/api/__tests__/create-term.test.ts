import { http, HttpResponse } from "msw";
import { describe, expect, test } from "vitest";

import { createTerm, createTermInputSchema } from "../create-term";

import { server } from "@/testing/mocks/server";

describe("createTermInputSchema", () => {
  test("accepts a year and a two digit period code", () => {
    expect(createTermInputSchema.parse({ year: "2026", period: "10" })).toEqual(
      {
        year: 2026,
        period: "10",
      },
    );
  });

  test.each([["1999"], ["2101"], ["20.5"], [""]])(
    "rejects the year %s",
    (year) => {
      expect(
        createTermInputSchema.safeParse({ year, period: "10" }).success,
      ).toBe(false);
    },
  );

  test.each([["1"], ["100"], ["ab"], [""]])(
    "rejects the period code %s",
    (period) => {
      const result = createTermInputSchema.safeParse({ year: 2026, period });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "El código del periodo debe tener dos dígitos, como 10 o 30",
        );
      }
    },
  );
});

describe("createTerm", () => {
  test("posts the term and returns the created one", async () => {
    let body: unknown;

    server.use(
      http.post("*/api/terms", async ({ request }) => {
        body = await request.json();

        return HttpResponse.json(
          { id: 3, year: 2026, period: "10" },
          { status: 201 },
        );
      }),
    );

    await expect(
      createTerm({ data: { year: 2026, period: "10" } }),
    ).resolves.toEqual({
      id: 3,
      year: 2026,
      period: "10",
    });
    expect(body).toEqual({ year: 2026, period: "10" });
  });

  test("keeps the message of the backend when the term already exists", async () => {
    server.use(
      http.post("*/api/terms", () =>
        HttpResponse.json(
          { statusCode: 409, message: "El periodo 202610 ya existe" },
          { status: 409 },
        ),
      ),
    );

    await expect(
      createTerm({ data: { year: 2026, period: "10" } }),
    ).rejects.toMatchObject({
      status: 409,
      message: "El periodo 202610 ya existe",
    });
  });
});
