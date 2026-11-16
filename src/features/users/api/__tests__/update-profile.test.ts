import { ApiError } from "@/lib/api-client";

import {
  createUpdateProfileInputSchema,
  getChangedProfileFields,
  getUpdateProfileErrorMessage,
} from "../update-profile";

const profile = { firstName: "Laura", lastName: "Gómez", phone: "3001234567" };

describe("createUpdateProfileInputSchema", () => {
  const schema = createUpdateProfileInputSchema(profile.phone);

  test("trims values and strips spaces and dashes from the phone", () => {
    expect(
      schema.parse({
        firstName: "  Ana  ",
        lastName: " Ruiz ",
        phone: "300 123-4567",
      }),
    ).toEqual({ firstName: "Ana", lastName: "Ruiz", phone: "3001234567" });
  });

  test.each([
    ["", "El nombre es obligatorio"],
    ["   ", "El nombre es obligatorio"],
    ["A", "El nombre debe tener al menos 2 caracteres"],
    ["a".repeat(101), "El nombre no puede superar 100 caracteres"],
  ])("rejects first name %j", (firstName, message) => {
    const result = schema.safeParse({ ...profile, firstName });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe(message);
  });

  test("allows an empty last name", () => {
    expect(schema.safeParse({ ...profile, lastName: "" }).success).toBe(true);
  });

  test.each(["123", "30012345678", "1234567890", "300abc4567"])(
    "rejects phone %j",
    (phone) => {
      const result = schema.safeParse({ ...profile, phone });
      expect(result.error?.issues[0].message).toMatch(/10 dígitos/);
    },
  );

  test.each(["3001234567", "6015551234"])("accepts phone %j", (phone) => {
    expect(schema.safeParse({ ...profile, phone }).success).toBe(true);
  });

  test("does not allow clearing an existing phone", () => {
    const result = schema.safeParse({ ...profile, phone: "" });
    expect(result.error?.issues[0].message).toBe(
      "El teléfono no se puede dejar vacío",
    );
  });

  test("allows an empty phone when the user never had one", () => {
    const noPhone = createUpdateProfileInputSchema("");
    expect(noPhone.safeParse({ ...profile, phone: "" }).success).toBe(true);
  });
});

describe("getChangedProfileFields", () => {
  test("returns only the fields that changed", () => {
    expect(
      getChangedProfileFields({ ...profile, phone: "3109876543" }, profile),
    ).toEqual({ phone: "3109876543" });
  });

  test("returns nothing when the values are the same", () => {
    expect(getChangedProfileFields(profile, profile)).toEqual({});
  });

  test("never sends an untouched empty phone", () => {
    expect(
      getChangedProfileFields(
        { ...profile, firstName: "Ana", phone: "" },
        { ...profile, phone: "" },
      ),
    ).toEqual({ firstName: "Ana" });
  });
});

describe("getUpdateProfileErrorMessage", () => {
  test.each([
    [400, /no son válidos/],
    [403, /no está activa/],
    [409, /teléfono ya está registrado/],
    [500, /No pudimos guardar/],
  ])("maps HTTP %i to a clear message", (status, message) => {
    expect(getUpdateProfileErrorMessage(new ApiError("x", status))).toMatch(
      message,
    );
  });

  test("uses a generic message for network errors", () => {
    expect(getUpdateProfileErrorMessage(new TypeError("fetch failed"))).toMatch(
      /No pudimos guardar/,
    );
  });
});
