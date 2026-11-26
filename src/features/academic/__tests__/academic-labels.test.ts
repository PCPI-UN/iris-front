import type { RegistrationStudent } from "../types";

import {
  describeStudents,
  studentName,
  toReviewState,
} from "../utils/academic-labels";

const student = (
  status: RegistrationStudent["status"],
  extra: Partial<RegistrationStudent> = {},
): RegistrationStudent => ({
  status,
  userId: null,
  firstName: null,
  lastName: null,
  email: null,
  studentCode: "000451203",
  semester: null,
  career: null,
  ...extra,
});

describe("academic labels", () => {
  it("counts the students that are not confirmed as pending", () => {
    expect(
      describeStudents([
        student("CONFIRMED"),
        student("INVITED"),
        student("PENDING"),
      ]),
    ).toBe("3 estudiantes · 2 pendientes");
    expect(describeStudents([student("CONFIRMED")])).toBe("1 estudiante");
  });

  it("names a student by the code when the name was not captured", () => {
    expect(studentName(student("PENDING"))).toBe("Código 000451203");
    expect(
      studentName(student("CONFIRMED", { firstName: "Ana", lastName: "Ruiz" })),
    ).toBe("Ana Ruiz");
  });

  it("reads the review state by name or by proto number", () => {
    expect(toReviewState("REQUEST_CHANGES")).toBe("REQUEST_CHANGES");
    expect(toReviewState(2)).toBe("APPROVED");
    expect(toReviewState("PROJECT_STATE_UNSPECIFIED")).toBe("UNDER_REVIEW");
  });
});
