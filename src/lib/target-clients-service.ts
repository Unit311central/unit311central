import { findCrmLeadsForContact } from "@/lib/crm-contact-service";
import type { CrmLead } from "@/lib/crm-data";
import { createLead, listLeads } from "@/lib/crm-leads-service";
import {
  TARGET_CLIENTS_CRM_SOURCE,
  isTargetClientLead,
  mapLeadToTargetClientRow,
  normalizeTargetClientWebsiteInput,
  resolveTargetClientContactNameForSave,
  type AddTargetClientFormValues,
  type TargetClientRow,
} from "@/lib/target-clients";

export class TargetClientDuplicateError extends Error {
  readonly code: "DUPLICATE" | "DUPLICATE_AMBIGUOUS";
  readonly matches: CrmLead[];

  constructor(code: "DUPLICATE" | "DUPLICATE_AMBIGUOUS", matches: CrmLead[]) {
    const names = matches.map((m) => m.companyName).join(", ");
    super(
      code === "DUPLICATE_AMBIGUOUS"
        ? `Multiple CRM records match this company or email (${names}). Review existing records before creating another.`
        : `A target client already exists for this company or email (${matches[0]?.companyName ?? "existing record"}). Open the existing record or use a different company name or email.`,
    );
    this.name = "TargetClientDuplicateError";
    this.code = code;
    this.matches = matches;
  }
}

export async function listTargetClients(scope?: {
  workspaceId?: string;
}): Promise<TargetClientRow[]> {
  const leads = await listLeads("Cold", scope);
  return leads.filter(isTargetClientLead).map(mapLeadToTargetClientRow);
}

export async function createTargetClientFromForm(
  values: AddTargetClientFormValues,
  scope?: { workspaceId?: string },
): Promise<TargetClientRow> {
  const companyName = values.companyName.trim();
  const email = values.email.trim();
  const websiteNorm = normalizeTargetClientWebsiteInput(values.website).normalized;

  const duplicateCheck = await findCrmLeadsForContact(
    { organisation: companyName, email },
    scope,
  );
  if (duplicateCheck.matches.length > 0) {
    throw new TargetClientDuplicateError(
      duplicateCheck.ambiguous ? "DUPLICATE_AMBIGUOUS" : "DUPLICATE",
      duplicateCheck.matches,
    );
  }

  const lead = await createLead(
    {
      companyName,
      contactName: resolveTargetClientContactNameForSave(values.contactName),
      email: email || undefined,
      companyWebsite: websiteNorm || undefined,
      industry: values.sector.trim() || undefined,
      role: values.contactPosition.trim() || undefined,
      status: "Cold",
      source: TARGET_CLIENTS_CRM_SOURCE,
    },
    scope,
  );

  return mapLeadToTargetClientRow(lead);
}
