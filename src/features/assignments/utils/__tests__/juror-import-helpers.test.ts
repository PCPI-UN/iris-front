import { ApiError } from "@/lib/api-client";

import {
  buildSummaryCsv,
  isRowWarning,
  normalizeExecuteResponse,
  normalizePreviewResponse,
  parseExecuteError,
  parseValidEventId,
  sanitizeDownloadFileName,
  sanitizeSpreadsheetCell,
  validateExcelFile,
} from "../juror-import-helpers";

const VALID_XLSX_BYTES = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00]);
const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

describe("juror-import-helpers security & normalization", () => {
  test("parseValidEventId accepts only positive integers", () => {
    expect(parseValidEventId("12")).toBe(12);
    expect(parseValidEventId(7)).toBe(7);
    expect(parseValidEventId("0")).toBeNull();
    expect(parseValidEventId("-1")).toBeNull();
    expect(parseValidEventId("1/../admin")).toBeNull();
    expect(parseValidEventId("abc")).toBeNull();
  });

  test("validateExcelFile rejects invalid extensions, empty, oversized, and spoofed magic bytes", async () => {
    const csvFile = new File(["a,b,c"], "jurados.csv", { type: "text/csv" });
    expect(await validateExcelFile(csvFile)).toMatch(/\.xlsx/i);

    const macroFile = new File([VALID_XLSX_BYTES], "jurados.xlsm", {
      type: "application/vnd.ms-excel.sheet.macroEnabled.12",
    });
    expect(await validateExcelFile(macroFile)).toMatch(/\.xlsx/i);

    const emptyFile = new File([], "vacio.xlsx", { type: XLSX_MIME });
    expect(await validateExcelFile(emptyFile)).toMatch(/vacío/i);

    const spoofedHtml = new File(
      ["<html><script>alert(1)</script></html>"],
      "evil.xlsx",
      { type: XLSX_MIME },
    );
    expect(await validateExcelFile(spoofedHtml)).toMatch(/no corresponde/i);

    const oversized = new File([VALID_XLSX_BYTES], "big.xlsx", {
      type: XLSX_MIME,
    });
    Object.defineProperty(oversized, "size", { value: 11 * 1024 * 1024 });
    expect(await validateExcelFile(oversized)).toMatch(/10 MB/i);

    const validFile = new File([VALID_XLSX_BYTES], "jurados.xlsx", {
      type: XLSX_MIME,
    });
    expect(await validateExcelFile(validFile)).toBeNull();
  });

  test("sanitizeDownloadFileName prevents path traversal and invalid chars", () => {
    expect(
      sanitizeDownloadFileName("../../etc/passwd.xlsx", "fallback.xlsx"),
    ).toBe("passwd.xlsx");
    expect(
      sanitizeDownloadFileName('..\\evil:"name?.xlsx', "fallback.xlsx"),
    ).toBe("evilname.xlsx");
    expect(sanitizeDownloadFileName("", "fallback.xlsx")).toBe("fallback.xlsx");
  });

  test("sanitizeSpreadsheetCell & buildSummaryCsv neutralize formula injection", () => {
    expect(sanitizeSpreadsheetCell("=CMD|' /C calc'!A0")).toBe(
      `"'=CMD|' /C calc'!A0"`,
    );
    expect(sanitizeSpreadsheetCell("+SUM(A1:A2)")).toBe(`"'+SUM(A1:A2)"`);
    expect(sanitizeSpreadsheetCell("-1+1")).toBe(`"'-1+1"`);
    expect(sanitizeSpreadsheetCell("@SUM(1,1)")).toBe(`"'@SUM(1,1)"`);

    const csv = buildSummaryCsv(
      [
        {
          rowNumber: 2,
          jurorSlot: 1,
          outcome: "ASSIGN",
          userStatus: "ACTIVE",
          message: "=HYPERLINK(\"http://evil\",\"click\")",
          email: "juror@uninorte.edu.co",
          projectId: 10,
          projectName: "+FormulaName",
          userId: 5,
        },
      ],
      "execute",
    );
    expect(csv).toContain(`"'+FormulaName"`);
    expect(csv).toContain(`"'=HYPERLINK(""http://evil"",""click"")"`);
  });

  test("isRowWarning recognizes tutor notice as non-blocking warning, not error", () => {
    expect(
      isRowWarning({
        outcome: "ASSIGN",
        message: "es tutor de este proyecto",
      }),
    ).toBe(true);

    expect(
      isRowWarning({
        outcome: "ERROR",
        message: "es tutor de este proyecto",
      }),
    ).toBe(false);

    expect(
      isRowWarning({
        outcome: "SKIP",
        message: "Ya estaba asignado",
      }),
    ).toBe(false);
  });

  test("parseExecuteError distinguishes 400 { message, preview } and 400 { message, invitedJurors }", () => {
    const previewErr = new ApiError("El archivo contiene errores", 400, {
      data: {
        message: "El archivo contiene errores actualizados.",
        preview: {
          rows: [
            {
              rowNumber: 2,
              jurorSlot: 1,
              outcome: "ERROR",
              userStatus: "UNKNOWN",
              message: "Proyecto inexistente",
              email: "x@uninorte.edu.co",
              projectId: 999,
              projectName: null,
              userId: null,
            },
          ],
          totals: {
            rows: 1,
            assigned: 0,
            skipped: 0,
            errors: 1,
            jurors: 1,
            invitationsSent: 0,
            invitationsReused: 0,
            newUsers: 0,
          },
        },
      },
    });

    const parsedPreview = parseExecuteError(previewErr);
    expect(parsedPreview.kind).toBe("preview");
    if (parsedPreview.kind === "preview") {
      expect(parsedPreview.preview.canConfirm).toBe(false);
      expect(parsedPreview.preview.totals.errors).toBe(1);
    }

    const invitedErr = new ApiError(
      "El evento cambió durante la validación final",
      400,
      {
        data: {
          message: "El evento cambió antes de guardar las asignaciones.",
          invitedJurors: ["a@uninorte.edu.co", "b@uninorte.edu.co"],
        },
      },
    );

    const parsedInvited = parseExecuteError(invitedErr);
    expect(parsedInvited.kind).toBe("invitedJurors");
    if (parsedInvited.kind === "invitedJurors") {
      expect(parsedInvited.invitedJurors).toEqual([
        "a@uninorte.edu.co",
        "b@uninorte.edu.co",
      ]);
    }

    const normalized = normalizeExecuteResponse({
      rows: [],
      totals: {
        rows: 4,
        assigned: 2,
        skipped: 1,
        errors: 1,
        jurors: 3,
        invitationsSent: 1,
        invitationsReused: 1,
        newUsers: 1,
      },
    });
    expect(normalized.totals.invitationsReused).toBe(1);

    const preview = normalizePreviewResponse({
      rows: [
        {
          rowNumber: 2,
          jurorSlot: 1,
          outcome: "ASSIGN",
          userStatus: "NEW",
          message: "es tutor de este proyecto",
          email: "t@uninorte.edu.co",
          projectId: 1,
          projectName: "Proyecto Alpha",
          userId: null,
        },
      ],
    });
    expect(preview.canConfirm).toBe(true);
    expect(preview.totals.warnings).toBe(1);
  });
});

