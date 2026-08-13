/**
 * Map existing Vercel billing sync output into the Software & SaaS register record.
 * Reuses provider snapshots/team data — does not call Vercel APIs directly.
 *
 * Manual/internal fields (purpose, owners, allocated licences, credential notes, etc.)
 * are never overwritten.
 */

import type { VercelTeamBilling } from "@/lib/software-billing/types";
import { VERCEL_PROVIDER_SLUG } from "@/lib/software-billing/types";
import { findVercelSoftwareAssetId } from "@/lib/software-billing/provider-db";
import { createSupabaseServiceRoleClient, isSupabaseServiceRoleConfigured } from "@/lib/supabase/server";

function requireServiceClient() {
  if (!isSupabaseServiceRoleConfigured()) {
    throw new Error("Supabase service role is not configured.");
  }
  return createSupabaseServiceRoleClient();
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function formatPlanLabel(plan: string, iteration: string | null) {
  const normalized = String(plan || "unknown").trim();
  const title =
    normalized.length > 0
      ? normalized.charAt(0).toUpperCase() + normalized.slice(1)
      : "Unknown";
  return iteration ? `${title} (${iteration})` : title;
}

export function buildVercelSoftwareAssetUpdate(input: {
  team: VercelTeamBilling;
  previousBilledAmount: number;
  previousPeriodEnd: string;
  currentBilledAmount: number;
  currentProjectedAmount: number | null;
  syncedAt: string;
}) {
  const { team } = input;
  const planLabel = formatPlanLabel(team.plan, team.planIteration);
  const monthlyCost = round2(
    input.currentProjectedAmount ??
      input.currentBilledAmount ??
      team.baseSubscriptionMonthly,
  );

  return {
    name: `Vercel ${planLabel}`,
    vendor: "Vercel",
    provider_slug: VERCEL_PROVIDER_SLUG,
    category: "Infrastructure & Cloud",
    website_url: "https://vercel.com",
    support_url: "https://vercel.com/help",
    documentation_url: "https://vercel.com/docs",
    monthly_cost: monthlyCost,
    annual_cost: round2(monthlyCost * 12),
    currency: team.currency,
    last_payment_amount: round2(input.previousBilledAmount),
    last_payment_date: input.previousPeriodEnd.slice(0, 10),
    next_renewal_date: team.periodEnd.slice(0, 10),
    renewal_frequency: "Monthly",
    contract_length: team.planIteration
      ? `Vercel plan iteration ${team.planIteration}`
      : `Vercel ${planLabel}`,
    licences_purchased: team.seatCount > 0 ? team.seatCount : 1,
    licence_type: team.seatCount > 1 ? "Per user" : "Named",
    integration_connected: true,
    integration_api_key_set: true,
    integration_oauth_status: "Server API token",
    integration_sync_status: `Synced ${input.syncedAt}`,
    supplier_name: "Vercel",
    supplier_company: "Vercel Inc.",
    customer_number: team.teamId,
    invoice_reference: team.teamSlug,
    status: "Active",
    updated_at: input.syncedAt,
  };
}

export async function ensureVercelSoftwareAsset(workspaceId: string): Promise<string> {
  const existing = await findVercelSoftwareAssetId(workspaceId);
  if (existing) return existing;

  const supabase = requireServiceClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("software_assets")
    .insert({
      workspace_id: workspaceId,
      name: "Vercel",
      vendor: "Vercel",
      provider_slug: VERCEL_PROVIDER_SLUG,
      category: "Infrastructure & Cloud",
      website_url: "https://vercel.com",
      status: "Active",
      currency: "USD",
      renewal_frequency: "Monthly",
      integration_connected: false,
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return String(data.id);
}

/**
 * Apply Vercel sync results to the linked software_assets row (+ portal URL only).
 * Returns the software asset id used for the provider connection.
 */
export async function applyVercelSyncToSoftwareAsset(input: {
  workspaceId: string;
  team: VercelTeamBilling;
  previousBilledAmount: number;
  previousPeriodEnd: string;
  currentBilledAmount: number;
  currentProjectedAmount: number | null;
  syncedAt: string;
}): Promise<string> {
  const softwareAssetId = await ensureVercelSoftwareAsset(input.workspaceId);
  const supabase = requireServiceClient();
  const patch = buildVercelSoftwareAssetUpdate(input);

  const { error } = await supabase
    .from("software_assets")
    .update(patch)
    .eq("id", softwareAssetId)
    .eq("workspace_id", input.workspaceId);

  if (error) throw new Error(error.message);

  const portalUrl = `https://vercel.com/${input.team.teamSlug}`;
  const { error: credentialsError } = await supabase.from("software_asset_credentials").upsert(
    {
      software_asset_id: softwareAssetId,
      workspace_id: input.workspaceId,
      portal_url: portalUrl,
      updated_at: input.syncedAt,
    },
    { onConflict: "software_asset_id" },
  );
  if (credentialsError) throw new Error(credentialsError.message);

  return softwareAssetId;
}
