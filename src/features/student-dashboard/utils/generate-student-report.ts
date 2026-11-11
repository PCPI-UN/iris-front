import * as ExcelJS from 'exceljs';
import { StudentEvaluation, StudentProfile, StudentProjectInfo } from '../types';

export interface GenerateIndividualReportParams {
  profile: StudentProfile;
  project: StudentProjectInfo | null;
  evaluation: StudentEvaluation | null;
}

export async function generateIndividualStudentReport({
  profile,
  project,
  evaluation,
}: GenerateIndividualReportParams): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'IRIS - Sistema de Evaluación de Proyectos';
  wb.created = new Date();

  const ws = wb.addWorksheet('Reporte Individual', {
    properties: { tabColor: { argb: '00CACB' } },
    views: [{ showGridLines: true }],
  });

  // Configurar anchos de columna
  ws.columns = [
    { key: 'colA', width: 6 },
    { key: 'colB', width: 28 },
    { key: 'colC', width: 34 },
    { key: 'colD', width: 18 },
    { key: 'colE', width: 18 },
    { key: 'colF', width: 20 },
  ];

  // Paleta oficial
  const PRIMARY_COLOR = '00CACB';
  const HEADER_FILL = '0C101B';
  const LIGHT_FILL = 'F1F5F9';

  // 1. TÍTULO PRINCIPAL
  const titleRow = ws.addRow(['', 'UNIVERSIDAD DEL NORTE - SISTEMA IRIS']);
  titleRow.getCell(2).font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFF' } };
  titleRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } };
  ws.mergeCells('B1:F1');

  const subtitleRow = ws.addRow(['', 'Reporte Individual de Evaluación de Proyecto']);
  subtitleRow.getCell(2).font = { name: 'Arial', size: 11, bold: true, color: { argb: PRIMARY_COLOR } };
  subtitleRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } };
  ws.mergeCells('B2:F2');

  ws.addRow([]); // Espacio

  // 2. DATOS DEL ESTUDIANTE Y DEL PROYECTO
  const addSectionHeader = (title: string) => {
    const row = ws.addRow(['', title]);
    row.getCell(2).font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFF' } };
    row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E293B' } };
    ws.mergeCells(`B${row.number}:F${row.number}`);
    return row;
  };

  addSectionHeader('1. INFORMACIÓN DEL PARTICIPANTE Y PROYECTO');

  const addDataRow = (label: string, value: string) => {
    const row = ws.addRow(['', label, value]);
    row.getCell(2).font = { name: 'Arial', size: 9, bold: true };
    row.getCell(3).font = { name: 'Arial', size: 9 };
    ws.mergeCells(`C${row.number}:F${row.number}`);
  };

  addDataRow('Estudiante:', `${profile.firstName} ${profile.lastName}`);
  addDataRow('Código Estudiantil:', profile.studentCode || 'N/A');
  addDataRow('Programa Académico:', profile.career || 'N/A');
  addDataRow('Evento:', project?.eventName || 'Feria de Proyectos');
  addDataRow('Código de Proyecto:', project?.projectCode || 'N/A');
  addDataRow('Título del Proyecto:', project?.name || 'N/A');
  addDataRow('Categoría:', project?.categoryName || 'General');
  addDataRow('Estado de Inscripción:', project?.enrollmentStatus || 'N/A');

  ws.addRow([]); // Espacio

  // 3. DESGLOSE DE EVALUACIÓN
  addSectionHeader('2. EVALUACIÓN Y CALIFICACIONES OFICIALES');

  if (evaluation && evaluation.resultsPublished) {
    // Encabezado de la tabla de rúbricas
    const tableHeader = ws.addRow([
      '',
      'Componente',
      'Criterio de Evaluación',
      'Ponderación (%)',
      'Calificación',
      'Máximo Posible',
    ]);

    tableHeader.eachCell((cell, colNumber) => {
      if (colNumber >= 2) {
        cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0F172A' } };
        cell.alignment = { horizontal: colNumber >= 4 ? 'center' : 'left' };
      }
    });

    const criteria = evaluation.criteriaScores || [];
    criteria.forEach((crit, index) => {
      const row = ws.addRow([
        '',
        crit.component || 'General',
        crit.criterion,
        crit.weight ? `${crit.weight}%` : '-',
        crit.score.toFixed(2),
        crit.maxScore.toFixed(2),
      ]);

      const isEven = index % 2 === 0;
      row.eachCell((cell, colNumber) => {
        if (colNumber >= 2) {
          cell.font = { name: 'Arial', size: 9 };
          if (isEven) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_FILL } };
          }
          if (colNumber >= 4) {
            cell.alignment = { horizontal: 'center' };
          }
        }
      });
    });

    ws.addRow([]); // Espacio

    // Resumen de puntaje y posición
    const scoreSummaryRow = ws.addRow([
      '',
      'PUNTAJE FINAL CONSOLIDADO:',
      `${evaluation.finalScore?.toFixed(2)} / ${evaluation.maxScore?.toFixed(2)}`,
      'POSICIÓN:',
      evaluation.ranking
        ? `Puesto ${evaluation.ranking.position}${evaluation.ranking.isCoWinner ? ' (Coganador)' : ''}`
        : 'N/A',
    ]);
    scoreSummaryRow.getCell(2).font = { name: 'Arial', size: 10, bold: true, color: { argb: '0F172A' } };
    scoreSummaryRow.getCell(3).font = { name: 'Arial', size: 11, bold: true, color: { argb: '0284C7' } };
    scoreSummaryRow.getCell(4).font = { name: 'Arial', size: 10, bold: true, color: { argb: '0F172A' } };
    scoreSummaryRow.getCell(5).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'D97706' } };

    // Observaciones consolidadas
    if (evaluation.consolidatedFeedback) {
      ws.addRow([]);
      addSectionHeader('3. OBSERVACIONES CONSOLIDADAS DE JURADOS');
      const feedbackRow = ws.addRow(['', evaluation.consolidatedFeedback]);
      feedbackRow.getCell(2).font = { name: 'Arial', size: 9, italic: true };
      feedbackRow.getCell(2).alignment = { wrapText: true };
      ws.mergeCells(`B${feedbackRow.number}:F${feedbackRow.number + 1}`);
    }
  } else {
    const pendingRow = ws.addRow([
      '',
      'Las calificaciones de este certamen se encuentran en proceso de consolidación oficial.',
    ]);
    pendingRow.getCell(2).font = { name: 'Arial', size: 10, italic: true, color: { argb: '64748B' } };
    ws.mergeCells(`B${pendingRow.number}:F${pendingRow.number}`);
  }

  // Generar Buffer y disparar descarga
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'Reporte_Evaluacion_Feria_Proyectos_aprobado.xlsx';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}

