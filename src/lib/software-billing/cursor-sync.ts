import {
  aggregateCursorUsageEvents,
  estimateCursorSeatSubscriptionMonthly,
} from "@/lib/software-billing/cursor-parse";
import {
  fetchCursorSpendSummary,
  fetchCursorTeamMembers,
  fetchCursorUsageEvents,
} from "@/lib/software-billing/cursor-client";
import { isCursorBillingConfigured } from "@/lib/software-billing/cursor-config";
import {
  previousBillingWindow,
  projectLinearSpendToPeriodEnd,
  round2,
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
import { CURSOR_PROVIDER_SLUG } from "@/lib/software-billing/types";

export type CursorSyncResult = {
  ok: boolean;
  recordsFetched: number;
  lastSuccessfulSyncAt: string | null;
  error?: string;
  completedPeriodBilled?: number;
  currentPeriodProjected?: number;
};

export async function syncCursorSoftwareBilling(workspaceId: string): Promise<CursorSyncResult> {
  if (!isCursorBillingConfigured()) {
    return {
      ok: false,
      recordsFetched: 0,
      lastSuccessfulSyncAt: null,
      error: "CURSOR_ADMIN_API_KEY is not configured on the server.",
    };
  }

  await ensureBillingTablesReady();
  const runId = await createSyncRun(workspaceId, CURSOR_PROVIDER_SLUG);
  let recordsFetched = 0;

  try {
    const [spend, members] = await Promise.all([
      fetchCursorSpendSummary(),
      fetchCursorTeamMembers(),
    ]);
    const activeSeats = members.filter((member) => !member.isRemoved).length;
    const seatSubscriptionMonthly = estimateCursorSeatSubscriptionMonthly(activeSeats);

    const cycleStart = spend.subscriptionCycleStart;
    const cycleEnd = new Date().toISOString();
    const previous = previousBillingWindow(cycleStart, cycleEnd);

    const [previousEvents, currentEvents] = await Promise.all([
      fetchCursorUsageEvents({
        startDate: previous.from.slice(0, 10),
        endDate: previous.to.slice(0, 10),
      }),
      fetchCursorUsageEvents({
        startDate: cycleStart.slice(0, 10),
        endDate: cycleEnd.slice(0, 10),
      }),
    ]);

    recordsFetched = previousEvents.length + currentEvents.length + spend.members.length;
    const previousUsage = aggregateCursorUsageEvents(previousEvents);
    const currentUsage = aggregateCursorUsageEvents(currentEvents);
    const currentUsageSpend = round2(spend.totalOverallSpendCents / 100);
    const previousBilled = round2(previousUsage.totalBilled + seatSubscriptionMonthly);
    const currentBilled = round2(currentUsageSpend + seatSubscriptionMonthly);
    const projectedAmount = round2(
      projectLinearSpendToPeriodEnd(currentBilled, cycleStart) || currentBilled,
    );

    const onDemandSpendByMember: Record<string, number> = {};
    const includedSpendByMember: Record<string, number> = {};
    for (const member of spend.members) {
      const onDemand = round2(member.spendCents / 100);
      const overall = round2(member.overallSpendCents / 100);
      const included = round2(Math.max(0, overall - onDemand));
      if (onDemand > 0) onDemandSpendByMember[member.email || member.userId] = onDemand;
      if (included > 0) includedSpendByMember[member.email || member.userId] = included;
    }

    const completedSnapshotId = await upsertPeriodSnapshot({
      workspaceId,
      providerSlug: CURSOR_PROVIDER_SLUG,
      periodStart: previous.from,
      periodEnd: previous.to,
      periodKind: "completed",
      currency: "USD",
      baseSubscriptionAmount: seatSubscriptionMonthly,
      usageEffectiveAmount: previousUsage.totalBilled,
      usageBilledAmount: previousUsage.totalBilled,
      creditsAppliedAmount: 0,
      additionalPurchasesAmount: 0,
      taxAmount: 0,
      adjustmentsAmount: 0,
      billedAmount: previousBilled,
      projectedAmount: null,
      chargeLineCount: previousUsage.lineCount,
      planName: "teams",
      planIteration: "",
      seatCount: activeSeats,
      rawSummary: {
        byModel: previousUsage.byModel,
        seatSubscriptionMonthly,
        onDemandSpendByMember,
        includedSpendByMember,
        onDemandSpendTotal: round2(spend.totalOnDemandSpendCents / 100),
        dataQuality: previousEvents.length > 0 ? "mixed" : "estimated",
        note:
          "Seat subscription is estimated from public Teams pricing; usage totals come from Cursor Admin API events.",
      },
      source: "cursor_admin_api",
    });

    const inProgressSnapshotId = await upsertPeriodSnapshot({
      workspaceId,
      providerSlug: CURSOR_PROVIDER_SLUG,
      periodStart: cycleStart,
      periodEnd: cycleEnd,
      periodKind: "in_progress",
      currency: "USD",
      baseSubscriptionAmount: seatSubscriptionMonthly,
      usageEffectiveAmount: currentUsageSpend,
      usageBilledAmount: currentUsageSpend,
      creditsAppliedAmount: 0,
      additionalPurchasesAmount: 0,
      taxAmount: 0,
      adjustmentsAmount: 0,
      billedAmount: currentBilled,
      projectedAmount,
      chargeLineCount: currentUsage.lineCount,
      planName: "teams",
      planIteration: "",
      seatCount: activeSeats,
      rawSummary: {
        byModel: currentUsage.byModel,
        seatSubscriptionMonthly,
        onDemandSpendByMember,
        includedSpendByMember,
        onDemandSpendTotal: round2(spend.totalOnDemandSpendCents / 100),
        subscriptionCycleStart: cycleStart,
        dataQuality: "mixed",
        billingPeriod: { start: cycleStart, end: cycleEnd },
      },
      source: "cursor_admin_api",
    });

    await replaceChargeFacts({
      snapshotId: completedSnapshotId,
      workspaceId,
      providerSlug: CURSOR_PROVIDER_SLUG,
      facts: previousUsage.byDay.map((row) => ({
        chargeDate: row.chargeDate,
        serviceName: row.serviceName,
        chargeCategory: "Usage",
        effectiveCost: row.effectiveCost,
        billedCost: row.billedCost,
        pricingQuantity: 0,
        tags: {},
      })),
    });
    await replaceChargeFacts({
      snapshotId: inProgressSnapshotId,
      workspaceId,
      providerSlug: CURSOR_PROVIDER_SLUG,
      facts: currentUsage.byDay.map((row) => ({
        chargeDate: row.chargeDate,
        serviceName: row.serviceName,
        chargeCategory: "Usage",
        effectiveCost: row.effectiveCost,
        billedCost: row.billedCost,
        pricingQuantity: 0,
        tags: {},
      })),
    });

    const softwareAssetId = await findProviderSoftwareAssetId(workspaceId, CURSOR_PROVIDER_SLUG);
    const syncedAt = new Date().toISOString();
    await upsertProviderConnection({
      workspaceId,
      providerSlug: CURSOR_PROVIDER_SLUG,
      softwareAssetId,
      externalTeamId: "cursor-team",
      externalTeamSlug: "cursor",
      currency: "USD",
      lastSuccessfulSyncAt: syncedAt,
      lastSyncStatus: "ok",
      lastSyncError: "",
    });

    if (softwareAssetId) {
      await updateProviderAssetFromSnapshot({
        softwareAssetId,
        billedAmount: previousBilled,
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
      completedPeriodBilled: previousBilled,
      currentPeriodProjected: projectedAmount,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cursor sync failed.";
    await finishSyncRun({ runId, status: "failed", recordsFetched, errorMessage: message });
    return { ok: false, recordsFetched, lastSuccessfulSyncAt: null, error: message };
  }
}
