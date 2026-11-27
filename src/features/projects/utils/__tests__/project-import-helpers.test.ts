import {
  normalizeProjectImportExecute,
  normalizeProjectImportPreview,
  parseProjectImportExecuteError,
} from "../project-import-helpers";

import { ApiError } from "@/lib/api-client";

describe("project import normalization", () => {
  test("reads the rows with alternative field names and computes the missing totals", () => {
    const preview = normalizeProjectImportPreview({
      rows: [
        {
          rowNumber: 2,
          action: "create",
          name: "Robot",
          category: { name: "Ingeniería" },
          participants: [{}, {}],
          tutors: ["a@x.co"],
        },
        {
          outcome: "SKIP",
          project: { id: 9, name: "Riego" },
          message: "Ya existe",
        },
        { outcome: "WHATEVER", errors: [{ message: "Correo repetido" }] },
      ],
      eventWarnings: ["Evento inactivo"],
    });

    expect(preview.rows[0]).toMatchObject({
      rowNumber: 2,
      outcome: "CREATE",
      projectName: "Robot",
      categoryName: "Ingeniería",
      participantsCount: 2,
      tutorsCount: 1,
    });
    expect(preview.rows[1]).toMatchObject({
      outcome: "SKIP",
      projectId: 9,
      projectName: "Riego",
      messages: ["Ya existe"],
    });
    expect(preview.rows[2]).toMatchObject({
      rowNumber: 3,
      outcome: "ERROR",
      messages: ["Correo repetido"],
    });
    expect(preview.totals).toEqual({
      rows: 3,
      created: 1,
      skipped: 1,
      errors: 1,
    });
    expect(preview.warnings).toEqual(["Evento inactivo"]);
    // No explicit canConfirm: blocked by the error row
    expect(preview.canConfirm).toBe(false);
  });

  test("execute keeps the failed effects of each created row", () => {
    const result = normalizeProjectImportExecute({
      rows: [
        { outcome: "CREATED", projectId: 5, failedEffects: ["DOCUMENTS"] },
      ],
    });

    expect(result.rows[0].failedEffects).toEqual(["DOCUMENTS"]);
    expect(result.totals.created).toBe(1);
  });

  test("a 400 with preview is parsed so the view can show it", () => {
    const parsed = parseProjectImportExecuteError(
      new ApiError("Bad Request", 400, {
        data: {
          message: "No se puede confirmar",
          preview: { rows: [], canConfirm: false },
        },
      }),
    );

    expect(parsed.kind).toBe("preview");
    expect(parsed.message).toBe("No se puede confirmar");
  });
});
