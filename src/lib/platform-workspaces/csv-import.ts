import type {
  CsvValidationResult,
  WorkspaceImportClient,
  WorkspaceImportEmployee,
} from "@/lib/platform-workspaces/types";

function splitCsvLine(line: string): string[] {
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
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current.trim());
  return cells;
}

function parseCsv(text: string): string[][] {
  return text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map(splitCsvLine);
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

const EMPLOYEE_HEADERS = {
  email: ["email", "work_email", "user_email"],
  firstName: ["first_name", "firstname", "given_name"],
  lastName: ["last_name", "lastname", "family_name", "surname"],
  role: ["role", "job_title", "title"],
  department: ["department", "dept", "team"],
} as const;

const CLIENT_HEADERS = {
  name: ["name", "client_name", "company", "organisation", "organization"],
  email: ["email", "contact_email", "primary_email"],
  country: ["country", "country_code", "region"],
} as const;

function resolveColumnIndex(headers: string[], aliases: readonly string[]): number {
  const normalized = headers.map(normalizeHeader);
  for (const alias of aliases) {
    const idx = normalized.indexOf(alias);
    if (idx >= 0) return idx;
  }
  return -1;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function validateEmployeeCsv(text: string): CsvValidationResult<WorkspaceImportEmployee> {
  const rows = parseCsv(text);
  if (rows.length === 0) {
    return { rows: [], errors: [{ row: 0, message: "CSV is empty." }] };
  }

  const [header, ...dataRows] = rows;
  const emailIdx = resolveColumnIndex(header, EMPLOYEE_HEADERS.email);
  const firstIdx = resolveColumnIndex(header, EMPLOYEE_HEADERS.firstName);
  const lastIdx = resolveColumnIndex(header, EMPLOYEE_HEADERS.lastName);
  const roleIdx = resolveColumnIndex(header, EMPLOYEE_HEADERS.role);
  const deptIdx = resolveColumnIndex(header, EMPLOYEE_HEADERS.department);

  const errors: Array<{ row: number; message: string }> = [];
  if (emailIdx < 0 || firstIdx < 0 || lastIdx < 0) {
    errors.push({
      row: 1,
      message: "Required columns: email, first_name, last_name.",
    });
    return { rows: [], errors };
  }

  const parsed: WorkspaceImportEmployee[] = [];
  const seenEmails = new Set<string>();

  dataRows.forEach((cells, index) => {
    const rowNumber = index + 2;
    const email = (cells[emailIdx] ?? "").trim().toLowerCase();
    const firstName = (cells[firstIdx] ?? "").trim();
    const lastName = (cells[lastIdx] ?? "").trim();
    const role = roleIdx >= 0 ? (cells[roleIdx] ?? "").trim() : "";
    const department = deptIdx >= 0 ? (cells[deptIdx] ?? "").trim() : "";

    if (!email || !firstName || !lastName) {
      errors.push({ row: rowNumber, message: "email, first_name, and last_name are required." });
      return;
    }
    if (!isValidEmail(email)) {
      errors.push({ row: rowNumber, message: `Invalid email: ${email}` });
      return;
    }
    if (seenEmails.has(email)) {
      errors.push({ row: rowNumber, message: `Duplicate email: ${email}` });
      return;
    }
    seenEmails.add(email);
    parsed.push({
      email,
      firstName,
      lastName,
      ...(role ? { role } : {}),
      ...(department ? { department } : {}),
    });
  });

  return { rows: parsed, errors };
}

export function validateClientCsv(text: string): CsvValidationResult<WorkspaceImportClient> {
  const rows = parseCsv(text);
  if (rows.length === 0) {
    return { rows: [], errors: [{ row: 0, message: "CSV is empty." }] };
  }

  const [header, ...dataRows] = rows;
  const nameIdx = resolveColumnIndex(header, CLIENT_HEADERS.name);
  const emailIdx = resolveColumnIndex(header, CLIENT_HEADERS.email);
  const countryIdx = resolveColumnIndex(header, CLIENT_HEADERS.country);

  const errors: Array<{ row: number; message: string }> = [];
  if (nameIdx < 0) {
    errors.push({ row: 1, message: "Required column: name (or client_name)." });
    return { rows: [], errors };
  }

  const parsed: WorkspaceImportClient[] = [];
  dataRows.forEach((cells, index) => {
    const rowNumber = index + 2;
    const name = (cells[nameIdx] ?? "").trim();
    const email = emailIdx >= 0 ? (cells[emailIdx] ?? "").trim() : "";
    const country = countryIdx >= 0 ? (cells[countryIdx] ?? "").trim() : "";

    if (!name) {
      errors.push({ row: rowNumber, message: "name is required." });
      return;
    }
    if (email && !isValidEmail(email)) {
      errors.push({ row: rowNumber, message: `Invalid email: ${email}` });
      return;
    }
    parsed.push({
      name,
      ...(email ? { email } : {}),
      ...(country ? { country } : {}),
    });
  });

  return { rows: parsed, errors };
}

export const EMPLOYEE_CSV_TEMPLATE = [
  "email,first_name,last_name,role,department",
  "jane.smith@example.com,Jane,Smith,Manager,Operations",
  "john.doe@example.com,John,Doe,Associate,Sales",
].join("\n");

export const CLIENT_CSV_TEMPLATE = [
  "name,email,country",
  "Acme Aviation Ltd,ops@acme.example.com,United Kingdom",
  "Northwind Logistics,contact@northwind.example.com,United States",
].join("\n");
