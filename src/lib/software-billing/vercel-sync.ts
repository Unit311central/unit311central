import {
  aggregateFocusCharges,
  buildDailyChargeFacts,
  parseFocusJsonl,
} from "@/lib/software-billing/parse-focus-jsonl";
import {
  createSyncRun,
  ensureBillingTablesReady,
  finishSyncRun,
  replaceChargeFacts,
  upsertPeriodSnapshot,
  upsertProviderConnection,
} from "@/lib/software-billing/provider-db";
import { applyVercelSyncToSoftwareAsset } from "@/lib/software-billing/vercel-asset-sync";
import { VERCEL_PROVIDER_SLUG } from "@/lib/software-billing/types";
import {
  fetchVercelBillingCharges,
  fetchVercelTeamBilling,
  fetchVercelUsageSummary,
  previousBillingPeriod,
} from "@/lib/software-billing/vercel-client";
import { isVercelBillingConfigured } from "@/lib/software-billing/vercel-config";

export type VercelSyncResult = {
  ok: boolean;
  recordsFetched: number;
  lastSuccessfulSyncAt: string | null;
  error?: string;
  completedPeriodBilled?: number;
  currentPeriodProjected?: number;
};

export async function syncVercelSoftwareBilling(workspaceId: string): Promise<VercelSyncResult> {
  if (!isVercelBillingConfigured()) {
    return {
      ok: false,
      recordsFetched: 0,
      lastSuccessfulSyncAt: null,
      error: "VERCEL_API_TOKEN is not configured on the server.",
    };
  }

  await ensureBillingTablesReady();
  const runId = await createSyncRun(workspaceId, VERCEL_PROVIDER_SLUG);
  let recordsFetched = 0;

  try {
    const team = await fetchVercelTeamBilling();
    const previous = previousBillingPeriod(team.periodStart, team.periodEnd);
    const nowIso = new Date().toISOString();

    const [previousChargesText, currentChargesText] = await Promise.all([
      fetchVercelBillingCharges(previous.from, previous.to),
      fetchVercelBillingCharges(team.periodStart, nowIso),
    ]);

    const previousCharges = parseFocusJsonl(previousChargesText);
    const currentCharges = parseFocusJsonl(currentChargesText);
    recordsFetched = previousCharges.length + currentCharges.length;

    const previousAgg = aggregateFocusCharges(previousCharges);
    const currentAgg = aggregateFocusCharges(currentCharges);

    let currentUsage = null as Awaited<ReturnType<typeof fetchVercelUsageSummary>> | null;
    try {
      currentUsage = await fetchVercelUsageSummary(team.periodStart, nowIso);
    } catch {
      currentUsage = null;
    }

    const completedSnapshotId = await upsertPeriodSnapshot({
      workspaceId,
      providerSlug: VERCEL_PROVIDER_SLUG,
      periodStart: previous.from,
      periodEnd: previous.to,
      periodKind: "completed",
      currency: team.currency,
      baseSubscriptionAmount: previousAgg.baseSubscription,
      usageEffectiveAmount: previousAgg.usageEffective,
      usageBilledAmount: previousAgg.usageBilled,
      creditsAppliedAmount: previousAgg.creditsApplied,
      additionalPurchasesAmount: previousAgg.additionalPurchases,
      taxAmount: previousAgg.taxAmount,
      adjustmentsAmount: previousAgg.adjustmentsAmount,
      billedAmount: previousAgg.totalBilled,
      projectedAmount: null,
      chargeLineCount: previousAgg.lineCount,
      planName: team.plan,
      planIteration: team.planIteration ?? "",
      seatCount: team.seatCount,
      rawSummary: {
        byService: previousAgg.byService,
        totalEffective: previousAgg.totalEffective,
      },
    });

    const projectedAmount =
      currentUsage?.totals.billedCost ?? currentAgg.totalBilled ?? currentAgg.totalEffective;

    const inProgressSnapshotId = await upsertPeriodSnapshot({
      workspaceId,
      providerSlug: VERCEL_PROVIDER_SLUG,
      periodStart: team.periodStart,
      periodEnd: team.periodEnd,
      periodKind: "in_progress",
      currency: team.currency,
      baseSubscriptionAmount: currentAgg.baseSubscription,
      usageEffectiveAmount: currentAgg.usageEffective,
      usageBilledAmount: currentAgg.usageBilled,
      creditsAppliedAmount: currentAgg.creditsApplied,
      additionalPurchasesAmount: currentAgg.additionalPurchases,
      taxAmount: currentAgg.taxAmount,
      adjustmentsAmount: currentAgg.adjustmentsAmount,
      billedAmount: currentAgg.totalBilled,
      projectedAmount,
      chargeLineCount: currentAgg.lineCount,
      planName: team.plan,
      planIteration: team.planIteration ?? "",
      seatCount: team.seatCount,
      rawSummary: {
        byService: currentAgg.byService,
        totalEffective: currentAgg.totalEffective,
        usageTotals: currentUsage?.totals ?? null,
        analyticsSpendLimitDollars: team.analyticsSpendLimitDollars,
        includedAllocationEnabled: team.includedAllocationEnabled,
        billingPeriod: { start: team.periodStart, end: team.periodEnd },
      },
    });

    await replaceChargeFacts({
      snapshotId: completedSnapshotId,
      workspaceId,
      providerSlug: VERCEL_PROVIDER_SLUG,
      facts: buildDailyChargeFacts(previousCharges),
    });
    await replaceChargeFacts({
      snapshotId: inProgressSnapshotId,
      workspaceId,
      providerSlug: VERCEL_PROVIDER_SLUG,
      facts: buildDailyChargeFacts(currentCharges),
    });

    const syncedAt = new Date().toISOString();

    const softwareAssetId = await applyVercelSyncToSoftwareAsset({
      workspaceId,
      team,
      previousBilledAmount: previousAgg.totalBilled,
      previousPeriodEnd: previous.to,
      currentBilledAmount: currentAgg.totalBilled,
      currentProjectedAmount: projectedAmount,
      syncedAt,
    });

    try {
      const { discoverVercelBillingInvoices } = await import(
        "@/lib/software-billing/adapters/vercel-invoice-adapter"
      );
      const { syncProviderInvoiceBatch } = await import(
        "@/lib/software-billing/billing-invoice-lifecycle"
      );
      const discovery = await discoverVercelBillingInvoices({ workspaceId, softwareAssetId });
      await syncProviderInvoiceBatch(discovery.invoices);
    } catch (invoiceError) {
      console.warn(
        "[vercel-sync] invoice lifecycle sync failed",
        invoiceError instanceof Error ? invoiceError.message : invoiceError,
      );
    }

    await upsertProviderConnection({
      workspaceId,
      providerSlug: VERCEL_PROVIDER_SLUG,
      softwareAssetId,
      externalTeamId: team.teamId,
      externalTeamSlug: team.teamSlug,
      currency: team.currency,
      lastSuccessfulSyncAt: syncedAt,
      lastSyncStatus: "ok",
      lastSyncError: "",
    });

    await finishSyncRun({
      runId,
      status: "success",
      recordsFetched,
    });

    return {
      ok: true,
      recordsFetched,
      lastSuccessfulSyncAt: syncedAt,
      completedPeriodBilled: previousAgg.totalBilled,
      currentPeriodProjected: projectedAmount,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Vercel sync failed.";
    await finishSyncRun({
      runId,
      status: "failed",
      recordsFetched,
      errorMessage: message,
    });
    return {
      ok: false,
      recordsFetched,
      lastSuccessfulSyncAt: null,
      error: message,
    };
  }
}
