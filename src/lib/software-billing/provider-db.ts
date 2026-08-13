import {
  SOFTWARE_PROVIDER_BILLING_MIGRATION_PATH,
  ensureSoftwareProviderBillingTables,
  withSoftwareProviderBillingTables,
} from "@/lib/internal-db-migrations";
import { createSupabaseServiceRoleClient, isSupabaseServiceRoleConfigured } from "@/lib/supabase/server";
import type {
  PeriodKind,
  ProviderConnectionState,
  ProviderPeriodSnapshot,
} from "@/lib/software-billing/types";
import { VERCEL_PROVIDER_SLUG } from "@/lib/software-billing/types";

function requireServiceClient() {
  if (!isSupabaseServiceRoleConfigured()) {
    throw new Error("Supabase service role is not configured.");
  }
  return createSupabaseServiceRoleClient();
}

function mapSnapshot(row: Record<string, unknown>): ProviderPeriodSnapshot {
  return {
    id: String(row.id),
    workspaceId: String(row.workspace_id),
    providerSlug: String(row.provider_slug),
    periodStart: String(row.period_start),
    periodEnd: String(row.period_end),
    periodKind: row.period_kind as PeriodKind,
    currency: String(row.currency ?? "USD"),
    baseSubscriptionAmount: Number(row.base_subscription_amount ?? 0),
    usageEffectiveAmount: Number(row.usage_effective_amount ?? 0),
    usageBilledAmount: Number(row.usage_billed_amount ?? 0),
    creditsAppliedAmount: Number(row.credits_applied_amount ?? 0),
    additionalPurchasesAmount: Number(row.additional_purchases_amount ?? 0),
    taxAmount: Number(row.tax_amount ?? 0),
    adjustmentsAmount: Number(row.adjustments_amount ?? 0),
    billedAmount: Number(row.billed_amount ?? 0),
    projectedAmount:
      row.projected_amount == null ? null : Number(row.projected_amount),
    chargeLineCount: Number(row.charge_line_count ?? 0),
    planName: String(row.plan_name ?? ""),
    planIteration: String(row.plan_iteration ?? ""),
    seatCount: row.seat_count == null ? null : Number(row.seat_count),
    rawSummary: (row.raw_summary as Record<string, unknown>) ?? {},
    updatedAt: String(row.updated_at ?? row.created_at ?? new Date().toISOString()),
  };
}

export async function ensureBillingTablesReady() {
  await ensureSoftwareProviderBillingTables();
}

export async function getProviderConnection(
  workspaceId: string,
  providerSlug: string,
): Promise<ProviderConnectionState | null> {
  return withSoftwareProviderBillingTables(async () => {
    const supabase = requireServiceClient();
    const { data, error } = await supabase
      .from("software_provider_connections")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("provider_slug", providerSlug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    return {
      providerSlug: String(data.provider_slug),
      softwareAssetId: data.software_asset_id ? String(data.software_asset_id) : null,
      externalTeamId: String(data.external_team_id ?? ""),
      externalTeamSlug: String(data.external_team_slug ?? ""),
      currency: String(data.currency ?? "USD"),
      isEnabled: Boolean(data.is_enabled),
      lastSuccessfulSyncAt: data.last_successful_sync_at
        ? String(data.last_successful_sync_at)
        : null,
      lastSyncStatus: String(data.last_sync_status ?? "never"),
      lastSyncError: String(data.last_sync_error ?? ""),
    };
  });
}

export async function upsertProviderConnection(input: {
  workspaceId: string;
  providerSlug: string;
  softwareAssetId: string | null;
  externalTeamId: string;
  externalTeamSlug: string;
  currency: string;
  lastSuccessfulSyncAt?: string | null;
  lastSyncStatus: string;
  lastSyncError?: string;
}) {
  return withSoftwareProviderBillingTables(async () => {
    const supabase = requireServiceClient();
    const { error } = await supabase.from("software_provider_connections").upsert(
      {
        workspace_id: input.workspaceId,
        provider_slug: input.providerSlug,
        software_asset_id: input.softwareAssetId,
        external_team_id: input.externalTeamId,
        external_team_slug: input.externalTeamSlug,
        currency: input.currency,
        is_enabled: true,
        last_successful_sync_at: input.lastSuccessfulSyncAt ?? null,
        last_sync_status: input.lastSyncStatus,
        last_sync_error: input.lastSyncError ?? "",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "workspace_id,provider_slug" },
    );
    if (error) throw new Error(error.message);
  });
}

export async function createSyncRun(workspaceId: string, providerSlug: string) {
  return withSoftwareProviderBillingTables(async () => {
    const supabase = requireServiceClient();
    const { data, error } = await supabase
      .from("software_provider_sync_runs")
      .insert({
        workspace_id: workspaceId,
        provider_slug: providerSlug,
        status: "running",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return String(data.id);
  });
}

export async function finishSyncRun(input: {
  runId: string;
  status: "success" | "failed";
  recordsFetched: number;
  errorMessage?: string;
}) {
  return withSoftwareProviderBillingTables(async () => {
    const supabase = requireServiceClient();
    const { error } = await supabase
      .from("software_provider_sync_runs")
      .update({
        status: input.status,
        records_fetched: input.recordsFetched,
        error_message: input.errorMessage ?? "",
        finished_at: new Date().toISOString(),
      })
      .eq("id", input.runId);
    if (error) throw new Error(error.message);
  });
}

export async function upsertPeriodSnapshot(input: {
  workspaceId: string;
  providerSlug: string;
  periodStart: string;
  periodEnd: string;
  periodKind: PeriodKind;
  currency: string;
  baseSubscriptionAmount: number;
  usageEffectiveAmount: number;
  usageBilledAmount: number;
  creditsAppliedAmount: number;
  additionalPurchasesAmount: number;
  taxAmount: number;
  adjustmentsAmount: number;
  billedAmount: number;
  projectedAmount: number | null;
  chargeLineCount: number;
  planName: string;
  planIteration: string;
  seatCount: number | null;
  rawSummary: Record<string, unknown>;
}) {
  return withSoftwareProviderBillingTables(async () => {
    const supabase = requireServiceClient();
    const payload = {
      workspace_id: input.workspaceId,
      provider_slug: input.providerSlug,
      period_start: input.periodStart,
      period_end: input.periodEnd,
      period_kind: input.periodKind,
      currency: input.currency,
      base_subscription_amount: input.baseSubscriptionAmount,
      usage_effective_amount: input.usageEffectiveAmount,
      usage_billed_amount: input.usageBilledAmount,
      credits_applied_amount: input.creditsAppliedAmount,
      additional_purchases_amount: input.additionalPurchasesAmount,
      tax_amount: input.taxAmount,
      adjustments_amount: input.adjustmentsAmount,
      billed_amount: input.billedAmount,
      projected_amount: input.projectedAmount,
      charge_line_count: input.chargeLineCount,
      plan_name: input.planName,
      plan_iteration: input.planIteration,
      seat_count: input.seatCount,
      raw_summary: input.rawSummary,
      source: "vercel_api",
      updated_at: new Date().toISOString(),
    };

    if (input.periodKind === "completed") {
      const { data: existing } = await supabase
        .from("software_provider_period_snapshots")
        .select("id")
        .eq("workspace_id", input.workspaceId)
        .eq("provider_slug", input.providerSlug)
        .eq("period_start", input.periodStart)
        .eq("period_kind", "completed")
        .maybeSingle();
      if (existing?.id) {
        const { error } = await supabase
          .from("software_provider_period_snapshots")
          .update(payload)
          .eq("id", existing.id);
        if (error) throw new Error(error.message);
        return String(existing.id);
      }
    }

    const { data, error } = await supabase
      .from("software_provider_period_snapshots")
      .upsert(payload, {
        onConflict: "workspace_id,provider_slug,period_start,period_kind",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return String(data.id);
  });
}

export async function replaceChargeFacts(input: {
  snapshotId: string;
  workspaceId: string;
  providerSlug: string;
  facts: Array<{
    chargeDate: string;
    serviceName: string;
    chargeCategory: string;
    effectiveCost: number;
    billedCost: number;
    pricingQuantity: number;
    tags: Record<string, string>;
  }>;
}) {
  return withSoftwareProviderBillingTables(async () => {
    const supabase = requireServiceClient();
    await supabase
      .from("software_provider_charge_facts")
      .delete()
      .eq("snapshot_id", input.snapshotId);
    if (input.facts.length === 0) return;
    const rows = input.facts.map((fact) => ({
      snapshot_id: input.snapshotId,
      workspace_id: input.workspaceId,
      provider_slug: input.providerSlug,
      charge_date: fact.chargeDate,
      service_name: fact.serviceName,
      charge_category: fact.chargeCategory,
      effective_cost: fact.effectiveCost,
      billed_cost: fact.billedCost,
      pricing_quantity: fact.pricingQuantity,
      tags: fact.tags,
    }));
    const { error } = await supabase.from("software_provider_charge_facts").insert(rows);
    if (error) throw new Error(error.message);
  });
}

export async function listPeriodSnapshots(
  workspaceId: string,
  providerSlug: string,
): Promise<ProviderPeriodSnapshot[]> {
  return withSoftwareProviderBillingTables(async () => {
    const supabase = requireServiceClient();
    const { data, error } = await supabase
      .from("software_provider_period_snapshots")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("provider_slug", providerSlug)
      .order("period_start", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => mapSnapshot(row));
  });
}

export async function findVercelSoftwareAssetId(workspaceId: string): Promise<string | null> {
  return findProviderSoftwareAssetId(workspaceId, VERCEL_PROVIDER_SLUG);
}

export async function findProviderSoftwareAssetId(
  workspaceId: string,
  providerSlug: string,
): Promise<string | null> {
  if (providerSlug === VERCEL_PROVIDER_SLUG) {
    const supabase = requireServiceClient();
    const { data: bySlug } = await supabase
      .from("software_assets")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("provider_slug", VERCEL_PROVIDER_SLUG)
      .maybeSingle();
    if (bySlug?.id) return String(bySlug.id);

    const { data: byVendor } = await supabase
      .from("software_assets")
      .select("id, name, vendor")
      .eq("workspace_id", workspaceId);
    const match = (byVendor ?? []).find((row) => {
      const vendor = String(row.vendor ?? "").toLowerCase();
      const name = String(row.name ?? "").toLowerCase();
      return vendor.includes("vercel") || name.includes("vercel");
    });
    if (!match?.id) return null;

    await supabase
      .from("software_assets")
      .update({ provider_slug: VERCEL_PROVIDER_SLUG, updated_at: new Date().toISOString() })
      .eq("id", match.id);
    return String(match.id);
  }

  const supabase = requireServiceClient();
  const { data: bySlug } = await supabase
    .from("software_assets")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("provider_slug", providerSlug)
    .maybeSingle();
  return bySlug?.id ? String(bySlug.id) : null;
}

export async function updateVercelAssetFromSnapshot(input: {
  softwareAssetId: string;
  billedAmount: number;
  periodEnd: string;
  syncStatus: string;
  connected: boolean;
}) {
  return updateProviderAssetFromSnapshot(input);
}

export async function updateProviderAssetFromSnapshot(input: {
  softwareAssetId: string;
  billedAmount: number;
  periodEnd: string;
  syncStatus: string;
  connected: boolean;
}) {
  const supabase = requireServiceClient();
  const { error } = await supabase
    .from("software_assets")
    .update({
      integration_connected: input.connected,
      integration_sync_status: input.syncStatus,
      last_payment_amount: input.billedAmount,
      last_payment_date: input.periodEnd.slice(0, 10),
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.softwareAssetId);
  if (error) throw new Error(error.message);
}

export { SOFTWARE_PROVIDER_BILLING_MIGRATION_PATH };
