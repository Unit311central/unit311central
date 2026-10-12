import {
  normalizeTargetClientWebsiteInput,
  normalizeTargetClientSectorForSave,
  normalizeTargetClientNotesForSave,
  validateAddTargetClientForm,
  validateTargetClientEmail,
  validateTargetClientNotes,
  validateTargetClientSector,
  type AddTargetClientFormValues,
} from "@/lib/target-clients";

export const TARGET_CLIENTS_IMPORT_MAX_FILE_BYTES = 5 * 1024 * 1024;
export const TARGET_CLIENTS_IMPORT_MAX_ROWS = 2000;

export type TargetClientImportField = keyof AddTargetClientFormValues;

export const TARGET_CLIENT_IMPORT_FIELDS: TargetClientImportField[] = [
  "companyName",
  "website",
  "sector",
  "contactName",
  "contactPosition",
  "email",
  "notes",
];

export const TARGET_CLIENT_IMPORT_FIELD_LABELS: Record<TargetClientImportField, string> = {
  companyName: "Company Name",
  website: "Website",
  sector: "Sector",
  contactName: "Contact Name",
  contactPosition: "Contact Position",
  email: "Email Address",
  notes: "Notes",
};

const FIELD_ALIASES: Record<TargetClientImportField, readonly string[]> = {
  companyName: [
    "company name",
    "company",
    "organisation",
    "organization",
    "business name",
    "org",
    "account name",
  ],
  website: ["website", "web address", "url", "company website", "domain", "web site"],
  sector: ["sector", "industry", "market sector", "business sector"],
  contactName: ["contact name", "contact", "primary contact", "full name", "name"],
  contactPosition: ["contact position", "position", "job title", "role", "contact's role", "title"],
  email: ["email", "email address", "work email", "business email", "e-mail"],
  notes: ["notes", "client notes", "research notes", "prospect notes", "comments"],
};

export type ParsedSpreadsheet = {
  headers: string[];
  rows: string[][];
  sheetNames?: string[];
};

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current);
  return cells;
}

function parseCsvRecords(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
      continue;
    }
    if (char === ",") {
      row.push(cell);
      cell = "";
      continue;
    }
    if (char === "\n" || (char === "\r" && text[i + 1] === "\n")) {
      if (char === "\r") i += 1;
      row.push(cell);
      if (row.some((value) => value.trim() !== "")) {
        rows.push(row);
      }
      row = [];
      cell = "";
      continue;
    }
    cell += char;
  }

  row.push(cell);
  if (row.some((value) => value.trim() !== "")) {
    rows.push(row);
  }

  return rows;
}

export function parseTargetClientsCsv(text: string): ParsedSpreadsheet {
  const normalized = text.replace(/^\uFEFF/, "");
  const records = parseCsvRecords(normalized);

  if (records.length === 0) {
    return { headers: [], rows: [] };
  }

  const [headerRow, ...dataRows] = records;
  const headers = headerRow.map((cell) => cell.trim());
  const rows = dataRows
    .filter((cells) => cells.some((cell) => cell.trim() !== ""))
    .map((cells) => headers.map((_, idx) => (cells[idx] ?? "").trim()));

  return { headers, rows };
}

export function suggestColumnMapping(headers: string[]): Partial<Record<TargetClientImportField, number>> {
  const normalized = headers.map(normalizeHeader);
  const used = new Set<number>();
  const mapping: Partial<Record<TargetClientImportField, number>> = {};

  for (const field of TARGET_CLIENT_IMPORT_FIELDS) {
    for (const alias of FIELD_ALIASES[field]) {
      const idx = normalized.indexOf(alias);
      if (idx >= 0 && !used.has(idx)) {
        mapping[field] = idx;
        used.add(idx);
        break;
      }
    }
  }

  return mapping;
}

export function applyColumnMapping(
  headers: string[],
  rows: string[][],
  mapping: Partial<Record<TargetClientImportField, number>>,
): Array<AddTargetClientFormValues & { sourceRowNumber: number }> {
  return rows.map((cells, index) => {
    const pick = (field: TargetClientImportField) => {
      const col = mapping[field];
      if (col == null || col < 0) return "";
      return (cells[col] ?? "").trim();
    };
    return {
      sourceRowNumber: index + 2,
      companyName: pick("companyName"),
      website: pick("website"),
      sector: pick("sector"),
      contactName: pick("contactName"),
      contactPosition: pick("contactPosition"),
      email: pick("email"),
      notes: pick("notes"),
    };
  });
}

export type ImportRowPreviewStatus =
  | "ready"
  | "error"
  | "duplicate_file"
  | "duplicate_crm"
  | "excluded";

export type ImportRowPreview = {
  sourceRowNumber: number;
  values: AddTargetClientFormValues;
  normalizedWebsite: string;
  status: ImportRowPreviewStatus;
  messages: string[];
};

export function matchesExistingCrm(
  values: AddTargetClientFormValues,
  existingCrmDuplicateKeys: ReadonlySet<string>,
): boolean {
  const email = values.email.trim().toLowerCase();
  if (email && existingCrmDuplicateKeys.has(`email:${email}`)) return true;
  const company = values.companyName.trim().toLowerCase();
  if (company && existingCrmDuplicateKeys.has(`company:${company}`)) return true;
  return false;
}

function duplicateKeysForRow(values: AddTargetClientFormValues): string[] {
  const keys: string[] = [];
  const email = values.email.trim().toLowerCase();
  const company = values.companyName.trim().toLowerCase();
  if (email) keys.push(`email:${email}`);
  if (company) keys.push(`company:${company}`);
  return keys;
}

export function previewImportRows(
  mappedRows: Array<AddTargetClientFormValues & { sourceRowNumber: number }>,
  existingCrmDuplicateKeys: ReadonlySet<string>,
): ImportRowPreview[] {
  const seenInFile = new Set<string>();
  const previews: ImportRowPreview[] = [];

  for (const row of mappedRows) {
    const messages: string[] = [];
    let status: ImportRowPreviewStatus = "ready";

    const companyName = row.companyName.trim();
    const formErrors = validateAddTargetClientForm(row);
    const missingCompany = Boolean(formErrors.companyName);
    if (missingCompany) {
      messages.push(formErrors.companyName!);
    }

    const websiteNorm = normalizeTargetClientWebsiteInput(row.website).normalized;
    const sectorNormalized = normalizeTargetClientSectorForSave(row.sector);

    const keys = duplicateKeysForRow(row);
    let fileDuplicate = false;
    if (companyName && keys.some((key) => seenInFile.has(key))) {
      fileDuplicate = true;
      status = "duplicate_file";
      messages.push("Duplicate row within this spreadsheet (same company or email).");
    } else if (companyName) {
      for (const key of keys) seenInFile.add(key);
    }

    if (!fileDuplicate && companyName && matchesExistingCrm(row, existingCrmDuplicateKeys)) {
      status = "duplicate_crm";
      messages.push("Matches an existing CRM record (company or email).");
    }

    if (!fileDuplicate && status !== "duplicate_crm") {
      if (missingCompany) {
        status = "error";
      } else {
        if (formErrors.website) {
          messages.push(formErrors.website);
          status = "error";
        }
        if (formErrors.email) {
          messages.push(formErrors.email);
          status = "error";
        }
        const sectorError = validateTargetClientSector(row.sector);
        if (sectorError) {
          messages.push(sectorError);
          status = "error";
        }
        const notesError = validateTargetClientNotes(row.notes);
        if (notesError) {
          messages.push(notesError);
          status = "error";
        }
      }
    }

    previews.push({
      sourceRowNumber: row.sourceRowNumber,
      values: {
        companyName,
        website: row.website.trim(),
        sector: sectorNormalized,
        contactName: row.contactName.trim(),
        contactPosition: row.contactPosition.trim(),
        email: row.email.trim(),
        notes: normalizeTargetClientNotesForSave(row.notes),
      },
      normalizedWebsite: websiteNorm,
      status,
      messages,
    });
  }

  return previews;
}

export function buildCrmDuplicateKeysFromLeads(
  leads: Array<{ companyName: string; email: string }>,
): Set<string> {
  const keys = new Set<string>();
  for (const lead of leads) {
    const email = lead.email?.trim().toLowerCase();
    if (email) keys.add(`email:${email}`);
    const company = lead.companyName.trim().toLowerCase();
    if (company) keys.add(`company:${company}`);
  }
  return keys;
}

export function rejectedRowsToCsv(
  previews: ImportRowPreview[],
  originalHeaders: string[],
  originalRows: string[][],
): string {
  const header = ["Source row", "Reason", ...originalHeaders];
  const lines = [header.map(escapeCsvCell).join(",")];
  for (const preview of previews) {
    if (preview.status === "ready") continue;
    const rowIdx = preview.sourceRowNumber - 2;
    const original = originalRows[rowIdx] ?? [];
    lines.push(
      [
        String(preview.sourceRowNumber),
        preview.messages.join("; "),
        ...originalHeaders.map((_, i) => original[i] ?? ""),
      ]
        .map(escapeCsvCell)
        .join(","),
    );
  }
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

function escapeCsvCell(value: string): string {
  const safe = sanitizeCsvExportCell(value);
  if (/[",\r\n]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

export function sanitizeCsvExportCell(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^[=+\-@]/.test(trimmed)) {
    return `'${trimmed}`;
  }
  return trimmed;
}
