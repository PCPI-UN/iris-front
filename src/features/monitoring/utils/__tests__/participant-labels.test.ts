import { participantLabels, userIdsWithoutName } from "../participant-labels";

const enrolledWithoutName = { userId: 9, studentCode: "200099777" };

describe("participant labels", () => {
  test("uses the looked-up name of an enrolled participant the listing sends without it", () => {
    const names = new Map([[9, { firstName: "Laura", lastName: "Gómez" }]]);

    expect(
      participantLabels({ participants: [enrolledWithoutName] }, names),
    ).toEqual(["Laura Gómez"]);
  });

  test("falls back to the student code while the name is not available", () => {
    expect(participantLabels({ participants: [enrolledWithoutName] })).toEqual([
      "Código 200099777",
    ]);
  });

  test("keeps the name the listing already brings and shows the pending participants first", () => {
    expect(
      participantLabels({
        participants: [{ userId: 1, firstName: "Ana", lastName: "Ruiz" }],
      }),
    ).toEqual(["Ana Ruiz"]);
    expect(
      participantLabels({
        participants: [enrolledWithoutName],
        pendingParticipants: [{ firstName: "Pedro", lastName: "Pérez" }],
      }),
    ).toEqual(["Pedro Pérez"]);
  });

  test("asks only for the users without a name, once each", () => {
    expect(
      userIdsWithoutName([
        {
          participants: [enrolledWithoutName, { userId: 2, firstName: "Ana" }],
        },
        { participants: [enrolledWithoutName, { userId: 5 }] },
      ]),
    ).toEqual([9, 5]);
  });
});
