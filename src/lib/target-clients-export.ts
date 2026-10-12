import type { TargetClientRow } from "@/lib/target-clients";
import { sanitizeCsvExportCell } from "@/lib/target-clients-import";

export const TARGET_CLIENTS_EXPORT_HEADERS = [
  "Company Name",
  "Website",
  "Sector",
  "Contact Name",
  "Contact Position",
  "Email Address",
  "Contacted?",
  "Notes",
] as const;

function escapeCsvCell(value: string): string {
  const safe = sanitizeCsvExportCell(value);
  if (/[",\r\n]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

export function targetClientsExportFilename(date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `unit311-target-clients-${y}-${m}-${d}.csv`;
}

export function buildTargetClientsExportCsv(rows: TargetClientRow[]): string {
  const lines: string[] = [
    TARGET_CLIENTS_EXPORT_HEADERS.map(escapeCsvCell).join(","),
  ];

  for (const row of rows) {
    lines.push(
      [
        row.companyName,
        row.website,
        row.sector,
        row.contactName,
        row.contactPosition,
        row.email,
        row.contacted ? "Yes" : "No",
        row.notes,
      ]
        .map(escapeCsvCell)
        .join(","),
    );
  }

  return `\uFEFF${lines.join("\r\n")}\r\n`;
}
