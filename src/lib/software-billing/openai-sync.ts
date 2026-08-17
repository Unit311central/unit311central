import { aggregateOpenAiCostBuckets } from "@/lib/software-billing/openai-parse";
import { fetchAllOpenAiCosts } from "@/lib/software-billing/openai-client";
import { isOpenAiBillingConfigured } from "@/lib/software-billing/openai-config";
import {
  currentUtcMonthRange,
  previousUtcMonthRange,
  projectLinearSpendToPeriodEnd,
  toUnixSeconds,
} from "@/lib/software-billing/period-utils";
import {
  createSyncRun,
  ensureBillingTablesReady,
  findProviderSoftwareAssetId,
  finishSyncRun,
  replaceChargeFacts,
  updateProviderAssetFromSnapshot,
  upsertPeriodSnapshot,
  upsertProviderConnection,
} from "@/lib/software-billing/provider-db";
import { OPENAI_PROVIDER_SLUG } from "@/lib/software-billing/types";

export type OpenAiSyncResult = {
  ok: boolean;
  recordsFetched: number;
  lastSuccessfulSyncAt: string | null;
  error?: string;
  completedPeriodBilled?: number;
  currentPeriodProjected?: number;
};

export async function syncOpenAiSoftwareBilling(workspaceId: string): Promise<OpenAiSyncResult> {
  if (!isOpenAiBillingConfigured()) {
    return {
      ok: false,
      recordsFetched: 0,
      lastSuccessfulSyncAt: null,
      error: "OPENAI_ADMIN_API_KEY is not configured on the server.",
    };
  }

  await ensureBillingTablesReady();
  const runId = await createSyncRun(workspaceId, OPENAI_PROVIDER_SLUG);
  let recordsFetched = 0;

  try {
    const previous = previousUtcMonthRange();
    const current = currentUtcMonthRange();
    const nowIso = new Date().toISOString();

    const [previousBuckets, currentBuckets] = await Promise.all([
      fetchAllOpenAiCosts({
        startTime: toUnixSeconds(previous.from),
        endTime: toUnixSeconds(previous.to),
      }),
      fetchAllOpenAiCosts({
        startTime: toUnixSeconds(current.from),
        endTime: toUnixSeconds(nowIso),
      }),
    ]);

    recordsFetched = previousBuckets.length + currentBuckets.length;
    const previousAgg = aggregateOpenAiCostBuckets(previousBuckets);
    const currentAgg = aggregateOpenAiCostBuckets(currentBuckets);
    const currency = currentAgg.currency || previousAgg.currency || "USD";
    const projectedAmount = projectLinearSpendToPeriodEnd(
      currentAgg.totalBilled,
      current.from,
    );

    const completedSnapshotId = await upsertPeriodSnapshot({
      workspaceId,
      providerSlug: OPENAI_PROVIDER_SLUG,
      periodStart: previous.from,
      periodEnd: previous.to,
      periodKind: "completed",
      currency,
      baseSubscriptionAmount: 0,
      usageEffectiveAmount: previousAgg.totalBilled,
      usageBilledAmount: previousAgg.totalBilled,
      creditsAppliedAmount: 0,
      additionalPurchasesAmount: 0,
      taxAmount: 0,
      adjustmentsAmount: 0,
      billedAmount: previousAgg.totalBilled,
      projectedAmount: null,
      chargeLineCount: previousAgg.lineCount,
      planName: "organization",
      planIteration: "",
      seatCount: null,
      rawSummary: { byLineItem: previousAgg.byLineItem, byProject: previousAgg.byProject, dataQuality: "actual" },
      source: "openai_admin_api",
    });

    const inProgressSnapshotId = await upsertPeriodSnapshot({
      workspaceId,
      providerSlug: OPENAI_PROVIDER_SLUG,
      periodStart: current.from,
      periodEnd: current.to,
      periodKind: "in_progress",
      currency,
      baseSubscriptionAmount: 0,
      usageEffectiveAmount: currentAgg.totalBilled,
      usageBilledAmount: currentAgg.totalBilled,
      creditsAppliedAmount: 0,
      additionalPurchasesAmount: 0,
      taxAmount: 0,
      adjustmentsAmount: 0,
      billedAmount: currentAgg.totalBilled,
      projectedAmount,
      chargeLineCount: currentAgg.lineCount,
      planName: "organization",
      planIteration: "",
      seatCount: null,
      rawSummary: {
        byLineItem: currentAgg.byLineItem,
        byProject: currentAgg.byProject,
        byProjectLineItem: currentAgg.byProjectLineItem,
        dataQuality: "mixed",
        billingPeriod: { start: current.from, end: current.to },
      },
      source: "openai_admin_api",
    });

    await replaceChargeFacts({
      snapshotId: completedSnapshotId,
      workspaceId,
      providerSlug: OPENAI_PROVIDER_SLUG,
      facts: previousAgg.byDay.map((row) => ({
        chargeDate: row.chargeDate,
        serviceName: row.serviceName,
        chargeCategory: "Usage",
        effectiveCost: row.effectiveCost,
        billedCost: row.billedCost,
        pricingQuantity: 0,
        tags: row.projectId
          ? { project_id: row.projectId }
          : ({} as Record<string, string>),
      })),
    });
    await replaceChargeFacts({
      snapshotId: inProgressSnapshotId,
      workspaceId,
      providerSlug: OPENAI_PROVIDER_SLUG,
      facts: currentAgg.byDay.map((row) => ({
        chargeDate: row.chargeDate,
        serviceName: row.serviceName,
        chargeCategory: "Usage",
        effectiveCost: row.effectiveCost,
        billedCost: row.billedCost,
        pricingQuantity: 0,
        tags: row.projectId
          ? { project_id: row.projectId }
          : ({} as Record<string, string>),
      })),
    });

    const softwareAssetId = await findProviderSoftwareAssetId(workspaceId, OPENAI_PROVIDER_SLUG);
    const syncedAt = new Date().toISOString();
    await upsertProviderConnection({
      workspaceId,
      providerSlug: OPENAI_PROVIDER_SLUG,
      softwareAssetId,
      externalTeamId: "openai-org",
      externalTeamSlug: "openai",
      currency,
      lastSuccessfulSyncAt: syncedAt,
      lastSyncStatus: "ok",
      lastSyncError: "",
    });

    if (softwareAssetId) {
      await updateProviderAssetFromSnapshot({
        softwareAssetId,
        billedAmount: previousAgg.totalBilled,
        periodEnd: previous.to,
        syncStatus: `Synced ${syncedAt}`,
        connected: true,
      });
    }

    await finishSyncRun({ runId, status: "success", recordsFetched });
    return {
      ok: true,
      recordsFetched,
      lastSuccessfulSyncAt: syncedAt,
      completedPeriodBilled: previousAgg.totalBilled,
      currentPeriodProjected: projectedAmount,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "OpenAI sync failed.";
    await finishSyncRun({ runId, status: "failed", recordsFetched, errorMessage: message });
    return { ok: false, recordsFetched, lastSuccessfulSyncAt: null, error: message };
  }
}
