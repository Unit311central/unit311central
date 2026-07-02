import { createBlankLeadInput, mapCrmLead, type CrmLead, type LeadStatus } from "@/lib/crm-data";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

type DbLead = Parameters<typeof mapCrmLead>[0];

function requireCrmSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.");
  }
  return createSupabaseServerClient();
}

export async function listLeads(status?: LeadStatus | "All"): Promise<CrmLead[]> {
  const supabase = requireCrmSupabase();
  let query = supabase.from("crm_leads").select("*").order("updated_at", { ascending: false });

  if (status && status !== "All") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as DbLead[]).map(mapCrmLead);
}

export async function createLead(
  input: Partial<ReturnType<typeof createBlankLeadInput>> & {
    companyName: string;
    contactName: string;
  },
): Promise<CrmLead> {
  const supabase = requireCrmSupabase();
  const { data, error } = await supabase
    .from("crm_leads")
    .insert({
      company_name: input.companyName.trim(),
      contact_name: input.contactName.trim(),
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      status: input.status ?? "Cold",
      source: input.source?.trim() || null,
      next_action: input.nextAction?.trim() || null,
      next_action_date: input.nextActionDate || null,
      estimated_value: input.estimatedValue ?? null,
      notes: input.notes?.trim() || null,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return mapCrmLead(data as DbLead);
}

export async function updateLead(
  id: string,
  patch: Partial<{
    companyName: string;
    contactName: string;
    email: string;
    phone: string;
    status: LeadStatus;
    source: string;
    nextAction: string;
    nextActionDate: string | null;
    estimatedValue: number | null;
    notes: string;
  }>,
): Promise<CrmLead> {
  const supabase = requireCrmSupabase();
  const payload: Record<string, string | number | null> = {
    updated_at: new Date().toISOString(),
  };

  if (patch.companyName !== undefined) payload.company_name = patch.companyName.trim();
  if (patch.contactName !== undefined) payload.contact_name = patch.contactName.trim();
  if (patch.email !== undefined) payload.email = patch.email.trim() || null;
  if (patch.phone !== undefined) payload.phone = patch.phone.trim() || null;
  if (patch.status !== undefined) payload.status = patch.status;
  if (patch.source !== undefined) payload.source = patch.source.trim() || null;
  if (patch.nextAction !== undefined) payload.next_action = patch.nextAction.trim() || null;
  if (patch.nextActionDate !== undefined) payload.next_action_date = patch.nextActionDate;
  if (patch.estimatedValue !== undefined) payload.estimated_value = patch.estimatedValue;
  if (patch.notes !== undefined) payload.notes = patch.notes.trim() || null;

  const { data, error } = await supabase
    .from("crm_leads")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return mapCrmLead(data as DbLead);
}

export async function deleteLead(id: string) {
  const supabase = requireCrmSupabase();
  const { error } = await supabase.from("crm_leads").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
