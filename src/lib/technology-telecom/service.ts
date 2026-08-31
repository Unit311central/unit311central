import { buildTechnologyTelecomStarterCatalogue, buildSaecTechnologyTelecomCatalogue } from "@/lib/technology-telecom/starter-catalogue";
import { isSaecSlug } from "@/lib/saec-surface";
import { isCustomerWorkspaceSlug } from "@/lib/customer-workspace-surface";
import type {
  TechnologyTelecomService,
  TechnologyTelecomServiceInput,
  TelecomServiceStatus,
} from "@/lib/technology-telecom/types";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { createTenancyServerClient } from "@/lib/supabase/tenancy-server";
import { requireCurrentWorkspace } from "@/lib/workspace-context";
import { resolveWorkspaceReportingCurrency } from "@/lib/workspace-reporting-currency-server";

export type TechnologyTelecomWorkspaceScope = { workspaceId?: string };

type DbRow = {
  id: string;
  workspace_id: string;
  service: string;
  carrier: string;
  number_or_circuit: string;
  assigned_to: string;
  location: string | null;
  monthly_cost_minor: number;
  currency: string;
  status: string;
  manufacturer: string | null;
  model: string | null;
  created_at: string;
  updated_at: string;
};

function db() {
  if (!isSupabaseConfigured()) throw new Error("Supabase is not configured.");
  return createTenancyServerClient();
}

async function resolveWorkspaceId(scope?: TechnologyTelecomWorkspaceScope): Promise<string> {
  if (scope?.workspaceId?.trim()) return scope.workspaceId.trim();
  return (await requireCurrentWorkspace()).id;
}

function mapRow(row: DbRow): TechnologyTelecomService {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    service: row.service,
    carrier: row.carrier,
    numberOrCircuit: row.number_or_circuit,
    assignedTo: row.assigned_to,
    location: row.location,
    monthlyCostMinor: row.monthly_cost_minor,
    currency: row.currency,
    status: row.status as TelecomServiceStatus,
    manufacturer: row.manufacturer,
    model: row.model,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function ensureTechnologyTelecomStarterCatalogue(
  workspaceId: string,
  workspaceSlug?: string | null,
): Promise<{ inserted: number; skipped: boolean }> {
  const client = db();
  const { count, error: countError } = await client
    .from("technology_telecom_services")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);
  if (countError) throw new Error(countError.message);
  if ((count ?? 0) > 0) return { inserted: 0, skipped: true };

  const normalizedSlug = String(workspaceSlug ?? "").trim().toLowerCase();
  if (isCustomerWorkspaceSlug(normalizedSlug) && !isSaecSlug(normalizedSlug)) {
    return { inserted: 0, skipped: true };
  }

  const currency = await resolveWorkspaceReportingCurrency(workspaceId, workspaceSlug);
  const catalogue = isSaecSlug(workspaceSlug)
    ? buildSaecTechnologyTelecomCatalogue()
    : buildTechnologyTelecomStarterCatalogue();
  const payload = catalogue.map((row) => ({
    workspace_id: workspaceId,
    service: row.service,
    carrier: row.carrier,
    number_or_circuit: row.numberOrCircuit ?? "",
    assigned_to: row.assignedTo ?? "",
    location: row.location ?? null,
    monthly_cost_minor: Math.max(0, row.monthlyCostMinor ?? 0),
    currency,
    status: row.status ?? "Active",
    manufacturer: row.manufacturer ?? null,
    model: row.model ?? null,
  }));

  const { error } = await client.from("technology_telecom_services").insert(payload);
  if (error) throw new Error(error.message);
  return { inserted: payload.length, skipped: false };
}

export async function listTechnologyTelecomServices(
  scope?: TechnologyTelecomWorkspaceScope,
): Promise<TechnologyTelecomService[]> {
  const workspaceId = await resolveWorkspaceId(scope);
  let workspaceSlug: string | null = null;
  try {
    workspaceSlug = (await requireCurrentWorkspace()).slug;
  } catch {
    /* explicit scope callers */
  }
  await ensureTechnologyTelecomStarterCatalogue(workspaceId, workspaceSlug);

  const { data, error } = await db()
    .from("technology_telecom_services")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as DbRow[]).map(mapRow);
}

export async function createTechnologyTelecomService(
  input: TechnologyTelecomServiceInput,
  scope?: TechnologyTelecomWorkspaceScope,
): Promise<TechnologyTelecomService> {
  const workspace = await requireCurrentWorkspace();
  const workspaceId = await resolveWorkspaceId({ workspaceId: scope?.workspaceId ?? workspace.id });
  const currency = await resolveWorkspaceReportingCurrency(workspaceId, workspace.slug);
  const { data, error } = await db()
    .from("technology_telecom_services")
    .insert({
      workspace_id: workspaceId,
      service: input.service.trim() || "Mobile plan",
      carrier: input.carrier.trim(),
      number_or_circuit: input.numberOrCircuit?.trim() ?? "",
      assigned_to: input.assignedTo?.trim() ?? "",
      location: input.location?.trim() || null,
      monthly_cost_minor: Math.max(0, input.monthlyCostMinor ?? 0),
      currency,
      status: input.status ?? "Active",
      manufacturer: input.manufacturer?.trim() || null,
      model: input.model?.trim() || null,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapRow(data as DbRow);
}

export async function updateTechnologyTelecomService(
  id: string,
  input: TechnologyTelecomServiceInput,
  scope?: TechnologyTelecomWorkspaceScope,
): Promise<TechnologyTelecomService> {
  const workspaceId = await resolveWorkspaceId(scope);
  const { data, error } = await db()
    .from("technology_telecom_services")
    .update({
      service: input.service.trim() || "Mobile plan",
      carrier: input.carrier.trim(),
      number_or_circuit: input.numberOrCircuit?.trim() ?? "",
      assigned_to: input.assignedTo?.trim() ?? "",
      location: input.location?.trim() || null,
      monthly_cost_minor: Math.max(0, input.monthlyCostMinor ?? 0),
      status: input.status ?? "Active",
      manufacturer: input.manufacturer?.trim() || null,
      model: input.model?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("workspace_id", workspaceId)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapRow(data as DbRow);
}

export async function deleteTechnologyTelecomService(
  id: string,
  scope?: TechnologyTelecomWorkspaceScope,
): Promise<void> {
  const workspaceId = await resolveWorkspaceId(scope);
  const { error } = await db()
    .from("technology_telecom_services")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export function sumTelecomMonthlySpend(services: readonly TechnologyTelecomService[]): number {
  return services.reduce((sum, row) => sum + row.monthlyCostMinor, 0);
}
