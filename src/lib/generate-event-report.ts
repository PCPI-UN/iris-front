import ExcelJS from "exceljs";
import type {
  EventReportData,
  Project,
  DashboardStats,
} from "../types/report-types";

const COLORS = {
  white: "FFFFFF",
  black: "000000",
  light2: "E7E6E6",
  accent1: "4472C4",
  accent1Light: "D6E4F7",
  darkGrey: "FFF2F2F2",
  headerFill: "CFDCFF",
} as const;

// Shared style helpers

function accentFill(): ExcelJS.Fill {
  return { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.accent1 } };
}

function lightGreyFill(): ExcelJS.Fill {
  return { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.white } };
}

function headerRowFill(): ExcelJS.Fill {
  return { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.headerFill } };
}

function thinBorder(
  sides: ("left" | "right" | "top" | "bottom")[] = ["left", "right", "top", "bottom"]
): Partial<ExcelJS.Borders> {
  const side: Partial<ExcelJS.Border> = { style: "thin", color: { argb: COLORS.black } };
  const result: Partial<ExcelJS.Borders> = {};
  for (const s of sides) (result as Record<string, unknown>)[s] = side;
  return result;
}

function applyToMergedRange(
  ws: ExcelJS.Worksheet,
  topLeft: string,
  style: ExcelJS.Style
) {
  const cell = ws.getCell(topLeft);
  Object.assign(cell, style);
}

// Dashboard sheet

function buildDashboardSheet(
  wb: ExcelJS.Workbook,
  eventName: string,
  reportDate: string,
  dash: DashboardStats
) {
  const ws = wb.addWorksheet("Dashboard-estadisticas");

  // Default column widths (12 columns, A–L, uniform)
  for (let c = 1; c <= 12; c++) {
    ws.getColumn(c).width = 12;
  }

  // Row heights
  const rowHeights: Record<number, number> = {
    1: 19.95, 2: 19.95, 3: 19.95, 4: 19.95, 5: 19.95,
    6: 28.8, 8: 28.05, 9: 19.95, 10: 19.95, 11: 19.95,
    12: 19.95, 13: 19.95, 14: 19.95, 15: 19.95,
    19: 28.05, 20: 19.95, 21: 19.95,
    25: 28.05, 26: 19.95, 27: 19.95,
  };
  for (const [r, h] of Object.entries(rowHeights)) {
    ws.getRow(Number(r)).height = h;
  }

  // Row 1: "EVENT REPORT" header
  ws.mergeCells("A1:L1");
  const r1 = ws.getCell("A1");
  r1.value = "EVENT REPORT";
  r1.font = { name: "Calibri", bold: true, size: 11, color: { argb: COLORS.white } };
  r1.fill = accentFill();
  r1.alignment = { horizontal: "left", vertical: "middle" };

  // Row 2: Event
  ws.mergeCells("A2:F2");
  ws.mergeCells("G2:L2");
  const r2a = ws.getCell("A2");
  r2a.value = "Evento";
  r2a.font = { name: "Calibri", size: 11 };
  r2a.alignment = { horizontal: "left", vertical: "middle" };
  r2a.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF2F2F2" } };

  const r2b = ws.getCell("G2");
  r2b.value = eventName;
  r2b.font = { name: "Calibri", size: 11 };
  r2b.alignment = { horizontal: "right", vertical: "middle" };
  r2b.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF2F2F2" } };

  // Row 3: Date the report was created
  ws.mergeCells("A3:F3");
  ws.mergeCells("G3:L3");
  const r3a = ws.getCell("A3");
  r3a.value = "Fecha de creación del reporte";
  r3a.font = { name: "Calibri", size: 11 };
  r3a.alignment = { horizontal: "left", vertical: "middle" };
  r3a.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF2F2F2" } };

  const r3b = ws.getCell("G3");
  r3b.value = new Date(reportDate);
  r3b.numFmt = "dd/mm/yyyy";
  r3b.font = { name: "Calibri", size: 11 };
  r3b.alignment = { horizontal: "right", vertical: "middle" };
  r3b.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF2F2F2" } };

  // Row 6: DASHBOARD / STATISTICS
  ws.mergeCells("A6:L6");
  const r6 = ws.getCell("A6");
  r6.value = "DASHBOARD / ESTADÍSTICAS";
  r6.font = { name: "Calibri", bold: true, size: 18, color: { argb: COLORS.accent1 } };
  r6.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD6E4F7" } };
  r6.alignment = { horizontal: "left", vertical: "middle" };

  // Row 8: SUMMARY section header
  ws.mergeCells("A8:L8");
  const r8 = ws.getCell("A8");
  r8.value = "RESUMEN";
  r8.font = { name: "Calibri", bold: true, size: 12, color: { argb: COLORS.white } };
  r8.fill = accentFill();
  r8.alignment = { horizontal: "left", vertical: "middle" };
  r8.border = thinBorder(["bottom"]);

  // Row 9: Column headers
  ws.mergeCells("A9:F9");
  ws.mergeCells("G9:L9");
  const r9a = ws.getCell("A9");
  r9a.value = "Métrica";
  r9a.font = { name: "Calibri", bold: true, size: 11 };
  r9a.fill = lightGreyFill();
  r9a.alignment = { horizontal: "left", vertical: "middle" };
  r9a.border = thinBorder(["left", "top", "bottom"]);

  const r9b = ws.getCell("G9");
  r9b.value = "Valor";
  r9b.font = { name: "Calibri", bold: true, size: 11 };
  r9b.fill = lightGreyFill();
  r9b.alignment = { horizontal: "left", vertical: "middle" };
  r9b.border = thinBorder(["top", "bottom"]);

  // Rows 10–15: Summary data rows
  const summaryRows: [string, number][] = [
    ["Total de proyectos", dash.totalProjects],
    ["Aprobados", dash.approved],
    ["En revisión", dash.underReview],
    ["Rechazados", dash.rejected],
    ["Cambios requeridos", dash.changesRequired],
    ["Total de jurados", dash.totalJuries]
  ];

  summaryRows.forEach(([label, value], i) => {
    const rowNum = 10 + i;
    const isAlternate = i % 2 === 0;
    const fill = isAlternate
      ? ({ type: "pattern", pattern: "solid", fgColor: { argb: COLORS.light2 } } as ExcelJS.Fill)
      : lightGreyFill();

    ws.mergeCells(`A${rowNum}:F${rowNum}`);
    ws.mergeCells(`G${rowNum}:L${rowNum}`);

    const labelCell = ws.getCell(`A${rowNum}`);
    labelCell.value = label;
    labelCell.font = { name: "Calibri", size: 11 };
    labelCell.fill = fill;
    labelCell.alignment = { horizontal: "left", vertical: "middle" };
    labelCell.border = thinBorder(["left", "top", "bottom"]);

    const valueCell = ws.getCell(`G${rowNum}`);
    valueCell.value = value;
    valueCell.font = { name: "Calibri", size: 11 };
    valueCell.fill = fill;
    valueCell.alignment = { horizontal: "left", vertical: "middle" };
    valueCell.border = thinBorder(["top", "bottom"]);
  });

  // Row 19: PROJECTS BY CATEGORY
  ws.mergeCells("A19:L19");
  const r19 = ws.getCell("A19");
  r19.value = "PROYECTOS POR CATEGORÍA";
  r19.font = { name: "Calibri", bold: true, size: 12, color: { argb: COLORS.white } };
  r19.fill = accentFill();
  r19.alignment = { horizontal: "left", vertical: "middle" };

  // Row 20: Category header
  ws.mergeCells("A20:F20");
  ws.mergeCells("G20:L20");

  const r20a = ws.getCell("A20");
  r20a.value = "Categoría";
  r20a.font = { name: "Calibri", bold: true, size: 11 };
  r20a.fill = lightGreyFill();
  r20a.alignment = { horizontal: "left", vertical: "middle" };
  r20a.border = thinBorder(["left", "top", "bottom"]);

  const r20b = ws.getCell("G20");
  r20b.value = "Recuento";
  r20b.font = { name: "Calibri", bold: true, size: 11 };
  r20b.fill = lightGreyFill();
  r20b.alignment = { horizontal: "left", vertical: "middle" };
  r20b.border = thinBorder(["right", "top", "bottom"]);

  // Category data rows (starting at row 21)
  dash.projectsByCategory.forEach(({ category, count }, i) => {
    const rowNum = 21 + i;
    const isAlternate = i % 2 === 0;
    const fill = isAlternate
      ? lightGreyFill()
      : ({ type: "pattern", pattern: "solid", fgColor: { argb: COLORS.light2 } } as ExcelJS.Fill);

    ws.mergeCells(`A${rowNum}:F${rowNum}`);
    ws.mergeCells(`G${rowNum}:L${rowNum}`);

    const catCell = ws.getCell(`A${rowNum}`);
    catCell.value = category;
    catCell.font = { name: "Calibri", size: 11 };
    catCell.fill = fill;
    catCell.alignment = { horizontal: "left", vertical: "middle" };
    catCell.border = thinBorder(["left", "top", "bottom"]);

    const countCell = ws.getCell(`G${rowNum}`);
    countCell.value = count;
    countCell.font = { name: "Calibri", size: 11 };
    countCell.fill = fill;
    countCell.alignment = { horizontal: "left", vertical: "middle" };
    countCell.border = thinBorder(["right", "top", "bottom"]);
  });

  // PARTICIPANTS section
  // Leave 2 blank rows then start the section
  const missingStart = 21 + Math.max(dash.projectsByCategory.length, 1) + 3;

  ws.mergeCells(`A${missingStart}:L${missingStart}`);
  const missingHeader = ws.getCell(`A${missingStart}`);
  missingHeader.value = "PARTICIPANTS";
  missingHeader.font = { name: "Calibri", bold: true, size: 12, color: { argb: COLORS.white } };
  missingHeader.fill = accentFill();
  missingHeader.alignment = { horizontal: "left", vertical: "middle" };
  ws.getRow(missingStart).height = 28.05;

  const missingColRow = missingStart + 1;
  ws.mergeCells(`A${missingColRow}:F${missingColRow}`);
  ws.mergeCells(`G${missingColRow}:L${missingColRow}`);

  const missingColA = ws.getCell(`A${missingColRow}`);
  missingColA.value = "Filtro";
  missingColA.font = { name: "Calibri", bold: true, size: 11 };
  missingColA.fill = lightGreyFill();
  missingColA.alignment = { horizontal: "left", vertical: "middle" };
  missingColA.border = thinBorder(["left", "top", "bottom"]);
  ws.getRow(missingColRow).height = 19.95;

  const missingColG = ws.getCell(`G${missingColRow}`);
  missingColG.value = "Recuento";
  missingColG.font = { name: "Calibri", bold: true, size: 11 };
  missingColG.fill = lightGreyFill();
  missingColG.alignment = { horizontal: "left", vertical: "middle" };
  missingColG.border = thinBorder(["right", "top", "bottom"]);

  Object.entries(dash.participants ?? {}).forEach(([key, value], i) => {
    const rowNum = missingColRow + 1 + i;
    ws.mergeCells(`A${rowNum}:F${rowNum}`);
    ws.mergeCells(`G${rowNum}:L${rowNum}`);

    const isAlternate = i % 2 === 0;
    const fill = isAlternate
      ? ({ type: "pattern", pattern: "solid", fgColor: { argb: COLORS.light2 } } as ExcelJS.Fill)
      : lightGreyFill();
    
    const projCell = ws.getCell(`A${rowNum}`);
    projCell.value = key;
    projCell.font = { name: "Calibri", size: 11 };
    projCell.fill = fill;
    projCell.alignment = { horizontal: "left", vertical: "middle" };
    projCell.border = thinBorder(["left", "top", "bottom"]);

    const missingCell = ws.getCell(`G${rowNum}`);
    missingCell.value = value;
    missingCell.font = { name: "Calibri", size: 11 };
    missingCell.fill = fill;
    missingCell.alignment = { horizontal: "left", vertical: "middle" };
    missingCell.border = thinBorder(["right", "top", "bottom"]);
    ws.getRow(rowNum).height = 19.95;
    
  })
}

// Project summary sheet

function buildProjectsSummarySheet(wb: ExcelJS.Workbook, projects: Project[]) {
  const ws = wb.addWorksheet("Resumen proyectos");

  // Column widths (A–K)
  const colWidths = [11, 13, 35, 24, 14, 24, 30, 30, 30, 18, 14];
  colWidths.forEach((w, i) => {
    ws.getColumn(i + 1).width = w;
  });

  // Row 1: Sheet title
  ws.mergeCells("A1:K1");
  ws.getRow(1).height = 29;
  const title = ws.getCell("A1");
  title.value = "Proyectos";
  title.font = { name: "Calibri", bold: true, size: 14, color: { argb: COLORS.accent1 } };
  title.alignment = { horizontal: "center", vertical: "middle" };

  // Row 2: Header row
  ws.getRow(2).height = 2;
  ws.getRow(3).height = 20;
  const headers = [
    { label: "Id", align: "left" },
    { label: "Número", align: "left" },
    { label: "Nombre proyecto", align: "left" },
    { label: "Categoría", align: "left" },
    { label: "Estado", align: "center" },
    { label: "Miembros", align: "center" },
    { label: "LOGO", align: "center" },
    { label: "POSTER", align: "center" },
    { label: "DOCUMENTOS DE SOPORTE", align: "center" },
    { label: "Jurados", align: "center" },
    { label: "Fecha", align: "center" },
  ] as const;

  headers.forEach(({ label, align }, i) => {
    const cell = ws.getCell(3, i + 1);
    cell.value = label;
    cell.font = { name: "Calibri", bold: true, size: 11 };
    cell.fill = headerRowFill();
    cell.alignment = { horizontal: align, vertical: "middle" };
    cell.border = thinBorder(["left", "right", "top", "bottom"]);
  });

  // Add auto-filter
  ws.autoFilter = { from: "A3", to: "K3" };

  // Freeze pane below header
  ws.views = [{ state: "frozen", xSplit: 0, ySplit: 3 }];

  // Data rows
  projects.forEach((p, i) => {
    const rowNum = 4 + i;
    const row = ws.getRow(rowNum);
    row.height = 19.95;

    const isAlternate = i % 2 === 1;
    const fill = isAlternate
      ? ({ type: "pattern", pattern: "solid", fgColor: { argb: "FFF2F2F2" } } as ExcelJS.Fill)
      : ({ type: "pattern", pattern: "solid", fgColor: { argb: COLORS.white } } as ExcelJS.Fill);

    const values: (string | number | Date)[] = [
      p.id,
      p.number ? p.number : "",
      p.name,
      p.category ? p.category : "",
      p.status,
      p.members,
      "",
      "",
      "",
      p.jurors.length,
      new Date(p.createdAt),
    ];

    values.forEach((val, ci) => {
      const cell = ws.getCell(rowNum, ci + 1);
      const logo = p.documents.find(d => d.type === "LOGO");
      const poster = p.documents.find(d => d.type === "POSTER");
      const support = p.documents.find(d => d.type === "SUPPORTING_DOCUMENT");
      cell.value = val as ExcelJS.CellValue;
      cell.font = { name: "Calibri", size: 11 };
      cell.fill = fill;
      cell.alignment = {
        horizontal: ci >= 4 ? "center" : "left",
        vertical: "middle",
      };
      cell.border = thinBorder(["left", "right", "top", "bottom"]);
      if (ci === 10) cell.numFmt = "dd/mm/yyyy";

      if (ci === 6 && logo) {
        cell.value = {
          text: "Logo",
          hyperlink: logo.url,
        };
        cell.font = {
          name: "Calibri",
          size: 11,
          color: { argb: "0563C1" },
          underline: true,
        };
      } else if (ci === 7 && poster) {
        cell.value = {
          text: "Poster",
          hyperlink: poster.url,
        };
        cell.font = {
          name: "Calibri",
          size: 11,
          color: { argb: "0563C1" },
          underline: true,
        };
      } else if (ci === 8 && support) {
        cell.value = {
          text: "Supporting document",
          hyperlink: support.url,
        };
        cell.font = {
          name: "Calibri",
          size: 11,
          color: { argb: "0563C1" },
          underline: true,
        };
      } else {
        cell.value = val as ExcelJS.CellValue;
        cell.font = { name: "Calibri", size: 11 };
      }

      cell.fill = fill;
      cell.alignment = {
        horizontal: ci >= 4 ? "center" : "left",
        vertical: "middle",
      };

    });
  });
}

// Participants sheet

function buildParticipantsSheet(wb: ExcelJS.Workbook, projects: Project[]) {
  const ws = wb.addWorksheet("Participantes");

  const colWidths = [10.78, 12.33, 35, 34.89, 30.33, 23.11, 15];
  colWidths.forEach((w, i) => (ws.getColumn(i + 1).width = w));

  // Row 1: title
  ws.mergeCells("A1:G1");
  ws.getRow(1).height = 28.8;
  const title = ws.getCell("A1");
  title.value = "Participantes";
  title.font = { name: "Calibri", bold: true, size: 14, color: { argb: COLORS.accent1 } };
  title.alignment = { horizontal: "center", vertical: "middle" };

  ws.getRow(2).height = 4;

  // Row 3: headers
  ws.getRow(3).height = 20;
  const headers = ["Id Proyecto", "Número", "Nombre proyecto", "Nombre participante", "Email", "Carrera", "Semestre"];
  headers.forEach((label, i) => {
    const cell = ws.getCell(3, i + 1);
    cell.value = label;
    cell.font = { name: "Calibri", bold: true, size: 11 };
    cell.fill = headerRowFill();
    cell.alignment = { horizontal: "left", vertical: "middle" };
    cell.border = thinBorder(["left", "right", "top", "bottom"]);
  });

  ws.autoFilter = { from: "A3", to: "G3" };
  ws.views = [{ state: "frozen", xSplit: 0, ySplit: 3 }];

  let rowNum = 4;
  let globalIdx = 0;
  for (const p of projects) {
    for (const participant of p.participants) {
      const row = ws.getRow(rowNum);
      row.height = 20;

      const isAlternate = globalIdx % 2 === 1;
      const fill = isAlternate
        ? ({ type: "pattern", pattern: "solid", fgColor: { argb: "FFF2F2F2" } } as ExcelJS.Fill)
        : ({ type: "pattern", pattern: "solid", fgColor: { argb: COLORS.white } } as ExcelJS.Fill);

      const values = [p.id, p.number, p.name, participant.name, participant.email, participant.career, participant.semester];
      values.forEach((val, ci) => {
        const cell = ws.getCell(rowNum, ci + 1);
        cell.value = val as ExcelJS.CellValue;
        cell.font = { name: "Calibri", size: 11 };
        cell.fill = fill;
        cell.alignment = { horizontal: "left", vertical: "middle" };
        cell.border = thinBorder(["left", "right", "top", "bottom"]);
      });

      rowNum++;
      globalIdx++;
    }
  }
}

// Assignments juries sheet

function buildJudgesSheet(wb: ExcelJS.Workbook, projects: Project[]) {
  const ws = wb.addWorksheet("Jurados asignados");

  const colWidths = [10.78, 12.33, 35, 23.11, 36.44, 22.22, 16.78];
  colWidths.forEach((w, i) => (ws.getColumn(i + 1).width = w));

  ws.mergeCells("A1:F1");
  ws.getRow(1).height = 28.8;
  const title = ws.getCell("A1");
  title.value = "Jurados";
  title.font = { name: "Calibri", bold: true, size: 14, color: { argb: COLORS.accent1 } };
  title.alignment = { horizontal: "center", vertical: "middle" };

  ws.getRow(2).height = 4;

  ws.getRow(3).height = 19.95;
  const headers = [
    { label: "Id Proyecto", align: "left" },
    { label: "Número", align: "left" },
    { label: "Nombre proyecto", align: "left" },
    { label: "Jurado", align: "left" },
    { label: "Email", align: "left" },
    { label: "Evaluado", align: "center" },
  ] as const;

  headers.forEach(({ label, align }, i) => {
    const cell = ws.getCell(3, i + 1);
    cell.value = label;
    cell.font = { name: "Calibri", bold: true, size: 11 };
    cell.fill = headerRowFill();
    cell.alignment = { horizontal: align, vertical: "middle" };
    cell.border = thinBorder(["left", "right", "top", "bottom"]);
  });

  ws.autoFilter = { from: "A3", to: "F3" };
  ws.views = [{ state: "frozen", xSplit: 0, ySplit: 3 }];

  let rowNum = 4;
  let globalIdx = 0;
  for (const p of projects) {
    for (const judge of p.jurorAssignments) {
      const row = ws.getRow(rowNum);
      row.height = 19.95;

      const isAlternate = globalIdx % 2 === 1;
      const fill = isAlternate
        ? ({ type: "pattern", pattern: "solid", fgColor: { argb: "FFF2F2F2" } } as ExcelJS.Fill)
        : ({ type: "pattern", pattern: "solid", fgColor: { argb: COLORS.white } } as ExcelJS.Fill);

      const values: (string | number | Date | boolean)[] = [
        p.id,
        p.number,
        p.name,
        judge.name,
        judge.email,
        judge.evaluated ? "Sí" : "No",
      ];

      values.forEach((val, ci) => {
        const cell = ws.getCell(rowNum, ci + 1);
        cell.value = val as ExcelJS.CellValue;
        cell.font = { name: "Calibri", size: 11 };
        cell.fill = fill;
        cell.alignment = {
          horizontal: ci >= 5 ? "center" : "left",
          vertical: "middle",
        };
        cell.border = thinBorder(["left", "right", "top", "bottom"]);
        if (ci === 5) cell.numFmt = "dd/mm/yyyy";
      });

      rowNum++;
      globalIdx++;
    }
  }
}

// Main export function

export async function generateEventReport(data: EventReportData): Promise<Blob> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Event Report Generator";
  wb.created = new Date();

  buildDashboardSheet(wb, data.eventName, data.reportDate, data.dashboard);
  buildProjectsSummarySheet(wb, data.projects);
  buildParticipantsSheet(wb, data.projects);
  buildJudgesSheet(wb, data.projects);

  const buffer = await wb.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}