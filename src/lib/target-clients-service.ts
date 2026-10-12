import { findCrmLeadsForContact } from "@/lib/crm-contact-service";
import { mapCrmLead, type CrmLead } from "@/lib/crm-data";
import {
  createLead,
  deleteLead,
  requireLeadInWorkspace,
  resolveCrmWorkspaceId,
  updateLead,
} from "@/lib/crm-leads-service";
import { isOpportunityLead } from "@/lib/sales-management-insights";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { createTenancyServerClient } from "@/lib/supabase/tenancy-server";
import {
  TARGET_CLIENTS_CRM_SOURCE,
  assertTargetClientLead,
  mapLeadToTargetClientRow,
  normalizeTargetClientWebsiteInput,
  resolveTargetClientContactNameForSave,
  type AddTargetClientFormValues,
  type TargetClientRow,
} from "@/lib/target-clients";

type DbLead = Parameters<typeof mapCrmLead>[0];

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

async function assertNoDuplicateTargetClient(
  values: AddTargetClientFormValues,
  scope: { workspaceId?: string },
  excludeLeadId?: string,
) {
  const companyName = values.companyName.trim();
  const email = values.email.trim();
  const duplicateCheck = await findCrmLeadsForContact(
    { organisation: companyName, email },
    scope,
  );
  const others = excludeLeadId
    ? duplicateCheck.matches.filter((lead) => lead.id !== excludeLeadId)
    : duplicateCheck.matches;
  if (others.length === 0) return;
  throw new TargetClientDuplicateError(
    others.length > 1 ? "DUPLICATE_AMBIGUOUS" : "DUPLICATE",
    others,
  );
}

export async function listTargetClients(scope?: {
  workspaceId?: string;
}): Promise<TargetClientRow[]> {
  const workspaceId = await resolveCrmWorkspaceId(scope);
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }
  const supabase = createTenancyServerClient();
  const { data, error } = await supabase
    .from("crm_leads")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("source", TARGET_CLIENTS_CRM_SOURCE)
    .eq("status", "Cold")
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as DbLead[]).map((row) => mapLeadToTargetClientRow(mapCrmLead(row)));
}

export async function requireTargetClientLead(
  id: string,
  scope?: { workspaceId?: string },
): Promise<CrmLead> {
  const lead = await requireLeadInWorkspace(id, scope);
  assertTargetClientLead(lead);
  return lead;
}

function formValuesToLeadPatch(values: AddTargetClientFormValues) {
  const websiteNorm = normalizeTargetClientWebsiteInput(values.website).normalized;
  return {
    companyName: values.companyName.trim(),
    contactName: resolveTargetClientContactNameForSave(values.contactName),
    email: values.email.trim(),
    companyWebsite: websiteNorm,
    industry: values.sector.trim(),
    role: values.contactPosition.trim(),
    source: TARGET_CLIENTS_CRM_SOURCE,
    status: "Cold" as const,
  };
}

export async function createTargetClientFromForm(
  values: AddTargetClientFormValues,
  scope?: { workspaceId?: string },
): Promise<TargetClientRow> {
  await assertNoDuplicateTargetClient(values, scope ?? {});

  const patch = formValuesToLeadPatch(values);
  const lead = await createLead(
    {
      companyName: patch.companyName,
      contactName: patch.contactName,
      email: patch.email || undefined,
      companyWebsite: patch.companyWebsite || undefined,
      industry: patch.industry || undefined,
      role: patch.role || undefined,
      status: "Cold",
      source: TARGET_CLIENTS_CRM_SOURCE,
    },
    scope,
  );

  return mapLeadToTargetClientRow(lead);
}

export async function updateTargetClientFromForm(
  id: string,
  values: AddTargetClientFormValues,
  scope?: { workspaceId?: string },
): Promise<TargetClientRow> {
  await requireTargetClientLead(id, scope);
  await assertNoDuplicateTargetClient(values, scope ?? {}, id);

  const patch = formValuesToLeadPatch(values);
  const lead = await updateLead(
    id,
    {
      companyName: patch.companyName,
      contactName: patch.contactName,
      email: patch.email,
      companyWebsite: patch.companyWebsite,
      industry: patch.industry,
      role: patch.role,
      source: TARGET_CLIENTS_CRM_SOURCE,
      status: "Cold",
    },
    scope,
  );

  return mapLeadToTargetClientRow(lead);
}

export async function deleteTargetClient(
  id: string,
  scope?: { workspaceId?: string },
): Promise<void> {
  await requireTargetClientLead(id, scope);
  await deleteLead(id, scope);
}

export type PromoteTargetClientResult = {
  lead: CrmLead;
  alreadyPromoted: boolean;
  opportunityId: string;
};

export async function promoteTargetClientToOpportunity(
  id: string,
  scope?: { workspaceId?: string },
): Promise<PromoteTargetClientResult> {
  const lead = await requireLeadInWorkspace(id, scope);
  if (lead.source.trim().toLowerCase() !== TARGET_CLIENTS_CRM_SOURCE.toLowerCase()) {
    throw new Error("Record is not a Target Client in this workspace.");
  }

  if (lead.status !== "Cold") {
    if (isOpportunityLead(lead.status)) {
      return { lead, alreadyPromoted: true, opportunityId: lead.id };
    }
    throw new Error("This Target Client cannot be moved to Opportunities in its current state.");
  }

  const updated = await updateLead(
    id,
    {
      status: "Warm",
      nextAction: lead.nextAction?.trim() || "Qualify opportunity",
    },
    scope,
  );

  return { lead: updated, alreadyPromoted: false, opportunityId: updated.id };
}

/** Read-only metadata for operational investigation (no mutations). */
export async function describeTargetClientCandidates(scope?: {
  workspaceId?: string;
  companyNames?: string[];
}): Promise<
  Array<{
    id: string;
    companyName: string;
    source: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    isTargetClientListMember: boolean;
  }>
> {
  const workspaceId = await resolveCrmWorkspaceId(scope);
  if (!isSupabaseConfigured()) return [];
  const supabase = createTenancyServerClient();
  let query = supabase
    .from("crm_leads")
    .select("id, company_name, source, status, created_at, updated_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });

  const names = scope?.companyNames?.filter(Boolean);
  if (names?.length) {
    query = query.in("company_name", names);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const source = String((row as { source?: string }).source ?? "");
    const status = String((row as { status?: string }).status ?? "");
    return {
      id: String((row as { id: string }).id),
      companyName: String((row as { company_name: string }).company_name),
      source,
      status,
      createdAt: String((row as { created_at: string }).created_at),
      updatedAt: String((row as { updated_at: string }).updated_at),
      isTargetClientListMember:
        status === "Cold" &&
        source.trim().toLowerCase() === TARGET_CLIENTS_CRM_SOURCE.toLowerCase(),
    };
  });
}
