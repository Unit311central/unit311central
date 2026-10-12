import type { CrmLead } from "@/lib/crm-data";
import { isTargetClientsRolloutHost } from "@/lib/sales-management-target-clients";

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
  contacted: boolean;
};

export type AddTargetClientFormValues = {
  companyName: string;
  website: string;
  sector: string;
  contactName: string;
  contactPosition: string;
  email: string;
};

/** Modal field order (Add Target Client). */
export const ADD_TARGET_CLIENT_FIELD_ORDER = [
  "companyName",
  "website",
  "sector",
  "contactName",
  "contactPosition",
  "email",
] as const satisfies readonly (keyof AddTargetClientFormValues)[];

export type TargetClientFieldErrors = Partial<
  Record<keyof AddTargetClientFormValues, string>
> & {
  form?: string;
};

export function isTargetClientLead(lead: CrmLead): boolean {
  return lead.status === "Cold";
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
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    if (!url.hostname.includes(".")) {
      return { normalized: "", error: "Enter a valid website URL." };
    }
    return { normalized: withScheme, error: null };
  } catch {
    return { normalized: "", error: "Enter a valid website URL." };
  }
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
    throw new Error("Target Clients is only available on the internal Unit311Central workspace.");
  }
}
