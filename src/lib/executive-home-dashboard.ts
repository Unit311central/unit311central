import { formatMoney, withPreferredCurrencySymbol } from "@/lib/accounting/chart-of-accounts";
import type { FinancialOverviewSnapshot } from "@/lib/accounting/types";
import type { ManagedClient } from "@/lib/client-management-data";
import { normalizeKpiRow } from "@/lib/dashboard-framework";
import type {
  DashboardAnalyticsAnnotation,
  DashboardAnalyticsSeries,
  DashboardKpiItem,
  WorkspaceDashboardConfig,
} from "@/lib/dashboard-framework";
import { countLiveProjects } from "@/lib/home-executive-dashboard";
import type { InternalProject } from "@/lib/projects-data";

function isBrowserAbhiHome(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const { isBrowserAbhiSurface } =
      require("@/lib/abhi-surface") as typeof import("@/lib/abhi-surface");
    return isBrowserAbhiSurface();
  } catch {
    return false;
  }
}

function formatCompactMoney(amount: number, currency = "GBP") {
  const code = String(currency || "GBP").toUpperCase();
  const abs = Math.abs(amount);
  // Millions keep one decimal so ABHI £4.24M does not collapse to £4M.
  if (abs >= 1_000_000) {
    return withPreferredCurrencySymbol(
      new Intl.NumberFormat(code === "AUD" ? "en-AU" : "en-GB", {
        style: "currency",
        currency: code,
        notation: "compact",
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
      }).format(amount),
      code,
    );
  }
  // Home KPI tiles should read as whole compact units (e.g. $156k), not $156.06k.
  if (abs >= 10_000) {
    return withPreferredCurrencySymbol(
      new Intl.NumberFormat(code === "AUD" ? "en-AU" : "en-GB", {
        style: "currency",
        currency: code,
        notation: "compact",
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
      }).format(amount),
      code,
    );
  }
  return formatMoney(amount, code);
}

function monthDelta(
  series: Array<{ amount: number }> | undefined,
): { label: string; tone: DashboardKpiItem["tone"] } | null {
  if (!series || series.length < 2) return null;
  const current = series[series.length - 1]?.amount ?? 0;
  const prior = series[series.length - 2]?.amount ?? 0;
  const change = current - prior;
  if (Math.abs(change) < 0.005) {
    return { label: "Flat vs prior month", tone: "neutral" };
  }
  const sign = change > 0 ? "+" : "−";
  return {
    label: `${sign}${formatCompactMoney(Math.abs(change))} vs prior month`,
    tone: change > 0 ? "positive" : "warning",
  };
}

function sumSeries(points: Array<{ amount: number }>) {
  return points.reduce((sum, point) => sum + (point.amount || 0), 0);
}

function pctChangeLabel(
  current: number,
  prior: number,
  priorLabel: string,
): { label: string; tone: DashboardKpiItem["tone"] } {
  if (prior === 0) {
    if (current === 0) return { label: `No prior ${priorLabel}`, tone: "neutral" };
    return { label: `New vs prior ${priorLabel}`, tone: "positive" };
  }
  const pct = ((current - prior) / Math.abs(prior)) * 100;
  const sign = pct >= 0 ? "+" : "−";
  return {
    label: `${sign}${Math.abs(pct).toFixed(1)}% vs prior ${priorLabel}`,
    tone: pct >= 0 ? "positive" : "warning",
  };
}

function buildRevenuePeriodOptions(input: {
  financials: FinancialOverviewSnapshot | null;
  currency: string;
}): NonNullable<DashboardKpiItem["periods"]> {
  const currency = input.currency;
  const series = [...(input.financials?.charts.monthlyRevenue ?? [])].sort((a, b) =>
    a.month.localeCompare(b.month),
  );
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const ytdKeys = new Set(
    Array.from({ length: month }, (_, index) => `${year}-${String(index + 1).padStart(2, "0")}`),
  );
  const priorYtdKeys = new Set(
    Array.from({ length: month }, (_, index) => `${year - 1}-${String(index + 1).padStart(2, "0")}`),
  );

  const ytdFromSeries = sumSeries(series.filter((point) => ytdKeys.has(point.month.slice(0, 7))));
  const priorYtdFromSeries = sumSeries(
    series.filter((point) => priorYtdKeys.has(point.month.slice(0, 7))),
  );
  const revenueYtd = input.financials?.revenueYtd ?? ytdFromSeries;
  const thisMonthKey = `${year}-${String(month).padStart(2, "0")}`;
  const lastMonthDate = new Date(Date.UTC(year, month - 2, 1));
  const lastMonthKey = `${lastMonthDate.getUTCFullYear()}-${String(lastMonthDate.getUTCMonth() + 1).padStart(2, "0")}`;
  const priorLastMonthDate = new Date(Date.UTC(year, month - 3, 1));
  const priorLastMonthKey = `${priorLastMonthDate.getUTCFullYear()}-${String(priorLastMonthDate.getUTCMonth() + 1).padStart(2, "0")}`;
  const amountForMonth = (key: string) =>
    series.find((point) => point.month.slice(0, 7) === key)?.amount ?? 0;
  const thisMonthAmount =
    input.financials?.monthlyRevenue ?? amountForMonth(thisMonthKey);
  const lastMonthAmount = amountForMonth(lastMonthKey);
  const last3Keys = [0, 1, 2].map((offset) => {
    const date = new Date(Date.UTC(year, month - 1 - offset, 1));
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
  });
  const prior3Keys = [3, 4, 5].map((offset) => {
    const date = new Date(Date.UTC(year, month - 1 - offset, 1));
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
  });
  const last3Amount = sumSeries(series.filter((point) => last3Keys.includes(point.month.slice(0, 7))));
  const prior3Amount = sumSeries(
    series.filter((point) => prior3Keys.includes(point.month.slice(0, 7))),
  );
  const annualAmount = input.financials?.annualRevenue ?? revenueYtd;

  const ytdDelta =
    priorYtdFromSeries > 0 || revenueYtd > 0
      ? pctChangeLabel(revenueYtd, priorYtdFromSeries, "year YTD")
      : { label: "Year to date · ledger", tone: "neutral" as const };
  const monthDeltaValue = pctChangeLabel(thisMonthAmount, lastMonthAmount, "month");
  const lastMonthDelta = pctChangeLabel(
    lastMonthAmount,
    amountForMonth(priorLastMonthKey),
    "month",
  );
  const quarterDelta =
    prior3Amount > 0 || last3Amount > 0
      ? pctChangeLabel(last3Amount, prior3Amount, "3 months")
      : { label: "Last 3 months · ledger", tone: "neutral" as const };

  return [
    {
      id: "ytd",
      label: "YTD",
      value: formatCompactMoney(revenueYtd, currency),
      delta: ytdDelta.label,
      tone: ytdDelta.tone,
      hint: "Year to date · general ledger",
    },
    {
      id: "this-month",
      label: "This month",
      value: formatCompactMoney(thisMonthAmount, currency),
      delta: monthDeltaValue.label,
      tone: monthDeltaValue.tone,
      hint: "Current calendar month",
    },
    {
      id: "last-month",
      label: "Last month",
      value: formatCompactMoney(lastMonthAmount, currency),
      delta: lastMonthDelta.label,
      tone: lastMonthDelta.tone,
      hint: "Prior calendar month",
    },
    {
      id: "last-3-months",
      label: "Last 3 months",
      value: formatCompactMoney(last3Amount, currency),
      delta: quarterDelta.label,
      tone: quarterDelta.tone,
      hint: "Trailing 3 months · ledger",
    },
    {
      id: "full-year",
      label: "Full year",
      value: formatCompactMoney(annualAmount, currency),
      delta: "Calendar year · ledger",
      tone: "neutral",
      hint: "Calendar year to date / annual",
    },
  ];
}

export function countProjectsAtRisk(projects: InternalProject[], now = Date.now()) {
  return projects.filter((project) => {
    if (project.phase !== "live") return false;
    if (project.notes?.toLowerCase().includes("risk")) return true;
    if (!project.endDate) return project.progressPct < 35;
    const days = (new Date(`${project.endDate}T12:00:00`).getTime() - now) / 86_400_000;
    return days <= 14 && project.progressPct < 70;
  }).length;
}

function priorMonthKey(monthPrefix: string) {
  const [year, month] = monthPrefix.split("-").map(Number);
  if (!year || !month) return monthPrefix;
  const date = new Date(Date.UTC(year, month - 2, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function burnPreviousMonthDelta(
  burn: FinancialOverviewSnapshot["burnRate"] | undefined,
): { label: string; tone: DashboardKpiItem["tone"] } {
  const priorKey = priorMonthKey(new Date().toISOString().slice(0, 7));
  const monthLabel = shortMonthLabel(priorKey);
  if (!burn) {
    return { label: `${monthLabel} · previous month`, tone: "neutral" };
  }
  const changePct = burn.changePct;
  if (Math.abs(changePct) < 0.05) {
    return { label: `${monthLabel} · flat vs prior`, tone: "neutral" };
  }
  const sign = changePct > 0 ? "+" : "−";
  return {
    label: `${monthLabel} · ${sign}${Math.abs(changePct).toFixed(1)}% vs prior`,
    tone: burn.trend === "increasing" ? "warning" : burn.trend === "improving" ? "positive" : "neutral",
  };
}

/** Live KPI values for the Executive Home row (same SSOT as Command Centre). */
export function buildExecutiveHomeLiveKpis(input: {
  financials: FinancialOverviewSnapshot | null;
  projects: InternalProject[];
  clients: ManagedClient[];
}): [
  DashboardKpiItem,
  DashboardKpiItem,
  DashboardKpiItem,
  DashboardKpiItem,
] {
  const currency = input.financials?.burnRate.currency || "GBP";
  const revenuePeriods = buildRevenuePeriodOptions({ financials: input.financials, currency });
  const revenueYtd = input.financials?.revenueYtd ?? 0;
  const cash = input.financials?.cashPosition ?? 0;
  const burn = input.financials?.burnRate;
  // Prefer closed prior-month burn (current month is usually partial).
  const burnPrevious =
    burn && burn.previousMonthly > 0 ? burn.previousMonthly : (burn?.monthly ?? 0);
  const activeClients = input.clients.filter((client) => client.accountStatus === "Active").length;
  const onboarding = input.clients.filter((client) =>
    ["Client Created", "Workspace Provisioned", "Onboarding"].includes(client.accountStatus),
  ).length;

  const cashDelta = monthDelta(input.financials?.charts.cashPosition);
  const burnDelta = burnPreviousMonthDelta(burn);
  const abhiHome = isBrowserAbhiHome();
  const defaultRevenuePeriodId = abhiHome ? "last-month" : "ytd";
  const defaultRevenuePeriod =
    revenuePeriods.find((period) => period.id === defaultRevenuePeriodId) ??
    revenuePeriods.find((period) => period.id === "ytd") ??
    revenuePeriods[0];

  return normalizeKpiRow([
    {
      id: "revenue",
      label: "Revenue",
      value: defaultRevenuePeriod?.value ?? formatCompactMoney(revenueYtd, currency),
      delta: defaultRevenuePeriod?.delta ?? "YTD from ledger",
      tone: defaultRevenuePeriod?.tone ?? "neutral",
      hint: defaultRevenuePeriod?.hint ?? "YTD · general ledger",
      defaultPeriodId: defaultRevenuePeriodId,
      periods: revenuePeriods,
    },
    {
      id: "cash",
      label: "Cash Available",
      value: formatCompactMoney(cash, currency),
      delta: cashDelta?.label ?? (abhiHome ? "Cash at bank" : "Operating + treasury"),
      tone: cashDelta?.tone ?? "neutral",
      hint: abhiHome ? "ABHI operating cash (GBP)" : "Wise / treasury position",
    },
    {
      id: "burn",
      label: "Burn Rate",
      value: `${formatCompactMoney(burnPrevious, currency)} / mo`,
      delta: burnDelta.label,
      tone: burnDelta.tone,
      hint: "Previous month operating spend",
    },
    {
      id: "clients",
      label: "Active Clients",
      value: String(activeClients),
      delta: onboarding > 0 ? `${onboarding} onboarding` : "",
      tone: "positive",
      hint: onboarding > 0 || !abhiHome ? "Live commercial relationships" : "",
    },
  ]);
}

export function withExecutiveHomeLiveKpis(
  config: WorkspaceDashboardConfig,
  kpis: ReturnType<typeof buildExecutiveHomeLiveKpis>,
): WorkspaceDashboardConfig {
  return {
    ...config,
    sections: config.sections.map((section) => {
      if (section.slot !== "kpi-row") return section;
      return {
        ...section,
        widgets: section.widgets.map((widget) =>
          widget.type === "kpi-row" ? { ...widget, kpis } : widget,
        ),
      };
    }),
  };
}

function shortMonthLabel(monthKey: string) {
  // Accept YYYY-MM or already-friendly labels
  const match = /^(\d{4})-(\d{2})/.exec(monthKey);
  if (!match) return monthKey.slice(0, 3);
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1));
  return date.toLocaleString("en-GB", { month: "short", timeZone: "UTC" });
}

function alignMonthlySeries(
  revenue: Array<{ month: string; amount: number }>,
  spend: Array<{ month: string; amount: number }>,
  limit = 6,
) {
  const keys = Array.from(
    new Set([...revenue.map((r) => r.month), ...spend.map((s) => s.month)]),
  ).sort();
  const slice = keys.slice(-limit);
  const revenueMap = new Map(revenue.map((r) => [r.month, r.amount]));
  const spendMap = new Map(spend.map((s) => [s.month, s.amount]));
  return slice.map((month) => ({
    month,
    label: shortMonthLabel(month),
    revenue: revenueMap.get(month) ?? 0,
    spend: spendMap.get(month) ?? 0,
  }));
}

/** Live Business Performance chart + annotations from ledger monthly series. */
export function buildExecutiveHomeLiveAnalytics(input: {
  financials: FinancialOverviewSnapshot | null;
}): {
  caption: string;
  series: DashboardAnalyticsSeries[];
  annotations: DashboardAnalyticsAnnotation[];
  emptyMessage: string;
} {
  const currency = "GBP";
  const revenueSeries = input.financials?.charts.monthlyRevenue ?? [];
  const points = alignMonthlySeries(
    revenueSeries,
    input.financials?.charts.monthlyOutgoings ?? [],
    Math.max(6, Math.min(7, revenueSeries.length || 6)),
  );

  const latest = points[points.length - 1];
  const prior = points[points.length - 2];
  const latestRevenue = latest?.revenue ?? input.financials?.monthlyRevenue ?? 0;
  const latestSpend = latest?.spend ?? input.financials?.monthlyExpenses ?? 0;
  const net = latestRevenue - latestSpend;
  const periodRevenue = points.reduce((sum, p) => sum + p.revenue, 0);
  const periodSpend = points.reduce((sum, p) => sum + p.spend, 0);

  let momLabel = "—";
  let momTone: DashboardAnalyticsAnnotation["tone"] = "neutral";
  if (prior && prior.revenue !== 0) {
    const pct = ((latestRevenue - prior.revenue) / Math.abs(prior.revenue)) * 100;
    momLabel = `${pct >= 0 ? "+" : "−"}${Math.abs(pct).toFixed(1)}%`;
    momTone = pct >= 0 ? "positive" : "warning";
  } else if (latest && latestRevenue > 0) {
    momLabel = "New";
    momTone = "positive";
  }

  const periodLabel =
    points.length > 0
      ? `${points[0].label}–${points[points.length - 1].label}`
      : "No months yet";

  const labels = points.map((p) => p.label);
  const revenueValues = points.map((p) => p.revenue);
  const spendValues = points.map((p) => p.spend);

  return {
    caption: `Revenue vs operating spend · ${periodLabel} (ledger)`,
    emptyMessage: "No revenue or spend posted in the general ledger for recent months.",
    series: [
      {
        id: "revenue",
        label: "Revenue",
        values: revenueValues,
        labels,
        format: "currency",
        currency,
        latestLabel: formatCompactMoney(latestRevenue, currency),
      },
      {
        id: "spend",
        label: "Operating spend",
        values: spendValues,
        labels,
        format: "currency",
        currency,
        latestLabel: formatCompactMoney(latestSpend, currency),
      },
    ],
    // ABHI Home keeps the chart only — these summary chips duplicate the KPI row.
    annotations: isBrowserAbhiHome()
      ? []
      : [
          {
            id: "latest-revenue",
            label: "Latest month revenue",
            value: formatCompactMoney(latestRevenue, currency),
            tone: "positive",
            hint: latest ? latest.label : "Current month",
          },
          {
            id: "latest-spend",
            label: "Latest month spend",
            value: formatCompactMoney(latestSpend, currency),
            tone: "neutral",
            hint: latest ? latest.label : "Current month",
          },
          {
            id: "net",
            label: "Month contribution",
            value: formatCompactMoney(net, currency),
            tone: net >= 0 ? "positive" : "warning",
            hint: "Revenue − spend",
          },
          {
            id: "mom",
            label: "Revenue MoM",
            value: momLabel,
            tone: momTone,
            hint:
              points.length >= 2
                ? `${formatCompactMoney(periodRevenue, currency)} in / ${formatCompactMoney(periodSpend, currency)} out · ${points.length} mo`
                : "Need 2 months of history",
          },
        ],
  };
}

export function withExecutiveHomeLiveAnalytics(
  config: WorkspaceDashboardConfig,
  analytics: ReturnType<typeof buildExecutiveHomeLiveAnalytics>,
): WorkspaceDashboardConfig {
  return {
    ...config,
    sections: config.sections.map((section) => {
      if (section.slot !== "analytics-queue") return section;
      return {
        ...section,
        widgets: section.widgets.map((widget) =>
          widget.type === "analytics"
            ? {
                ...widget,
                caption: analytics.caption,
                series: analytics.series,
                annotations: analytics.annotations,
                emptyMessage: analytics.emptyMessage,
              }
            : widget,
        ),
      };
    }),
  };
}

function greetingForNow() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning.";
  if (hour < 18) return "Good afternoon.";
  return "Good evening.";
}

/** Build live narrative widgets so Home never shows Internal Philip/ABC mocks. */
export function buildExecutiveHomeLiveNarrative(input: {
  financials: FinancialOverviewSnapshot | null;
  projects: InternalProject[];
  clients: ManagedClient[];
}) {
  const currency = input.financials?.burnRate?.currency || "GBP";
  const cash = input.financials?.cashPosition ?? 0;
  const overdue = input.financials?.ar.overdue ?? 0;
  const overdueCount =
    input.financials?.ar.overdueCount ??
    // Legacy snapshots without overdueCount — never use all-outstanding as overdue.
    0;
  const openProjects = countLiveProjects(input.projects);
  const atRisk = input.projects.filter(
    (project) => project.phase === "live" && project.progressPct > 0 && project.progressPct < 40,
  );
  const activeClients = input.clients.filter((client) => client.accountStatus === "Active");
  const onboarding = input.clients.filter((client) =>
    ["Client Created", "Workspace Provisioned", "Onboarding"].includes(client.accountStatus),
  );
  const recentClients = [...input.clients]
    .sort((a, b) =>
      String(b.updatedAt ?? b.createdAt ?? "").localeCompare(String(a.updatedAt ?? a.createdAt ?? "")),
    )
    .slice(0, 3);
  const liveProjects = input.projects.filter((project) => project.phase === "live").slice(0, 3);

  let companyName = "Unit311";
  let abhiHome = false;
  try {
    if (typeof window !== "undefined") {
      const { isBrowserAbhiSurface } =
        require("@/lib/abhi-surface") as typeof import("@/lib/abhi-surface");
      if (isBrowserAbhiSurface()) {
        companyName = "ABHI";
        abhiHome = true;
      } else {
        const { isBrowserCorpCentreSurface } =
          require("@/lib/corpcentre-surface") as typeof import("@/lib/corpcentre-surface");
        if (isBrowserCorpCentreSurface()) {
          companyName = "CorpCentre";
        } else {
          const { isBrowserDemoSurface, getDemoEnterpriseFixtures } =
            require("@/lib/demo-enterprise") as typeof import("@/lib/demo-enterprise");
          if (isBrowserDemoSurface()) {
            companyName = getDemoEnterpriseFixtures().company.tradingName;
          }
        }
      }
    }
  } catch {
    // keep default
  }

  const attention =
    (overdue > 0 ? 1 : 0) + (atRisk.length > 0 ? 1 : 0) + (onboarding.length > 0 ? 1 : 0);

  const summaryParts = [
    `${activeClients.length} active clients across the portfolio.`,
    `${openProjects} live projects in delivery.`,
    cash > 0
      ? `Cash position ${formatCompactMoney(cash, currency)}.`
      : "Cash position needs treasury attention.",
    overdue > 0
      ? `${overdueCount} invoices overdue (${formatCompactMoney(overdue, currency)}).`
      : "Receivables are current.",
    atRisk.length > 0
      ? `${atRisk.length} delivery engagement${atRisk.length === 1 ? "" : "s"} behind plan.`
      : "No live projects currently flagged at risk.",
  ];

  const alerts: Array<{
    id: string;
    title: string;
    detail: string;
    severity: "critical" | "warning" | "info";
    timeLabel: string;
  }> = [];
  if (overdue > 0) {
    alerts.push({
      id: "live-ar",
      title: `${overdueCount} overdue invoice${overdueCount === 1 ? "" : "s"}`,
      detail: `${formatCompactMoney(overdue, currency)} outstanding — chase sequence recommended.`,
      severity: overdue > 100_000 ? "critical" : "warning",
      timeLabel: "Finance",
    });
  }
  if (atRisk[0]) {
    alerts.push({
      id: "live-risk",
      title: `Project behind plan — ${atRisk[0].name}`,
      detail: `${atRisk[0].clientName} · ${atRisk[0].progressPct}% complete. Recovery plan required.`,
      severity: "warning",
      timeLabel: "Delivery",
    });
  }
  if (onboarding.length > 0) {
    alerts.push({
      id: "live-onboard",
      title: `${onboarding.length} client${onboarding.length === 1 ? "" : "s"} in onboarding`,
      detail: "Complete workspace provisioning and kickoff packs this week.",
      severity: "info",
      timeLabel: "Clients",
    });
  }
  // Cash is already on the KPI row — skip the redundant bank info chip on ABHI Home.
  if (!abhiHome) {
    alerts.push({
      id: "live-treasury",
      title: `${companyName} treasury position`,
      detail: `Wise simulated balances total ${formatCompactMoney(cash, currency)} across operating currencies.`,
      severity: "info",
      timeLabel: "Bank",
    });
  }

  const activity: Array<{
    id: string;
    title: string;
    meta: string;
    timeLabel: string;
    category: string;
  }> = [];
  for (const project of liveProjects) {
    activity.push({
      id: `proj-${project.id}`,
      title: `Live engagement — ${project.name}`,
      meta: `${project.clientName} · ${project.progressPct}%`,
      timeLabel: "Projects",
      category: "Delivery",
    });
  }
  for (const client of recentClients.slice(0, 2)) {
    activity.push({
      id: `client-${client.id}`,
      title: `Client record — ${client.companyName}`,
      meta: `${client.accountStatus} · ${client.industry || "Consulting"}`,
      timeLabel: "CRM",
      category: "Clients",
    });
  }
  if (overdueCount > 0) {
    activity.push({
      id: "fin-ar",
      title: "Receivables ageing updated",
      meta: `${formatCompactMoney(overdue, currency)} overdue · ${overdueCount} invoices`,
      timeLabel: "Finance",
      category: "Finance",
    });
  }

  const queue: Array<{
    id: string;
    title: string;
    meta: string;
    status: string;
    dueLabel: string;
    priority: "high" | "medium" | "low";
  }> = [];
  if (overdue > 0) {
    queue.push({
      id: "q-ar",
      title: "Authorise overdue invoice chase sequence",
      meta: `Finance · ${formatCompactMoney(overdue, currency)} AR`,
      status: "Decision",
      dueLabel: "Today",
      priority: "high",
    });
  }
  if (atRisk[0]) {
    queue.push({
      id: "q-risk",
      title: `Review recovery plan — ${atRisk[0].name}`,
      meta: "Project · Delivery risk",
      status: "Review",
      dueLabel: "Today",
      priority: "high",
    });
  }
  if (onboarding[0]) {
    queue.push({
      id: "q-onboard",
      title: `Complete onboarding — ${onboarding[0].companyName}`,
      meta: "Clients · Workspace setup",
      status: "Action",
      dueLabel: "This week",
      priority: "medium",
    });
  }
  queue.push({
    id: "q-cash",
    title: "Confirm treasury balances for board pack",
    meta: `Bank · ${formatCompactMoney(cash, currency)}`,
    status: "Review",
    dueLabel: "This week",
    priority: "medium",
  });

  return {
    ai: {
      headline: greetingForNow(),
      summary: summaryParts.join(" "),
      nextUp:
        queue[0]?.title ??
        `Review ${companyName} operating dashboard before leadership sync.`,
      metrics: [
        { label: "Needs attention", value: String(Math.max(attention, queue.length)) },
        { label: "Live projects", value: String(openProjects) },
        { label: "Active clients", value: String(activeClients.length) },
      ],
    },
    alerts: alerts.slice(0, 4),
    activity: activity.slice(0, 5),
    queue: queue.slice(0, 5),
  };
}

export function withExecutiveHomeLiveNarrative(
  config: WorkspaceDashboardConfig,
  narrative: ReturnType<typeof buildExecutiveHomeLiveNarrative>,
): WorkspaceDashboardConfig {
  return {
    ...config,
    sections: config.sections.map((section) => {
      if (section.slot === "ai-summary") {
        return {
          ...section,
          widgets: section.widgets.map((widget) =>
            widget.type === "ai-summary"
              ? {
                  ...widget,
                  headline: narrative.ai.headline,
                  summary: narrative.ai.summary,
                  nextUp: narrative.ai.nextUp,
                  metrics: narrative.ai.metrics,
                }
              : widget,
          ),
        };
      }
      if (section.slot === "alerts-activity") {
        return {
          ...section,
          widgets: section.widgets.map((widget) => {
            if (widget.type === "alerts") return { ...widget, items: narrative.alerts };
            if (widget.type === "recent-activity") return { ...widget, items: narrative.activity };
            return widget;
          }),
        };
      }
      if (section.slot === "analytics-queue") {
        return {
          ...section,
          widgets: section.widgets.map((widget) =>
            widget.type === "work-queue" ? { ...widget, items: narrative.queue } : widget,
          ),
        };
      }
      return section;
    }),
  };
}

export function withExecutiveHomeLiveData(
  config: WorkspaceDashboardConfig,
  input: {
    financials: FinancialOverviewSnapshot | null;
    projects: InternalProject[];
    clients: ManagedClient[];
  },
): WorkspaceDashboardConfig {
  return withExecutiveHomeLiveNarrative(
    withExecutiveHomeLiveAnalytics(
      withExecutiveHomeLiveKpis(config, buildExecutiveHomeLiveKpis(input)),
      buildExecutiveHomeLiveAnalytics(input),
    ),
    buildExecutiveHomeLiveNarrative(input),
  );
}

/**
 * Flagship Executive Home Dashboard — composed entirely from the
 * universal dashboard framework. No bespoke layout.
 * KPI values are placeholders until live data is merged via withExecutiveHomeLiveKpis.
 */
export const executiveHomeDashboardConfig: WorkspaceDashboardConfig = {
  id: "executive-home-dashboard",
  workspaceId: "home",
  version: 1,
  sections: [
    {
      id: "header",
      slot: "header",
      widgets: [
        {
          id: "home-header",
          type: "header",
          workspaceName: "Home",
          description:
            "Executive Dashboard — Your organisation at a glance. AI-powered insights, priorities and business performance across every workspace.",
        },
      ],
    },
    {
      id: "ai",
      slot: "ai-summary",
      widgets: [
        {
          id: "home-ai",
          type: "ai-summary",
          title: "AI Executive Summary",
          headline: "Loading executive summary…",
          summary:
            "Live portfolio metrics will appear here once financials, projects, and clients have loaded.",
          nextUp: "Open Financials or Clients to review operating priorities.",
          metrics: [
            { label: "Needs attention", value: "6" },
            { label: "Changed this week", value: "14" },
            { label: "Decisions due", value: "3" },
          ],
        },
      ],
    },
    {
      id: "kpis",
      slot: "kpi-row",
      widgets: [
        {
          id: "home-kpis",
          type: "kpi-row",
          kpis: normalizeKpiRow([
            {
              id: "revenue",
              label: "Revenue",
              value: "—",
              hint: "YTD · general ledger",
            },
            {
              id: "cash",
              label: "Cash Available",
              value: "—",
              hint: "Wise / treasury position",
            },
            {
              id: "burn",
              label: "Burn Rate",
              value: "—",
              hint: "Previous month operating spend",
            },
            {
              id: "clients",
              label: "Active Clients",
              value: "—",
              hint: "Live commercial relationships",
            },
          ]),
        },
      ],
    },
    {
      id: "alerts-activity",
      slot: "alerts-activity",
      widgets: [
        {
          id: "home-alerts",
          type: "alerts",
          title: "Business Alerts",
          items: [
            {
              id: "ha1",
              title: "Loading business alerts…",
              detail: "Alerts are derived from receivables, delivery risk, and onboarding.",
              severity: "info",
              timeLabel: "Live",
            },
          ],
        },
        {
          id: "home-activity",
          type: "recent-activity",
          title: "Recent Business Activity",
          items: [
            {
              id: "act1",
              title: "Loading activity…",
              meta: "Projects and clients will appear here",
              timeLabel: "—",
              category: "System",
            },
          ],
        },
      ],
    },
    {
      id: "analytics-queue",
      slot: "analytics-queue",
      widgets: [
        {
          id: "home-analytics",
          type: "analytics",
          title: "Business Performance",
          caption: "Revenue vs operating spend · ledger",
          emptyMessage: "Loading ledger performance…",
          series: [
            { id: "revenue", label: "Revenue", values: [], format: "currency", currency: "GBP" },
            {
              id: "spend",
              label: "Operating spend",
              values: [],
              format: "currency",
              currency: "GBP",
            },
          ],
        },
        {
          id: "home-queue",
          type: "work-queue",
          title: "Tasks Requiring Attention",
          items: [
            {
              id: "tq1",
              title: "Loading priorities…",
              meta: "Derived from live operating data",
              status: "Review",
              dueLabel: "—",
              priority: "medium",
            },
          ],
        },
      ],
    },
  ],
};
