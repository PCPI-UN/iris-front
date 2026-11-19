import {
  createEmptyScaleDraft,
  GradingScaleDraft,
  isEventScaleLocked,
  normalizeGradingScale,
  normalizeGradingScales,
  toGradingScaleInput,
  toScoreLevelOptions,
  validateGradingScaleDraft,
} from "../grading-scale";
import {
  InvalidGradingScaleDraftError,
  resolveGradingScaleId,
} from "../grading-scale-selection";

const draft = (points: string[], overrides: Partial<GradingScaleDraft> = {}): GradingScaleDraft => ({
  name: "Decenas",
  levels: ["Bajo", "Medio", "Alto", "Máximo"].map((label, index) => ({
    label,
    points: points[index],
  })),
  ...overrides,
});

const systemScale = {
  id: 1,
  name: "Proyectos finales",
  isSystem: true,
  code: "FINAL_PROJECTS",
  locked: true,
  levels: [
    { level: 1, label: "Insuficiente", points: 25 },
    { level: 2, label: "Aceptable", points: 55 },
    { level: 3, label: "Bueno", points: 75 },
    { level: 4, label: "Excelente", points: 90 },
  ],
};

describe("validateGradingScaleDraft", () => {
  it("accepts 4 levels whose points grow from level 1 to 4", () => {
    const { isValid, errors } = validateGradingScaleDraft(draft(["10", "20", "30", "40"]));
    expect(isValid).toBe(true);
    expect(errors.form).toBeUndefined();
  });

  it("accepts decimals with at most 2 places", () => {
    expect(validateGradingScaleDraft(draft(["1.5", "2.25", "3", "4.75"])).isValid).toBe(true);
  });

  it("rejects points that do not grow and marks the level that breaks the order", () => {
    const { isValid, errors } = validateGradingScaleDraft(draft(["10", "30", "20", "40"]));
    expect(isValid).toBe(false);
    expect(errors.form).toBe("Los puntos deben crecer del nivel 1 al nivel 4.");
    expect(errors.levels[2].points).toBe("Debe ser mayor que el nivel 2 (30).");
    expect(errors.levels[1].points).toBeUndefined();
  });

  it("rejects two levels with the same points", () => {
    const { isValid, errors } = validateGradingScaleDraft(draft(["10", "20", "20", "40"]));
    expect(isValid).toBe(false);
    expect(errors.levels[2].points).toMatch(/mayor que el nivel 2/);
  });

  it("asks for the name, the labels and the points", () => {
    const { isValid, errors } = validateGradingScaleDraft({
      name: "  ",
      levels: [
        { label: "", points: "10" },
        { label: "Medio", points: "" },
        { label: "Alto", points: "abc" },
        { label: "Máximo", points: "40" },
      ],
    });
    expect(isValid).toBe(false);
    expect(errors.name).toBe("Escribe el nombre de la escala.");
    expect(errors.levels[0].label).toBe("Escribe la etiqueta del nivel.");
    expect(errors.levels[1].points).toBe("Escribe los puntos del nivel.");
    expect(errors.levels[2].points).toBe("Escribe los puntos del nivel.");
  });

  it("rejects negative points and more than 2 decimals", () => {
    const { errors } = validateGradingScaleDraft(draft(["-1", "2.555", "3", "4"]));
    expect(errors.levels[0].points).toBe("Entre 0 y 99999.99.");
    expect(errors.levels[1].points).toBe("Máximo 2 decimales.");
  });

  it("requires exactly 4 levels", () => {
    const threeLevels = draft(["10", "20", "30", "40"]);
    threeLevels.levels = threeLevels.levels.slice(0, 3);
    const { isValid, errors } = validateGradingScaleDraft(threeLevels);
    expect(isValid).toBe(false);
    expect(errors.form).toBe("La escala debe tener exactamente 4 niveles.");
  });

  it("starts an empty draft with the 4 default labels and no points", () => {
    const empty = createEmptyScaleDraft();
    expect(empty.levels.map((level) => level.label)).toEqual([
      "Insuficiente",
      "Aceptable",
      "Bueno",
      "Excelente",
    ]);
    expect(validateGradingScaleDraft(empty).isValid).toBe(false);
  });
});

describe("toGradingScaleInput", () => {
  it("numbers the levels 1 to 4 and trims the texts", () => {
    expect(
      toGradingScaleInput(draft(["10", "20", "30", "40.5"], { name: "  Decenas " })),
    ).toEqual({
      name: "Decenas",
      levels: [
        { level: 1, label: "Bajo", points: 10 },
        { level: 2, label: "Medio", points: 20 },
        { level: 3, label: "Alto", points: 30 },
        { level: 4, label: "Máximo", points: 40.5 },
      ],
    });
  });
});

describe("normalizeGradingScale", () => {
  it("reads a scale of the backend with its levels sorted", () => {
    const scale = normalizeGradingScale({
      ...systemScale,
      levels: [...systemScale.levels].reverse(),
    });
    expect(scale?.levels.map((level) => level.level)).toEqual([1, 2, 3, 4]);
    expect(scale?.isSystem).toBe(true);
  });

  it("returns null without an id", () => {
    expect(normalizeGradingScale(null)).toBeNull();
    expect(normalizeGradingScale({ name: "Sin id" })).toBeNull();
  });

  it("reads the catalog as an array or wrapped in scales", () => {
    expect(normalizeGradingScales([systemScale])).toHaveLength(1);
    expect(normalizeGradingScales({ scales: [systemScale] })).toHaveLength(1);
    expect(normalizeGradingScales(undefined)).toEqual([]);
  });
});

describe("isEventScaleLocked", () => {
  it("locks a custom scale that the backend marks as locked", () => {
    expect(isEventScaleLocked(normalizeGradingScale({ ...systemScale, isSystem: false, code: undefined }))).toBe(true);
  });

  it("does not lock a system scale, always locked for edits in the catalog", () => {
    expect(isEventScaleLocked(normalizeGradingScale(systemScale))).toBe(false);
  });

  it("does not lock an unlocked scale or a missing one", () => {
    expect(isEventScaleLocked(normalizeGradingScale({ ...systemScale, isSystem: false, locked: false }))).toBe(false);
    expect(isEventScaleLocked(null)).toBe(false);
  });
});

describe("toScoreLevelOptions", () => {
  it("uses the labels and points of the event scale", () => {
    expect(toScoreLevelOptions(normalizeGradingScale(systemScale))).toEqual([
      { value: 1, label: "Insuficiente", points: 25 },
      { value: 2, label: "Aceptable", points: 55 },
      { value: 3, label: "Bueno", points: 75 },
      { value: 4, label: "Excelente", points: 90 },
    ]);
  });

  it("falls back to the default labels without points", () => {
    expect(toScoreLevelOptions(null)).toEqual([
      { value: 1, label: "Insuficiente" },
      { value: 2, label: "Aceptable" },
      { value: 3, label: "Bueno" },
      { value: 4, label: "Excelente" },
    ]);
  });
});

describe("resolveGradingScaleId", () => {
  it("uses the catalog scale without creating one", async () => {
    const create = vi.fn();
    await expect(resolveGradingScaleId({ mode: "catalog", scaleId: 3 }, create)).resolves.toEqual({
      scaleId: 3,
    });
    expect(create).not.toHaveBeenCalled();
  });

  it("creates the new scale first and returns its id", async () => {
    const created = normalizeGradingScale({ id: 9, name: "Decenas", levels: [] })!;
    const create = vi.fn().mockResolvedValue(created);

    const result = await resolveGradingScaleId(
      { mode: "new", draft: draft(["10", "20", "30", "40"]) },
      create,
    );

    expect(result).toEqual({ scaleId: 9, created });
    expect(create).toHaveBeenCalledWith(toGradingScaleInput(draft(["10", "20", "30", "40"])));
  });

  it("does not create a scale whose points do not grow", async () => {
    const create = vi.fn();
    await expect(
      resolveGradingScaleId({ mode: "new", draft: draft(["40", "30", "20", "10"]) }, create),
    ).rejects.toBeInstanceOf(InvalidGradingScaleDraftError);
    expect(create).not.toHaveBeenCalled();
  });
});
