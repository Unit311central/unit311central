import type { CrmLead } from "@/lib/crm-data";
import { CRM_CLIENT_REPORT_NOTES_PREFIX } from "@/lib/crm-client-report-notes";
import { CLIENT_INDUSTRY_OPTIONS } from "@/lib/client-management-data";
import { isTargetClientsRolloutHost } from "@/lib/sales-management-target-clients";

/** Stored on `crm_leads.notes` for Target Client free-text (separate from opportunity client-report JSON block). */
export const TARGET_CLIENT_NOTES_MAX_LENGTH = 5000;

/** Stored on `crm_leads.industry` — free text with suggested values for UI/import. */
export const TARGET_CLIENT_SECTOR_MAX_LENGTH = 120;

const TARGET_CLIENT_SECTOR_EXTRA_SUGGESTIONS = [
  "Technology",
  "Manufacturing",
  "Financial Services",
  "Professional Services",
  "Healthcare & Life Sciences",
  "Retail & Consumer",
  "Telecom & Media",
  "Agriculture",
  "Aerospace & Defence",
  "Real Estate",
  "Hospitality & Leisure",
  "Education",
  "Non-profit & Charity",
  "Transport",
] as const;

/** Datalist / import hints — not an exhaustive allow-list. */
export const TARGET_CLIENT_SECTOR_SUGGESTIONS: readonly string[] = [
  ...CLIENT_INDUSTRY_OPTIONS,
  ...TARGET_CLIENT_SECTOR_EXTRA_SUGGESTIONS.filter(
    (value) => !CLIENT_INDUSTRY_OPTIONS.includes(value as (typeof CLIENT_INDUSTRY_OPTIONS)[number]),
  ),
];

export function normalizeTargetClientSectorForSave(sector: string): string {
  return sector.trim().replace(/\s+/g, " ");
}

export function validateTargetClientSector(sector: string): string | null {
  const normalized = normalizeTargetClientSectorForSave(sector);
  if (!normalized) return null;
  if (normalized.length > TARGET_CLIENT_SECTOR_MAX_LENGTH) {
    return `Sector must be ${TARGET_CLIENT_SECTOR_MAX_LENGTH} characters or fewer.`;
  }
  if (/[\r\n\t\u0000-\u001f]/.test(normalized)) {
    return "Sector contains invalid characters.";
  }
  return null;
}

/** CRM source value for records created from Sales → Target Clients (internal central). */
export const TARGET_CLIENTS_CRM_SOURCE = "Target Clients";

export type TargetClientRow = {
  id: string;
  companyName: string;
  website: string;
  sector: string;
  contactName: string;
  contactPosition: string;
  email: string;
  notes: string;
  contacted: boolean;
};

export type AddTargetClientFormValues = {
  companyName: string;
  website: string;
  sector: string;
  contactName: string;
  contactPosition: string;
  email: string;
  notes: string;
};

/** Modal field order (Add Target Client). */
export const ADD_TARGET_CLIENT_FIELD_ORDER = [
  "companyName",
  "website",
  "sector",
  "contactName",
  "contactPosition",
  "email",
  "notes",
] as const satisfies readonly (keyof AddTargetClientFormValues)[];

export function normalizeTargetClientNotesForSave(notes: string): string {
  return notes.replace(/^\s+|\s+$/g, "");
}

/** User-visible notes only (strips embedded CRM client-report JSON block if present). */
export function displayTargetClientNotes(stored: string | null | undefined): string {
  if (!stored) return "";
  const prefixIndex = stored.indexOf(CRM_CLIENT_REPORT_NOTES_PREFIX);
  const text = prefixIndex >= 0 ? stored.slice(0, prefixIndex) : stored;
  return normalizeTargetClientNotesForSave(text);
}

export function validateTargetClientNotes(notes: string): string | null {
  const normalized = normalizeTargetClientNotesForSave(notes);
  if (!normalized) return null;
  if (normalized.length > TARGET_CLIENT_NOTES_MAX_LENGTH) {
    return `Notes must be ${TARGET_CLIENT_NOTES_MAX_LENGTH} characters or fewer.`;
  }
  return null;
}

export type TargetClientFieldErrors = Partial<
  Record<keyof AddTargetClientFormValues, string>
> & {
  form?: string;
};

/** Target Clients register: explicit source + pre-opportunity Cold status. */
export function isTargetClientLead(lead: CrmLead): boolean {
  return (
    lead.status === "Cold" &&
    lead.source.trim().toLowerCase() === TARGET_CLIENTS_CRM_SOURCE.toLowerCase()
  );
}

export function assertTargetClientLead(lead: CrmLead): void {
  if (!isTargetClientLead(lead)) {
    throw new Error("Record is not a Target Client in this workspace.");
  }
}

export function mapLeadToTargetClientRow(lead: CrmLead): TargetClientRow {
  return {
    id: lead.id,
    companyName: lead.companyName,
    website: lead.companyWebsite?.trim() ?? "",
    sector: lead.industry?.trim() ?? "",
    contactName: displayContactName(lead.contactName),
    contactPosition: lead.role?.trim() ?? "",
    email: lead.email?.trim() ?? "",
    notes: displayTargetClientNotes(lead.notes),
    contacted: lead.contactCount > 0 || Boolean(lead.lastContactAt),
  };
}

function displayContactName(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed || trimmed === "—" || trimmed === "-") return "";
  return trimmed;
}

export function resolveTargetClientContactNameForSave(contactName: string): string {
  const trimmed = contactName.trim();
  return trimmed || "—";
}

export function normalizeTargetClientWebsiteInput(value: string): {
  normalized: string;
  error: string | null;
} {
  const trimmed = value.trim();
  if (!trimmed) return { normalized: "", error: null };

  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed);
  const toParse = hasScheme ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(toParse);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return { normalized: "", error: "Enter a valid website address." };
    }
    const hostname = url.hostname;
    if (!hostname || !hostname.includes(".")) {
      return { normalized: "", error: "Enter a valid website address." };
    }
    const normalized =
      url.pathname === "/" && !url.search && !url.hash ? url.origin : url.href.replace(/\/$/, "");
    return { normalized, error: null };
  } catch {
    return { normalized: "", error: "Enter a valid website address." };
  }
}

/** Safe external href for table/view links; null when not http(s). */
export function targetClientWebsiteHref(website: string): string | null {
  const trimmed = website.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.href;
  } catch {
    return null;
  }
}

export function rowToFormValues(row: TargetClientRow): AddTargetClientFormValues {
  return {
    companyName: row.companyName,
    website: row.website,
    sector: row.sector,
    contactName: row.contactName,
    contactPosition: row.contactPosition,
    email: row.email,
    notes: row.notes,
  };
}

export function validateTargetClientEmail(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return "Enter a valid email address.";
  }
  return null;
}

export function validateAddTargetClientForm(
  values: AddTargetClientFormValues,
): TargetClientFieldErrors {
  const errors: TargetClientFieldErrors = {};
  const companyName = values.companyName.trim();
  if (!companyName) {
    errors.companyName = "Company name is required.";
  }
  const websiteResult = normalizeTargetClientWebsiteInput(values.website);
  if (websiteResult.error) {
    errors.website = websiteResult.error;
  }
  const emailError = validateTargetClientEmail(values.email);
  if (emailError) errors.email = emailError;
  const notesError = validateTargetClientNotes(values.notes);
  if (notesError) errors.notes = notesError;
  return errors;
}

export function searchTargetClientRows(rows: TargetClientRow[], query: string): TargetClientRow[] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((row) => {
    const haystack = [
      row.companyName,
      row.website,
      row.sector,
      row.contactName,
      row.contactPosition,
      row.email,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function assertTargetClientsApiHost(hostname: string | null | undefined): void {
  if (!isTargetClientsRolloutHost(hostname)) {
    throw new Error(
      "Target Clients is only available on Internal, Demo and WOLF Sales Management workspaces.",
    );
  }
}
