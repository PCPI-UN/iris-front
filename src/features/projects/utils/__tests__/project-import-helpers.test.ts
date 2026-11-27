import {
  normalizeProjectImportExecute,
  normalizeProjectImportPreview,
  parseProjectImportExecuteError,
} from "../project-import-helpers";

import { ApiError } from "@/lib/api-client";

describe("project import normalization", () => {
  test("reads the preview as the gateway answers it", () => {
    const preview = normalizeProjectImportPreview({
      rows: [
        {
          rowNumber: 2,
          outcome: "CREATE",
          message: "",
          projectName: "Robot",
          categoryName: "Ingeniería",
          state: "UNDER_REVIEW",
          participants: [
            { email: "ana@unal.edu.co", status: "HAS_ACCOUNT" },
            { email: "luis@unal.edu.co", status: "NO_ACCOUNT" },
          ],
        },
        {
          rowNumber: 3,
          outcome: "SKIP",
          message: "Ya existe",
          projectName: "Riego",
          state: "APPROVED",
          participants: [],
          projectId: 9,
        },
        {
          rowNumber: 4,
          outcome: "ERROR",
          message: "Correo repetido",
          projectName: "Otro",
          state: "APPROVED",
          participants: [],
        },
      ],
      totals: {
        rows: 3,
        toCreate: 1,
        skipped: 1,
        errors: 1,
        participants: 2,
        withoutAccount: 1,
      },
      eventWarnings: ["Evento inactivo"],
      canConfirm: false,
    });

    expect(preview.rows[0]).toMatchObject({
      rowNumber: 2,
      outcome: "CREATE",
      messages: [],
      projectName: "Robot",
      categoryName: "Ingeniería",
      state: "UNDER_REVIEW",
      participantsCount: 2,
      projectId: null,
    });
    expect(preview.rows[1]).toMatchObject({
      outcome: "SKIP",
      projectId: 9,
      messages: ["Ya existe"],
    });
    expect(preview.rows[2]).toMatchObject({
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
    expect(preview.canConfirm).toBe(false);
  });

  test("execute keeps the failed effects of each created row", () => {
    const result = normalizeProjectImportExecute({
      rows: [
        {
          rowNumber: 2,
          outcome: "CREATED",
          message: "",
          projectName: "Robot",
          state: "APPROVED",
          participants: [],
          projectId: 5,
          failedEffects: ["DOCUMENTS"],
        },
      ],
      totals: {
        created: 1,
        skipped: 0,
        errors: 0,
        emailsSent: 0,
        failedEffects: 1,
      },
    });

    expect(result.rows[0].failedEffects).toEqual(["DOCUMENTS"]);
    expect(result.totals).toEqual({
      rows: 1,
      created: 1,
      skipped: 0,
      errors: 0,
    });
  });

  test("a 400 with preview is parsed so the view can show it", () => {
    const parsed = parseProjectImportExecuteError(
      new ApiError("Bad Request", 400, {
        data: {
          message: "No se puede confirmar",
          details: { preview: { rows: [], canConfirm: false } },
        },
      }),
    );

    expect(parsed.kind).toBe("preview");
    expect(parsed.message).toBe("No se puede confirmar");
  });
});
