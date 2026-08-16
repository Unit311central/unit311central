import { NextResponse } from "next/server";

import { getFinancialOverview } from "@/lib/accounting/overview-service";
import type { FinancialOverviewSnapshot } from "@/lib/accounting/types";
import {
  ABHI_CASH_BALANCE_GBP,
  buildAbhiHomeFinancialOverviewFallback,
  isAbhiWorkspaceSlug,
} from "@/lib/abhi-financials";
import { listLeads } from "@/lib/crm-leads-service";
import { isDemoWorkspaceSlug } from "@/lib/demo/read-only";
import { isDemoApiRequest } from "@/lib/demo/demo-request";
import {
  buildNorthstarFinancialOverview,
  getNorthstarCrmLeads,
  getNorthstarClients,
  getNorthstarOnboardingRecords,
  getNorthstarProjects,
} from "@/lib/demo/module-fixtures";
import { listOpenActionItems } from "@/lib/internal-action-items-service";
import { listCalendarEvents } from "@/lib/internal-calendar-service";
import { listClientOnboardingRecords } from "@/lib/client-onboarding-service";
import { listInternalClients } from "@/lib/internal-clients-service";
import { listProjects } from "@/lib/internal-projects-service";
import { ONWARDAIR_CASH_BALANCE_USD } from "@/lib/onwardair-financials";
import {
  ensureOnwardAirFinancialsCore,
  kickOnwardAirFinancialsDetails,
} from "@/lib/onwardair/financials-seed";
import { isOnwardAirSlug, ONWARDAIR_REPORTING_CURRENCY } from "@/lib/onwardair-surface";
import { getPlatformSession } from "@/lib/platform-session";
import { listSupportTickets } from "@/lib/support-tickets-service";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const OA_COMMERCIAL_CLIENT_IDS = new Set([
  "oa-cli-gulf-defense",
  "oa-cli-medireach",
  "oa-cli-coastal-freight",
]);

function filterOaHomeClients<T extends { id: string }>(clients: T[]): T[] {
  const commercial = clients.filter((c) => OA_COMMERCIAL_CLIENT_IDS.has(c.id));
  if (commercial.length > 0) return commercial;
  return clients.filter(
    (c) =>
      !c.id.startsWith("oa-grant-") &&
      c.id !== "oa-cli-board" &&
      c.id !== "oa-cli-overview",
  );
}

function pinAbhiFinancials(snapshot: FinancialOverviewSnapshot | null): FinancialOverviewSnapshot {
  const fallback = buildAbhiHomeFinancialOverviewFallback();
  const base = snapshot ?? fallback;
  if (base.cashPosition > 0 && base.burnRate.previousMonthly > 0) {
    return {
      ...base,
      charts: {
        ...base.charts,
        cashPosition:
          base.charts.cashPosition.length > 0
            ? base.charts.cashPosition
            : fallback.charts.cashPosition,
        monthlyRevenue:
          base.charts.monthlyRevenue.length > 0
            ? base.charts.monthlyRevenue
            : fallback.charts.monthlyRevenue,
        monthlyOutgoings:
          base.charts.monthlyOutgoings.length > 0
            ? base.charts.monthlyOutgoings
            : fallback.charts.monthlyOutgoings,
      },
      revenueYtd: base.revenueYtd > 0 ? base.revenueYtd : fallback.revenueYtd,
    };
  }
  return {
    ...fallback,
    ...base,
    cashPosition: ABHI_CASH_BALANCE_GBP,
    revenueYtd: base.revenueYtd > 0 ? base.revenueYtd : fallback.revenueYtd,
    burnRate: {
      ...fallback.burnRate,
      ...base.burnRate,
      previousMonthly:
        base.burnRate.previousMonthly > 0
          ? base.burnRate.previousMonthly
          : fallback.burnRate.previousMonthly,
      monthly: base.burnRate.monthly > 0 ? base.burnRate.monthly : fallback.burnRate.monthly,
      cashBalance: ABHI_CASH_BALANCE_GBP,
    },
    charts: {
      ...fallback.charts,
      ...base.charts,
      cashPosition:
        base.charts.cashPosition.length > 0
          ? base.charts.cashPosition
          : fallback.charts.cashPosition,
      monthlyRevenue:
        base.charts.monthlyRevenue.length > 0
          ? base.charts.monthlyRevenue
          : fallback.charts.monthlyRevenue,
      monthlyOutgoings:
        base.charts.monthlyOutgoings.length > 0
          ? base.charts.monthlyOutgoings
          : fallback.charts.monthlyOutgoings,
    },
  };
}

function oaFinancialsFallback(): FinancialOverviewSnapshot {
  const currency = ONWARDAIR_REPORTING_CURRENCY;
  const cash = ONWARDAIR_CASH_BALANCE_USD;
  return {
    revenueYtd: 0,
    cashPosition: cash,
    accountsReceivable: 0,
    accountsPayable: 0,
    netProfit: 0,
    outstandingInvoices: 0,
    monthlyRevenue: 0,
    monthlyExpenses: 0,
    annualRevenue: 0,
    annualExpenses: 0,
    burnRate: {
      source: "demo",
      currency,
      monthly: 0,
      quarterly: 0,
      annual: 0,
      previousMonthly: 0,
      changePct: 0,
      trend: "stable",
      trendLabel: "Stable",
      cashBalance: cash,
      runwayMonths: null,
      forecastMonthly: 0,
      lines: [],
      series: [],
      filterOptions: {
        departments: [],
        costCentres: [],
        projects: [],
        offices: [],
      },
    },
    ar: {
      outstanding: 0,
      overdue: 0,
      overdueCount: 0,
      dueSoon: 0,
      collectionRate: 0,
      ageing: [],
      recentUnpaid: [],
    },
    ap: {
      outstanding: 0,
      dueThisMonth: 0,
      overdue: 0,
      upcoming: 0,
      recent: [],
    },
    payroll: {
      current: 0,
      next: 0,
      employees: 0,
      annual: 0,
      monthly: 0,
      trend: [],
    },
    charts: {
      monthlyRevenue: [],
      monthlyProfitLoss: [],
      monthlyOutgoings: [],
      cashPosition: [{ month: new Date().toISOString().slice(0, 7), amount: cash }],
    },
    activity: [],
  };
}

/**
 * Single round-trip Command Centre payload — parallel live reads.
 */
export async function GET() {
  const started = Date.now();
  try {
    if (await isDemoApiRequest()) {
      const onboarding = getNorthstarOnboardingRecords();
      return NextResponse.json({
        projects: getNorthstarProjects(),
        clients: getNorthstarClients(),
        leads: getNorthstarCrmLeads(),
        events: [],
        tickets: [],
        financials: buildNorthstarFinancialOverview(),
        apiActions: [],
        onboardingPipelineCount: onboarding.filter((r) => r.currentStatus === "In Progress").length,
        elapsedMs: Date.now() - started,
        generatedAt: new Date().toISOString(),
      });
    }

    const session = await getPlatformSession();
    if (!session) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    const workspace = await requireCurrentWorkspace();
    const workspaceId = workspace.id;
    const oaSurface = isOnwardAirSlug(workspace.slug);
    const abhiSurface = isAbhiWorkspaceSlug(workspace.slug);
    const demoSurface = isDemoWorkspaceSlug(workspace.slug);
    const scope = { workspaceId, workspaceSlug: workspace.slug };

    if (oaSurface) {
      await ensureOnwardAirFinancialsCore(workspaceId);
      kickOnwardAirFinancialsDetails(workspaceId);
    }

    const today = new Date();
    const from = new Date(today);
    from.setDate(from.getDate() - 1);
    const to = new Date(today);
    to.setDate(to.getDate() + 1);

    // OA: never soft-timeout financials to null (that zeroes Home cash/burn).
    // Also force the $1M cash pin when overview returns a zero cash snapshot.
    const financialsPromise = demoSurface
      ? Promise.resolve(buildNorthstarFinancialOverview())
      : oaSurface
      ? getFinancialOverview(scope)
          .catch(() => null)
          .then((snapshot) => {
            const base = snapshot ?? oaFinancialsFallback();
            if (base.cashPosition > 0) return base;
            const cash = ONWARDAIR_CASH_BALANCE_USD;
            return {
              ...base,
              cashPosition: cash,
              burnRate: {
                ...base.burnRate,
                cashBalance: cash,
              },
              charts: {
                ...base.charts,
                cashPosition:
                  base.charts.cashPosition.length > 0
                    ? base.charts.cashPosition.map((point, index, arr) =>
                        index === arr.length - 1 ? { ...point, amount: cash } : point,
                      )
                    : [{ month: new Date().toISOString().slice(0, 7), amount: cash }],
              },
            };
          })
      : abhiSurface
        ? getFinancialOverview(scope)
            .catch(() => null)
            .then((snapshot) => pinAbhiFinancials(snapshot))
        : Promise.race([
          getFinancialOverview(scope).catch(() => null),
          new Promise<null>((resolve) => {
            setTimeout(() => resolve(null), 2500);
          }),
        ]);

    const [projects, clientsRaw, leads, events, tickets, financials, apiActions, onboardingPipeline] =
      await Promise.all([
        demoSurface
          ? Promise.resolve(getNorthstarProjects())
          : listProjects(scope).catch(() => []),
        listInternalClients(scope).catch(() => []),
        demoSurface ? Promise.resolve(getNorthstarCrmLeads()) : listLeads("All", scope).catch(() => []),
        listCalendarEvents(from.toISOString(), to.toISOString(), scope).catch(() => []),
        listSupportTickets(false, scope).catch(() => []),
        financialsPromise,
        listOpenActionItems(scope).catch(() => []),
        demoSurface
          ? Promise.resolve(getNorthstarOnboardingRecords())
          : listClientOnboardingRecords({ status: "in_progress", workspaceId }).catch(() => []),
      ]);

    const clients = oaSurface ? filterOaHomeClients(clientsRaw) : clientsRaw;

    return NextResponse.json({
      projects,
      clients,
      leads,
      events,
      tickets,
      financials,
      apiActions,
      onboardingPipelineCount: onboardingPipeline.length,
      elapsedMs: Date.now() - started,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to load command centre",
        elapsedMs: Date.now() - started,
      },
      { status: 500 },
    );
  }
}
