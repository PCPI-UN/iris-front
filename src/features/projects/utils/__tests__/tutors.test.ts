import { describe, expect, test } from "vitest";

import {
  isSearchLongEnough,
  pendingTutorSchema,
  toTutorsPayload,
  tutorFullName,
  tutorsValueFromProject,
} from "../tutors";

describe("isSearchLongEnough", () => {
  test("needs 3 letters, not counting spaces", () => {
    expect(isSearchLongEnough("ab")).toBe(false);
    expect(isSearchLongEnough("a b")).toBe(false);
    expect(isSearchLongEnough("  la  ")).toBe(false);
    expect(isSearchLongEnough("lau")).toBe(true);
    expect(isSearchLongEnough("la u")).toBe(true);
  });
});

describe("toTutorsPayload", () => {
  test("sends ids and pending tutors as the backend expects", () => {
    expect(
      toTutorsPayload({
        linked: [{ id: 12, firstName: "Ana", lastName: "Ruiz" }],
        pending: [
          {
            firstName: " Laura ",
            lastName: " Gómez ",
            email: " Laura@Uni.edu ",
          },
        ],
      }),
    ).toEqual({
      userIds: [12],
      pending: [
        { firstName: "Laura", lastName: "Gómez", email: "laura@uni.edu" },
      ],
    });
  });

  test("leaves out an empty last name", () => {
    const payload = toTutorsPayload({
      linked: [],
      pending: [{ firstName: "Laura", lastName: "  ", email: "laura@uni.edu" }],
    });

    expect(payload.pending[0]).not.toHaveProperty("lastName");
  });
});

describe("pendingTutorSchema", () => {
  test("asks for a name and a valid email", () => {
    expect(
      pendingTutorSchema.safeParse({
        firstName: "",
        lastName: "",
        email: "a@b.co",
      }).success,
    ).toBe(false);
    expect(
      pendingTutorSchema.safeParse({
        firstName: "Ana",
        lastName: "",
        email: "no",
      }).success,
    ).toBe(false);
    expect(
      pendingTutorSchema.safeParse({
        firstName: "Ana",
        lastName: "",
        email: "a@b.co",
      }).success,
    ).toBe(true);
  });
});

describe("tutorsValueFromProject", () => {
  test("splits linked and pending tutors of a project", () => {
    expect(
      tutorsValueFromProject([
        { userId: 4, firstName: "Ana", lastName: "Ruiz", pending: false },
        { firstName: "Laura", pending: true, email: "laura@uni.edu" },
      ]),
    ).toEqual({
      linked: [{ id: 4, firstName: "Ana", lastName: "Ruiz" }],
      pending: [{ firstName: "Laura", lastName: "", email: "laura@uni.edu" }],
    });
  });

  test("a project read before tutors existed has none", () => {
    expect(tutorsValueFromProject(undefined)).toEqual({
      linked: [],
      pending: [],
    });
  });
});

test("tutorFullName joins the name without extra spaces", () => {
  expect(tutorFullName({ firstName: "Laura", lastName: undefined })).toBe(
    "Laura",
  );
  expect(tutorFullName({ firstName: "Laura", lastName: "Gómez" })).toBe(
    "Laura Gómez",
  );
});
