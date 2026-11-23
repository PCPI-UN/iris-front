import { isTutorInvitation } from "../invitations";

describe("isTutorInvitation", () => {
  test("recognises the PROJECT_TUTOR type", () => {
    expect(
      isTutorInvitation({ targetType: "PROJECT_TUTOR", event: null }),
    ).toBe(true);
  });

  test("recognises a tutor invitation the gateway returns without type or event", () => {
    expect(
      isTutorInvitation({
        targetType: null,
        event: null,
        roles: [{ name: "Tutor" }],
      }),
    ).toBe(true);
  });

  test("an event invitation is not a tutor one", () => {
    expect(
      isTutorInvitation({
        targetType: "EVENT",
        event: { id: 1 },
        roles: [{ name: "Juror" }],
      }),
    ).toBe(false);
  });
});
