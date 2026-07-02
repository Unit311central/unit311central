import {
  createBlankClient,
  mapInternalClient,
  type ManagedClient,
} from "@/lib/client-management-data";
import {
  ensureInternalClientsFilesFolderColumns,
  ensureInternalClientsTable,
  withInternalClientsFilesFolderColumns,
  withInternalClientsTable,
} from "@/lib/internal-db-migrations";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

type DbClient = Parameters<typeof mapInternalClient>[0];

function requireClientsSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.");
  }
  return createSupabaseServerClient();
}

function buildClientPayload(input: Partial<ManagedClient>) {
  const payload: Record<string, string | number | null> = {
    updated_at: new Date().toISOString(),
  };

  if (input.companyName !== undefined) payload.company_name = input.companyName.trim();
  if (input.industry !== undefined) payload.industry = input.industry;
  if (input.primaryContact !== undefined) payload.primary_contact = input.primaryContact.trim();
  if (input.email !== undefined) payload.email = input.email.trim();
  if (input.phone !== undefined) payload.phone = input.phone.trim();
  if (input.region !== undefined) payload.region = input.region;
  if (input.accountStatus !== undefined) payload.account_status = input.accountStatus;
  if (input.contractType !== undefined) payload.contract_type = input.contractType;
  if (input.taxId !== undefined) payload.tax_id = input.taxId.trim();
  if (input.billingAddress !== undefined) payload.billing_address = input.billingAddress.trim();
  if (input.activeProjects !== undefined) payload.active_projects = input.activeProjects;
  if (input.notes !== undefined) payload.notes = input.notes.trim();
  if (input.platformUrl !== undefined) payload.platform_url = input.platformUrl.trim() || null;
  if (input.filesFolderId !== undefined) payload.files_folder_id = input.filesFolderId?.trim() || null;
  if (input.filesFolderName !== undefined) {
    payload.files_folder_name = input.filesFolderName?.trim() || null;
  }

  return payload;
}

export async function listInternalClients(): Promise<ManagedClient[]> {
  await ensureInternalClientsTable();
  await ensureInternalClientsFilesFolderColumns();
  return withInternalClientsFilesFolderColumns(() =>
    withInternalClientsTable(async () => {
      const supabase = requireClientsSupabase();
      const { data, error } = await supabase
        .from("internal_clients")
        .select("*")
        .order("company_name", { ascending: true });

      if (error) throw new Error(error.message);
      return (data as DbClient[]).map(mapInternalClient);
    }),
  );
}

export async function createInternalClient(
  input: Partial<ManagedClient> & { companyName?: string },
): Promise<ManagedClient> {
  await ensureInternalClientsTable();
  return withInternalClientsTable(async () => {
    const supabase = requireClientsSupabase();
    const blank = createBlankClient();
    const id = `client-${crypto.randomUUID().slice(0, 8)}`;

    const { data, error } = await supabase
      .from("internal_clients")
      .insert({
        id,
        company_name: input.companyName?.trim() || blank.companyName || "New Client",
        industry: input.industry ?? blank.industry,
        primary_contact: input.primaryContact?.trim() ?? blank.primaryContact,
        email: input.email?.trim() ?? blank.email,
        phone: input.phone?.trim() ?? blank.phone,
        region: input.region ?? blank.region,
        account_status: input.accountStatus ?? blank.accountStatus,
        contract_type: input.contractType ?? blank.contractType,
        tax_id: input.taxId?.trim() ?? blank.taxId,
        billing_address: input.billingAddress?.trim() ?? blank.billingAddress,
        active_projects: input.activeProjects ?? blank.activeProjects,
        notes: input.notes?.trim() ?? blank.notes,
        platform_url: input.platformUrl?.trim() || null,
      })
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return mapInternalClient(data as DbClient);
  });
}

export async function updateInternalClient(
  id: string,
  patch: Partial<ManagedClient>,
): Promise<ManagedClient> {
  return withInternalClientsFilesFolderColumns(() =>
    withInternalClientsTable(async () => {
      const supabase = requireClientsSupabase();
      const payload = buildClientPayload(patch);

      const { data, error } = await supabase
        .from("internal_clients")
        .update(payload)
        .eq("id", id)
        .select("*")
        .single();

      if (error) throw new Error(error.message);
      return mapInternalClient(data as DbClient);
    }),
  );
}

export async function deleteInternalClient(id: string) {
  return withInternalClientsTable(async () => {
    const supabase = requireClientsSupabase();
    const { error } = await supabase.from("internal_clients").delete().eq("id", id);
    if (error) throw new Error(error.message);
  });
}
