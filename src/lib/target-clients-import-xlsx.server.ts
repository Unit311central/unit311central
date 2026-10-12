import "server-only";

import * as XLSX from "xlsx";

import type { ParsedSpreadsheet } from "@/lib/target-clients-import";
import { TARGET_CLIENTS_IMPORT_MAX_ROWS } from "@/lib/target-clients-import";

function sheetToMatrix(sheet: XLSX.WorkSheet): string[][] {
  const ref = sheet["!ref"];
  if (!ref) return [];
  const range = XLSX.utils.decode_range(ref);
  const rows: string[][] = [];
  for (let r = range.s.r; r <= range.e.r; r += 1) {
    const row: string[] = [];
    for (let c = range.s.c; c <= range.e.c; c += 1) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = sheet[addr] as XLSX.CellObject | undefined;
      const raw = cell?.w ?? (cell?.v != null ? String(cell.v) : "");
      row.push(String(raw).trim());
    }
    rows.push(row);
  }
  return rows;
}

export function parseTargetClientsXlsxBuffer(
  buffer: Buffer,
  sheetName?: string,
): ParsedSpreadsheet & { sheetNames: string[] } {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: false, cellFormula: false });
  const sheetNames = workbook.SheetNames;
  if (sheetNames.length === 0) {
    return { headers: [], rows: [], sheetNames: [] };
  }
  const selected = sheetName && sheetNames.includes(sheetName) ? sheetName : sheetNames[0];
  const sheet = workbook.Sheets[selected];
  const matrix = sheetToMatrix(sheet);
  if (matrix.length === 0) {
    return { headers: [], rows: [], sheetNames };
  }
  const [headerRow, ...dataRows] = matrix;
  const headers = headerRow.map((cell) => cell.trim());
  const rows = dataRows
    .filter((cells) => cells.some((cell) => cell.trim() !== ""))
    .slice(0, TARGET_CLIENTS_IMPORT_MAX_ROWS)
    .map((cells) => headers.map((_, idx) => (cells[idx] ?? "").trim()));

  return { headers, rows, sheetNames };
}

export function listXlsxSheetNames(buffer: Buffer): string[] {
  const workbook = XLSX.read(buffer, { type: "buffer", bookSheets: true });
  return workbook.SheetNames;
}
