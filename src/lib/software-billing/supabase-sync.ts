import {
  estimateSupabaseMonthlySpend,
  fetchSupabaseOrganization,
  fetchSupabaseProjectAddons,
  fetchSupabaseProjects,
} from "@/lib/software-billing/supabase-client";
import { isSupabaseBillingConfigured } from "@/lib/software-billing/supabase-config";
import { currentUtcMonthRange, previousUtcMonthRange } from "@/lib/software-billing/period-utils";
import {
  createSyncRun,
  ensureBillingTablesReady,
  findProviderSoftwareAssetId,
  finishSyncRun,
  updateProviderAssetFromSnapshot,
  upsertPeriodSnapshot,
  upsertProviderConnection,
} from "@/lib/software-billing/provider-db";
import { SUPABASE_PROVIDER_SLUG } from "@/lib/software-billing/types";

export type SupabaseSyncResult = {
  ok: boolean;
  recordsFetched: number;
  lastSuccessfulSyncAt: string | null;
  error?: string;
  completedPeriodBilled?: number;
  currentPeriodProjected?: number;
};

export async function syncSupabaseSoftwareBilling(
  workspaceId: string,
): Promise<SupabaseSyncResult> {
  if (!isSupabaseBillingConfigured()) {
    return {
      ok: false,
      recordsFetched: 0,
      lastSuccessfulSyncAt: null,
      error: "SUPABASE_ACCESS_TOKEN and SUPABASE_ORG_SLUG must be configured on the server.",
    };
  }

  await ensureBillingTablesReady();
  const runId = await createSyncRun(workspaceId, SUPABASE_PROVIDER_SLUG);
  let recordsFetched = 0;

  try {
    const [organization, projects] = await Promise.all([
      fetchSupabaseOrganization(),
      fetchSupabaseProjects(),
    ]);
    recordsFetched = 1 + projects.length;

    const addonSets = await Promise.all(
      projects.map(async (project) => ({
        projectRef: project.ref,
        addons: await fetchSupabaseProjectAddons(project.ref),
      })),
    );
    recordsFetched += addonSets.length;

    const allAddons = addonSets.flatMap((row) => row.addons);
    const estimate = estimateSupabaseMonthlySpend({
      plan: organization.plan,
      projectCount: projects.length,
      addons: allAddons,
    });

    const previous = previousUtcMonthRange();
    const current = currentUtcMonthRange();
    const syncedAt = new Date().toISOString();

    await upsertPeriodSnapshot({
      workspaceId,
      providerSlug: SUPABASE_PROVIDER_SLUG,
      periodStart: previous.from,
      periodEnd: previous.to,
      periodKind: "completed",
      currency: "USD",
      baseSubscriptionAmount: estimate.baseSubscriptionMonthly,
      usageEffectiveAmount: estimate.estimatedComputeMonthly,
      usageBilledAmount: 0,
      creditsAppliedAmount: 0,
      additionalPurchasesAmount: 0,
      taxAmount: 0,
      adjustmentsAmount: 0,
      billedAmount: 0,
      projectedAmount: null,
      chargeLineCount: projects.length,
      planName: organization.plan,
      planIteration: "",
      seatCount: projects.length,
      rawSummary: {
        dataQuality: "unavailable",
        note:
          "Supabase Management API does not expose historical invoice totals. Use dashboard exports for actuals.",
        organization,
        projects,
        addons: addonSets,
        estimate,
      },
      source: "supabase_management_api",
    });

    await upsertPeriodSnapshot({
      workspaceId,
      providerSlug: SUPABASE_PROVIDER_SLUG,
      periodStart: current.from,
      periodEnd: current.to,
      periodKind: "in_progress",
      currency: "USD",
      baseSubscriptionAmount: estimate.baseSubscriptionMonthly,
      usageEffectiveAmount: estimate.estimatedComputeMonthly,
      usageBilledAmount: 0,
      creditsAppliedAmount: 0,
      additionalPurchasesAmount: 0,
      taxAmount: 0,
      adjustmentsAmount: 0,
      billedAmount: 0,
      projectedAmount: estimate.estimatedTotalMonthly,
      chargeLineCount: projects.length,
      planName: organization.plan,
      planIteration: "",
      seatCount: projects.length,
      rawSummary: {
        dataQuality: "estimated",
        note:
          "Projected estimate from plan tier and selected compute add-ons. Not a confirmed invoice.",
        organization,
        projects,
        addons: addonSets,
        estimate,
        billingPeriod: { start: current.from, end: current.to },
      },
      source: "supabase_management_api",
    });

    const softwareAssetId = await findProviderSoftwareAssetId(workspaceId, SUPABASE_PROVIDER_SLUG);
    await upsertProviderConnection({
      workspaceId,
      providerSlug: SUPABASE_PROVIDER_SLUG,
      softwareAssetId,
      externalTeamId: organization.id,
      externalTeamSlug: organization.slug,
      currency: "USD",
      lastSuccessfulSyncAt: syncedAt,
      lastSyncStatus: "ok",
      lastSyncError: "",
    });

    if (softwareAssetId) {
      await updateProviderAssetFromSnapshot({
        softwareAssetId,
        billedAmount: estimate.estimatedTotalMonthly,
        periodEnd: current.to,
        syncStatus: `Estimated sync ${syncedAt}`,
        connected: true,
      });
    }

    await finishSyncRun({ runId, status: "success", recordsFetched });
    return {
      ok: true,
      recordsFetched,
      lastSuccessfulSyncAt: syncedAt,
      completedPeriodBilled: 0,
      currentPeriodProjected: estimate.estimatedTotalMonthly,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Supabase sync failed.";
    await finishSyncRun({ runId, status: "failed", recordsFetched, errorMessage: message });
    return { ok: false, recordsFetched, lastSuccessfulSyncAt: null, error: message };
  }
}
