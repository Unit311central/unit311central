import { listSoftwareAssets } from "@/lib/software-assets-service";
import type { SoftwareAsset } from "@/lib/software-assets-data";
import {
  getProviderConnection,
  listPeriodSnapshots,
} from "@/lib/software-billing/provider-db";
import type { ProviderPeriodSnapshot, SoftwareBillingSummary } from "@/lib/software-billing/types";
import { VERCEL_PROVIDER_SLUG } from "@/lib/software-billing/types";
import { isVercelBillingConfigured } from "@/lib/software-billing/vercel-config";

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function isActiveAsset(asset: SoftwareAsset) {
  return asset.status === "Active" || asset.status === "Trial";
}

function isVercelAsset(asset: SoftwareAsset) {
  if (asset.providerSlug === VERCEL_PROVIDER_SLUG) return true;
  const vendor = asset.vendor.toLowerCase();
  const name = asset.name.toLowerCase();
  return vendor.includes("vercel") || name.includes("vercel");
}

function monthlyFromAsset(asset: SoftwareAsset) {
  if (!isActiveAsset(asset)) return 0;
  if (Number(asset.monthlyCost || 0) > 0) return Number(asset.monthlyCost);
  if (Number(asset.annualCost || 0) > 0) return Number(asset.annualCost) / 12;
  return 0;
}

function lastPaymentFromAsset(asset: SoftwareAsset) {
  if (!isActiveAsset(asset)) return 0;
  if (asset.lastPaymentAmount != null) return Number(asset.lastPaymentAmount);
  return monthlyFromAsset(asset);
}

function delta(current: number, previous: number) {
  const deltaAmount = round2(current - previous);
  const deltaPercent =
    previous > 0 ? round2((deltaAmount / previous) * 100) : current > 0 ? 100 : null;
  const deltaDirection =
    deltaAmount > 0
      ? ("up" as const)
      : deltaAmount < 0
        ? ("down" as const)
        : previous > 0 || current > 0
          ? ("flat" as const)
          : ("unknown" as const);
  return { deltaAmount, deltaPercent, deltaDirection };
}

function buildHistory(completed: ProviderPeriodSnapshot[]) {
  const sorted = [...completed].sort(
    (a, b) => new Date(a.periodStart).getTime() - new Date(b.periodStart).getTime(),
  );
  return sorted.map((row, index) => {
    const previous = index > 0 ? sorted[index - 1] : null;
    const change = previous ? delta(row.billedAmount, previous.billedAmount) : null;
    return {
      periodStart: row.periodStart,
      periodEnd: row.periodEnd,
      billedAmount: row.billedAmount,
      usageEffectiveAmount: row.usageEffectiveAmount,
      creditsAppliedAmount: row.creditsAppliedAmount,
      deltaAmount: change?.deltaAmount ?? null,
      deltaPercent: change?.deltaPercent ?? null,
    };
  });
}

export async function buildSoftwareBillingSummary(
  workspaceId: string,
): Promise<SoftwareBillingSummary> {
  const [connection, snapshots, assets] = await Promise.all([
    getProviderConnection(workspaceId, VERCEL_PROVIDER_SLUG),
    listPeriodSnapshots(workspaceId, VERCEL_PROVIDER_SLUG),
    listSoftwareAssets({ workspaceId }),
  ]);

  const hasLiveVercel = Boolean(connection?.lastSuccessfulSyncAt);
  const completed = snapshots.filter((row) => row.periodKind === "completed");
  const inProgress = snapshots.find((row) => row.periodKind === "in_progress") ?? null;
  const latestCompleted = completed[0] ?? null;
  const previousCompleted = completed[1] ?? null;

  const vercelLastMonth = latestCompleted?.billedAmount ?? 0;
  const vercelUpcoming = inProgress?.projectedAmount ?? inProgress?.billedAmount ?? 0;
  const vercelCurrentSpend = inProgress?.billedAmount ?? inProgress?.projectedAmount ?? 0;

  const manualAssets = assets.filter((asset) => !hasLiveVercel || !isVercelAsset(asset));
  const manualMonthly = manualAssets.reduce((sum, asset) => sum + monthlyFromAsset(asset), 0);
  const manualLastMonth = manualAssets.reduce(
    (sum, asset) => sum + lastPaymentFromAsset(asset),
    0,
  );

  const totalSoftwareCostMonthly = round2(
    manualMonthly + (hasLiveVercel ? vercelUpcoming : 0),
  );
  const lastMonthSpend = round2(manualLastMonth + (hasLiveVercel ? vercelLastMonth : 0));
  const upcoming = round2(manualMonthly + (hasLiveVercel ? vercelUpcoming : 0));

  const previousOverall = round2(
    manualLastMonth + (previousCompleted?.billedAmount ?? 0),
  );
  const overallDelta = delta(lastMonthSpend, previousOverall);

  const syncStatus: SoftwareBillingSummary["syncStatus"] = !connection?.lastSuccessfulSyncAt
    ? "never"
    : connection.lastSyncStatus === "ok"
      ? "ok"
      : "error";

  const rawSummary = (inProgress?.rawSummary ?? {}) as Record<string, unknown>;
  const billingPeriod = (rawSummary.billingPeriod ?? {}) as {
    start?: string;
    end?: string;
  };

  return {
    currency: connection?.currency ?? latestCompleted?.currency ?? "USD",
    lastSuccessfulSyncAt: connection?.lastSuccessfulSyncAt ?? null,
    syncStatus: isVercelBillingConfigured() ? syncStatus : "error",
    syncError:
      connection?.lastSyncError ||
      (!isVercelBillingConfigured() ? "VERCEL_API_TOKEN is not configured on the server." : null),
    overall: {
      totalSoftwareCostMonthly,
      lastMonthSpend,
      upcoming,
      deltaAmount: overallDelta.deltaAmount,
      deltaPercent: overallDelta.deltaPercent,
      deltaDirection: overallDelta.deltaDirection,
    },
    vercel: {
      lastMonth: vercelLastMonth,
      upcomingProjected: vercelUpcoming,
      currentSpend: vercelCurrentSpend,
      isProjected: true,
      planName: inProgress?.planName ?? latestCompleted?.planName ?? "",
      planIteration: inProgress?.planIteration ?? latestCompleted?.planIteration ?? "",
      baseSubscriptionMonthly:
        inProgress?.baseSubscriptionAmount ?? latestCompleted?.baseSubscriptionAmount ?? 0,
      seatCount: inProgress?.seatCount ?? latestCompleted?.seatCount ?? null,
      billingPeriodStart: billingPeriod.start ?? inProgress?.periodStart ?? null,
      billingPeriodEnd: billingPeriod.end ?? inProgress?.periodEnd ?? null,
      creditsAppliedCurrent: inProgress?.creditsAppliedAmount ?? 0,
      usageEffectiveCurrent: inProgress?.usageEffectiveAmount ?? 0,
      analyticsSpendLimitDollars:
        typeof rawSummary.analyticsSpendLimitDollars === "number"
          ? rawSummary.analyticsSpendLimitDollars
          : null,
    },
    history: buildHistory(completed),
    vercelAssetId: connection?.softwareAssetId ?? null,
  };
}

export async function getVercelSnapshotDetail(workspaceId: string) {
  const snapshots = await listPeriodSnapshots(workspaceId, VERCEL_PROVIDER_SLUG);
  const completed = snapshots.filter((row) => row.periodKind === "completed");
  const inProgress = snapshots.find((row) => row.periodKind === "in_progress") ?? null;
  return { completed, inProgress };
}
