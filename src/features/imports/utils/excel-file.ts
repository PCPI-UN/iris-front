/**
 * Shared helpers for the Excel imports (jurors and projects): file checks,
 * download of the template and the summary, and safe CSV cells.
 */

export const XLSX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const ALLOWED_XLSX_MIME_TYPES = new Set([
  XLSX_MIME_TYPE,
  "application/octet-stream",
  "",
]);

export const MB = 1024 * 1024;

/** Validates eventId is a safe positive integer before building endpoint paths */
export function parseValidEventId(eventId: unknown): number | null {
  const num = Number(eventId);

  if (!Number.isInteger(num) || num <= 0) return null;

  return num;
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < MB) return `${(bytes / 1024).toFixed(1)} KB`;

  return `${(bytes / MB).toFixed(2)} MB`;
}

const formatMaxSize = (maxBytes: number) =>
  maxBytes % MB === 0 ? `${maxBytes / MB} MB` : formatBytes(maxBytes);

/** Synchronous checks for file extension, MIME type, and size bounds */
export function validateExcelFileMeta(
  file: File | null | undefined,
  maxBytes: number,
): string | null {
  if (!file) {
    return "Selecciona un archivo Excel (.xlsx) antes de continuar.";
  }

  const lowerName = file.name.trim().toLowerCase();

  if (!lowerName.endsWith(".xlsx")) {
    return "Formato no permitido. Sube un archivo Excel con extensión .xlsx.";
  }

  if (file.type && !ALLOWED_XLSX_MIME_TYPES.has(file.type.toLowerCase())) {
    return "El tipo MIME del archivo no corresponde a un libro de Excel (.xlsx).";
  }

  if (file.size <= 0) {
    return "El archivo está vacío. Descarga la plantilla oficial y diligénciala.";
  }

  if (file.size > maxBytes) {
    return `El archivo supera el tamaño máximo permitido de ${formatMaxSize(maxBytes)}.`;
  }

  return null;
}

async function readBlobBytes(blob: Blob): Promise<Uint8Array> {
  if (typeof blob.arrayBuffer === "function") {
    return new Uint8Array(await blob.arrayBuffer());
  }

  if (typeof FileReader !== "undefined") {
    return new Promise<Uint8Array>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(new Uint8Array(reader.result));
        } else {
          reject(new Error("Unexpected FileReader result"));
        }
      };
      reader.onerror = () =>
        reject(reader.error ?? new Error("FileReader error"));
      reader.readAsArrayBuffer(blob);
    });
  }

  return new Uint8Array(await new Response(blob).arrayBuffer());
}

/** Verifies OOXML ZIP magic bytes (PK\x03\x04) so renamed HTML/scripts are rejected client-side */
export async function validateExcelFile(
  file: File | null | undefined,
  maxBytes: number,
): Promise<string | null> {
  const metaError = validateExcelFileMeta(file, maxBytes);

  if (metaError || !file) return metaError;

  if (file.size < 4) {
    return "El archivo no tiene una estructura Excel (.xlsx) válida.";
  }

  try {
    const bytes = await readBlobBytes(file.slice(0, 4));
    const isZipSignature =
      bytes.length >= 4 &&
      bytes[0] === 0x50 &&
      bytes[1] === 0x4b &&
      bytes[2] === 0x03 &&
      bytes[3] === 0x04;

    if (!isZipSignature) {
      return "El contenido del archivo no corresponde a un archivo Excel (.xlsx) válido.";
    }
  } catch {
    return "No pudimos leer el archivo seleccionado. Intenta nuevamente.";
  }

  return null;
}

export function sanitizeDownloadFileName(
  fileName: string | null | undefined,
  fallback: string,
): string {
  if (!fileName) return fallback;
  const baseName = fileName
    .split(/[/\\]/)
    .pop()

    ?.replace(/[\u0000-\u001f\u007f<>:"|?*]/g, "")
    .replace(/^\.+/, "")
    .trim();

  if (!baseName) return fallback;

  return baseName.toLowerCase().endsWith(".xlsx")
    ? baseName
    : `${baseName}.xlsx`;
}

export const triggerBlobDownload = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

/** Prevents Excel/CSV formula injection (=, +, -, @, tab, CR) when exporting summaries */
export function sanitizeSpreadsheetCell(value: unknown): string {
  const str = String(value ?? "");
  const safe = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;

  return `"${safe.replace(/"/g, '""')}"`;
}

/** CSV with UTF-8 BOM so Excel opens Spanish accents properly */
export const buildCsv = (headers: string[], rows: unknown[][]) =>
  `﻿${[headers, ...rows]
    .map((row) => row.map(sanitizeSpreadsheetCell).join(","))
    .join("\r\n")}`;
