import {
  awardToDraft,
  emptyAwardDraft,
  getNextAwardPosition,
  parseAwardForm,
} from "../award-form";

const draft = (
  overrides: Partial<ReturnType<typeof emptyAwardDraft>> = {},
) => ({
  ...emptyAwardDraft(1),
  title: "Primer puesto",
  ...overrides,
});

test("parses a valid award, with the value in pesos", () => {
  expect(
    parseAwardForm(
      draft({ description: "  Beca  ", value: "$3.000.000", position: "2" }),
    ),
  ).toEqual({
    values: {
      title: "Primer puesto",
      description: "Beca",
      value: 3000000,
      position: 2,
    },
  });
});

test("accepts whole pesos with or without thousands separators", () => {
  for (const value of ["3000000", "3.000.000", "3,000,000", "$3 000 000"]) {
    expect(parseAwardForm(draft({ value })).values?.value).toBe(3000000);
  }
  expect(parseAwardForm(draft({ value: "$ 500" })).values?.value).toBe(500);
});

test("rejects decimals instead of reading them as a bigger amount", () => {
  for (const value of ["12,5", "1.500,50", "1500.50", "1,50", "1.000,000"]) {
    expect(parseAwardForm(draft({ value })).errors?.value).toBe(
      "El valor debe ser un monto en pesos, sin decimales",
    );
  }
});

test("an empty value means the award has no monetary value", () => {
  expect(parseAwardForm(draft({ value: "  " })).values?.value).toBeUndefined();
});

test("reports the message of each invalid field", () => {
  expect(
    parseAwardForm(draft({ title: "   ", value: "12,5x", position: "0" }))
      .errors,
  ).toEqual({
    title: "El nombre del premio es obligatorio",
    value: "El valor debe ser un monto en pesos, sin decimales",
    position: "La posición debe ser un número entero mayor o igual a 1",
  });
  expect(parseAwardForm(draft({ position: "1.5" })).errors?.position).toMatch(
    /entero/,
  );
  expect(parseAwardForm(draft({ position: "" })).errors?.position).toBe(
    "La posición es obligatoria",
  );
});

test("suggests the position after the last award", () => {
  expect(getNextAwardPosition([])).toBe(1);
  expect(getNextAwardPosition([{ position: 1 }, { position: 3 }])).toBe(4);
});

test("the draft of an award without value leaves the field empty", () => {
  expect(
    awardToDraft({
      id: 1,
      categoryId: 2,
      title: "Mención",
      description: "",
      value: 0,
      position: 3,
    }),
  ).toEqual({ title: "Mención", description: "", value: "", position: "3" });
});
