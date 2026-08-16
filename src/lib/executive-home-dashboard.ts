import {
  ABHI_CASH_BALANCE_GBP,
  ABHI_CASH_PRIOR_MONTH_GBP,
  ABHI_MONTHLY_BURN_PRIOR_GBP,
} from "@/lib/abhi-financials";
import { formatMoney, withPreferredCurrencySymbol } from "@/lib/accounting/chart-of-accounts";
import { formatReportingMoney, roundReportingPercent } from "@/lib/financial-reporting-currency";
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
import {
  ONWARDAIR_CASH_BALANCE_USD,
  ONWARDAIR_CASH_PRIOR_MONTH_USD,
} from "@/lib/onwardair-financials";
import type { InternalProject } from "@/lib/projects-data";

const OA_COMMERCIAL_CLIENT_IDS = new Set([
  "oa-cli-gulf-defense",
  "oa-cli-medireach",
  "oa-cli-coastal-freight",
]);

function isBrowserDemoHome(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const { isBrowserDemoSurface } =
      require("@/lib/demo-enterprise/surface") as typeof import("@/lib/demo-enterprise/surface");
    return isBrowserDemoSurface();
  } catch {
    return false;
  }
}

function isBrowserOnwardAirHome(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const { isBrowserOnwardAirSurface } =
      require("@/lib/onwardair-surface") as typeof import("@/lib/onwardair-surface");
    return isBrowserOnwardAirSurface();
  } catch {
    return false;
  }
}

/** Detect OA Home payloads even if host helpers fail. */
function isOnwardAirHomeBundle(clients: ManagedClient[]): boolean {
  if (isBrowserOnwardAirHome()) return true;
  return clients.some(
    (client) =>
      OA_COMMERCIAL_CLIENT_IDS.has(client.id) ||
      client.id.startsWith("oa-cli-") ||
      client.id.startsWith("oa-grant-"),
  );
}

/** Only the 3 commercial demo accounts — exclude grant funders + board/overview portal rows. */
function selectHomeActiveClients(clients: ManagedClient[]): ManagedClient[] {
  const active = clients.filter((client) => client.accountStatus === "Active");
  const commercial = active.filter((client) => OA_COMMERCIAL_CLIENT_IDS.has(client.id));
  if (commercial.length > 0) return commercial;
  if (!isOnwardAirHomeBundle(clients)) return active;
  return active.filter(
    (client) =>
      !client.id.startsWith("oa-grant-") &&
      client.id !== "oa-cli-board" &&
      client.id !== "oa-cli-overview",
  );
}

/** Never show $0 cash on OA Home when the ledger path failed to pin the fixture. */
function resolveHomeCashPosition(
  financials: FinancialOverviewSnapshot | null,
  clients: ManagedClient[],
): number {
  const live = financials?.cashPosition ?? 0;
  if (live > 0) return live;
  if (isOnwardAirHomeBundle(clients) || isBrowserOnwardAirHome()) {
    return ONWARDAIR_CASH_BALANCE_USD;
  }
  if (isBrowserAbhiHome()) {
    return ABHI_CASH_BALANCE_GBP;
  }
  return live;
}

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

function isBrowserTalantonHome(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const { isBrowserTalantonImpactSurface } =
      require("@/lib/talanton-surface") as typeof import("@/lib/talanton-surface");
    return isBrowserTalantonImpactSurface();
  } catch {
    return false;
  }
}

function buildTalantonExecutiveHomeKpis(): DashboardKpiItem[] {
  const {
    buildPortfolioImpactBriefing,
  } = require("@/lib/talanton/impact-intelligence") as typeof import("@/lib/talanton/impact-intelligence");
  const {
    formatUsd,
    TALANTON_PORTFOLIO_COMPANIES,
  } = require("@/lib/talanton/portfolio-data") as typeof import("@/lib/talanton/portfolio-data");

  const briefing = buildPortfolioImpactBriefing();
  const capitalRaised = TALANTON_PORTFOLIO_COMPANIES.reduce(
    (sum, company) => sum + company.investmentAmountUsd,
    0,
  );

  return normalizeKpiRow([
    {
      id: "portfolio-companies",
      label: "Portfolio Companies",
      value: String(TALANTON_PORTFOLIO_COMPANIES.length),
      delta: "Active holdings",
      tone: "positive",
      hint: "Talanton Impact portfolio",
    },
    {
      id: "countries-active",
      label: "Countries Active",
      value: String(briefing.summary.countriesImpacted),
      delta: "Across Africa",
      tone: "positive",
      hint: "Countries with active holdings",
    },
    {
      id: "capital-raised",
      label: "Total Capital Raised",
      value: formatUsd(capitalRaised),
      delta: "Deployed into holdings",
      tone: "neutral",
      hint: "Cumulative investment capital",
    },
    {
      id: "people-served",
      label: "People Served",
      value: briefing.summary.peopleServed.toLocaleString(),
      delta: "Portfolio reach",
      tone: "positive",
      hint: "Estimated people reached",
    },
    {
      id: "jobs-created",
      label: "Jobs Created",
      value: briefing.summary.jobsCreated.toLocaleString(),
      delta: `${briefing.summary.jobsRetained.toLocaleString()} retained`,
      tone: "positive",
      hint: "Rolling jobs created",
    },
    {
      id: "impact-health",
      label: "Impact Health Score",
      value: `${briefing.health.score}/100`,
      delta: briefing.health.band,
      tone:
        briefing.health.band === "Strong" || briefing.health.band === "Healthy"
          ? "positive"
          : briefing.health.band === "Watch"
            ? "warning"
            : "critical",
      hint: briefing.health.postureReason.slice(0, 80),
    },
  ]);
}

/** Customer hosts (not Internal / Demo / ABHI / CorpCentre) — no platform treasury copy. */
function isBrowserCustomerCashSurface(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname.toLowerCase();
  if (
    host === "internal.unit311central.com" ||
    host === "internal.localhost" ||
    host === "demo.unit311central.com" ||
    host === "demo.localhost" ||
    host === "unit311central.com" ||
    host === "www.unit311central.com" ||
    host === "localhost"
  ) {
    return false;
  }
  if (isBrowserAbhiHome()) return false;
  try {
    const { isBrowserCorpCentreSurface } =
      require("@/lib/corpcentre-surface") as typeof import("@/lib/corpcentre-surface");
    if (isBrowserCorpCentreSurface()) return false;
  } catch {
    /* continue */
  }
  try {
    const { isBrowserDemoSurface } =
      require("@/lib/demo-enterprise") as typeof import("@/lib/demo-enterprise");
    if (isBrowserDemoSurface()) return false;
  } catch {
    /* continue */
  }
  return Boolean(host.match(/^[a-z0-9-]+\.unit311central\.com$/i) || host.endsWith(".localhost"));
}

const ONBOARDING_ACCOUNT_STATUSES = new Set([
  "Client Created",
  "Workspace Provisioned",
  "Onboarding",
]);

function countClientsInOnboarding(clients: ManagedClient[]) {
  return clients.filter((client) => ONBOARDING_ACCOUNT_STATUSES.has(client.accountStatus)).length;
}

/** ABHI home: prefer live client statuses, then incomplete onboarding pipeline records. */
function resolveEffectiveOnboardingCount(input: {
  clients: ManagedClient[];
  onboardingPipelineCount?: number;
  abhiHome: boolean;
}) {
  const fromClients = countClientsInOnboarding(input.clients);
  if (fromClients > 0) return fromClients;
  if (input.abhiHome && (input.onboardingPipelineCount ?? 0) > 0) {
    return input.onboardingPipelineCount ?? 0;
  }
  return 0;
}

function formatCompactMoney(amount: number, currency = "GBP") {
  if (isBrowserDemoHome()) {
    return formatReportingMoney(amount, currency);
  }
  const code = String(currency || "GBP").toUpperCase();
  const rounded = Math.ceil(Number(amount) || 0);
  const abs = Math.abs(rounded);
  const locale = code === "AUD" ? "en-AU" : code === "USD" ? "en-US" : "en-GB";
  const noDecimals = code === "USD" || code === "AUD" || code === "GBP";
  if (abs >= 1_000_000) {
    return withPreferredCurrencySymbol(
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency: code,
        notation: "compact",
        maximumFractionDigits: noDecimals ? 0 : 1,
        minimumFractionDigits: 0,
      }).format(rounded),
      code,
    );
  }
  if (abs >= 10_000) {
    return withPreferredCurrencySymbol(
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency: code,
        notation: "compact",
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
      }).format(rounded),
      code,
    );
  }
  if (noDecimals) {
    return formatReportingMoney(rounded, code);
  }
  return formatMoney(rounded, code);
}

function resolveHomeDisplayCurrency(financialCurrency?: string | null): string {
  const fromFinancials = String(financialCurrency ?? "")
    .trim()
    .toUpperCase();
  if (
    fromFinancials === "USD" ||
    fromFinancials === "GBP" ||
    fromFinancials === "EUR" ||
    fromFinancials === "AUD"
  ) {
    return fromFinancials;
  }
  try {
    const { resolveBrowserReportingCurrency } =
      require("@/lib/financial-reporting-currency") as typeof import("@/lib/financial-reporting-currency");
    return resolveBrowserReportingCurrency();
  } catch {
    /* ignore */
  }
  return "GBP";
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
  const pct = roundReportingPercent(((current - prior) / Math.abs(prior)) * 100);
  const sign = pct >= 0 ? "+" : "−";
  return {
    label: `${sign}${Math.abs(pct)}% vs prior ${priorLabel}`,
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
    label: `${monthLabel} · ${sign}${Math.abs(roundReportingPercent(changePct))}% vs prior`,
    tone: burn.trend === "increasing" ? "warning" : burn.trend === "improving" ? "positive" : "neutral",
  };
}

/** Live KPI values for the Executive Home row (same SSOT as Command Centre). */
export function buildExecutiveHomeLiveKpis(input: {
  financials: FinancialOverviewSnapshot | null;
  projects: InternalProject[];
  clients: ManagedClient[];
  onboardingPipelineCount?: number;
}): DashboardKpiItem[] {
  if (isBrowserTalantonHome()) {
    return buildTalantonExecutiveHomeKpis();
  }

  const currency = resolveHomeDisplayCurrency(input.financials?.burnRate?.currency);
  const revenuePeriods = buildRevenuePeriodOptions({ financials: input.financials, currency });
  const revenueYtd = input.financials?.revenueYtd ?? 0;
  const cash = resolveHomeCashPosition(input.financials, input.clients);
  const burn = input.financials?.burnRate;
  const financialsLoaded = input.financials != null;
  const oaHome = isOnwardAirHomeBundle(input.clients) || isBrowserOnwardAirHome();
  const abhiHome = isBrowserAbhiHome();
  const demoHome = isBrowserDemoHome();
  // Prefer closed prior-month burn on mature workspaces; Demo uses current month opex.
  const burnFromLedger =
    demoHome
      ? (burn?.monthly ?? 0)
      : burn && burn.previousMonthly > 0
        ? burn.previousMonthly
        : (burn?.monthly ?? 0);
  // OA demo: cash glide ~$80k/mo (1.08M → 1.0M); never show $0 burn on Home.
  const burnPrevious =
    burnFromLedger > 0
      ? burnFromLedger
      : oaHome
        ? Math.max(0, ONWARDAIR_CASH_PRIOR_MONTH_USD - ONWARDAIR_CASH_BALANCE_USD)
        : abhiHome
          ? ABHI_MONTHLY_BURN_PRIOR_GBP
          : 0;
  const activeClients = selectHomeActiveClients(input.clients).length;
  const effectiveOnboarding = resolveEffectiveOnboardingCount({
    clients: input.clients,
    onboardingPipelineCount: input.onboardingPipelineCount,
    abhiHome,
  });
  const clientsDelta =
    effectiveOnboarding > 0
      ? abhiHome
        ? `${effectiveOnboarding} in onboarding`
        : `${effectiveOnboarding} onboarding`
      : abhiHome
        ? "All members active"
        : oaHome
          ? "Commercial accounts"
          : "";

  const cashDelta = monthDelta(input.financials?.charts.cashPosition);
  const burnDelta = burnPreviousMonthDelta(burn);
  const defaultRevenuePeriodId = abhiHome ? "last-month" : "ytd";
  const defaultRevenuePeriod =
    revenuePeriods.find((period) => period.id === defaultRevenuePeriodId) ??
    revenuePeriods.find((period) => period.id === "ytd") ??
    revenuePeriods[0];
  const customerCashLabels = !abhiHome && isBrowserCustomerCashSurface();

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
      delta:
        cashDelta?.label ??
        (oaHome
          ? `Prior ${formatCompactMoney(ONWARDAIR_CASH_PRIOR_MONTH_USD, currency)}`
          : abhiHome
            ? `Prior ${formatCompactMoney(ABHI_CASH_PRIOR_MONTH_GBP, currency)}`
            : customerCashLabels
              ? "Ledger cash"
              : "Operating cash"),
      tone: cashDelta?.tone ?? (oaHome ? "neutral" : "neutral"),
      hint: oaHome
        ? "OnwardAir operating cash (USD)"
        : abhiHome
          ? "ABHI operating cash (GBP)"
          : customerCashLabels
            ? "Workspace cash from ledger"
            : "Operating cash position",
    },
    {
      id: "burn",
      label: "Burn Rate",
      value:
        financialsLoaded || oaHome || abhiHome
          ? `${formatCompactMoney(burnPrevious, currency)} / mo`
          : "—",
      delta: financialsLoaded || oaHome || abhiHome ? burnDelta.label : "Loading ledger…",
      tone: financialsLoaded || oaHome || abhiHome ? burnDelta.tone : "neutral",
      hint:
        financialsLoaded || oaHome || abhiHome
          ? "Previous month operating spend"
          : "Waiting for financial overview",
    },
    {
      id: "clients",
      label: abhiHome ? "Active Members" : "Active Clients",
      value: String(activeClients),
      delta: clientsDelta,
      tone: "positive",
      hint: abhiHome
        ? effectiveOnboarding > 0
          ? "Live membership relationships"
          : "Membership roster"
        : "Live commercial relationships",
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
  title?: string;
  caption: string;
  series: DashboardAnalyticsSeries[];
  annotations: DashboardAnalyticsAnnotation[];
  emptyMessage: string;
} {
  if (isBrowserTalantonHome()) {
    const {
      buildPortfolioImpactBriefing,
    } = require("@/lib/talanton/impact-intelligence") as typeof import("@/lib/talanton/impact-intelligence");
    const briefing = buildPortfolioImpactBriefing();
    const labels = ["Q1", "Q2", "Q3", "Q4"];
    const jobsBase = briefing.summary.jobsCreated;
    const peopleBase = briefing.summary.peopleServed;
    const jobsValues = [0.72, 0.84, 0.93, 1].map((f) => Math.round(jobsBase * f));
    const peopleValues = [0.7, 0.82, 0.92, 1].map((f) => Math.round(peopleBase * f));
    return {
      title: "Impact Performance",
      caption: "Jobs created vs people served · portfolio impact trends",
      emptyMessage: "Impact trend series will appear once portfolio metrics load.",
      series: [
        {
          id: "jobs",
          label: "Jobs created",
          values: jobsValues,
          labels,
          format: "number",
          latestLabel: briefing.summary.jobsCreated.toLocaleString(),
        },
        {
          id: "people",
          label: "People served",
          values: peopleValues,
          labels,
          format: "number",
          latestLabel: briefing.summary.peopleServed.toLocaleString(),
        },
      ],
      annotations: [
        {
          id: "impact-health",
          label: "Impact health",
          value: `${briefing.health.score}/100`,
          tone:
            briefing.health.band === "Strong" || briefing.health.band === "Healthy"
              ? "positive"
              : briefing.health.band === "Watch"
                ? "warning"
                : "critical",
          hint: briefing.health.band,
        },
        {
          id: "communities",
          label: "Communities",
          value: briefing.summary.communitiesImpacted.toLocaleString(),
          tone: "positive",
          hint: "Communities impacted",
        },
        {
          id: "countries",
          label: "Countries",
          value: String(briefing.summary.countriesImpacted),
          tone: "neutral",
          hint: "Active footprint",
        },
      ],
    };
  }

  const currency = resolveHomeDisplayCurrency(input.financials?.burnRate?.currency);
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
                title: analytics.title ?? widget.title,
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
  onboardingPipelineCount?: number;
}) {
  const currency = resolveHomeDisplayCurrency(input.financials?.burnRate?.currency);
  const cash = resolveHomeCashPosition(input.financials, input.clients);
  const overdue = input.financials?.ar.overdue ?? 0;
  const overdueCount =
    input.financials?.ar.overdueCount ??
    // Legacy snapshots without overdueCount — never use all-outstanding as overdue.
    0;
  const openProjects = countLiveProjects(input.projects);
  const atRisk = input.projects.filter(
    (project) => project.phase === "live" && project.progressPct > 0 && project.progressPct < 40,
  );
  const activeClients = selectHomeActiveClients(input.clients);
  const onboarding = input.clients.filter((client) =>
    ONBOARDING_ACCOUNT_STATUSES.has(client.accountStatus),
  );
  const recentClients = [...input.clients]
    .sort((a, b) =>
      String(b.updatedAt ?? b.createdAt ?? "").localeCompare(String(a.updatedAt ?? a.createdAt ?? "")),
    )
    .slice(0, 3);
  const liveProjects = input.projects.filter((project) => project.phase === "live").slice(0, 3);

  let companyName = "Workspace";
  let abhiHome = false;
  let showTreasurySurfaces = false;
  try {
    if (typeof window !== "undefined") {
      const host = window.location.hostname.toLowerCase();
      const slugMatch = host.match(/^([a-z0-9-]+)\.unit311central\.com$/i);
      const hostSlug = slugMatch?.[1] ?? "";
      if (hostSlug && hostSlug !== "www" && hostSlug !== "internal" && hostSlug !== "demo") {
        companyName = hostSlug
          .split("-")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" ");
      }

      const { isBrowserAbhiSurface } =
        require("@/lib/abhi-surface") as typeof import("@/lib/abhi-surface");
      if (isBrowserAbhiSurface()) {
        companyName = "ABHI";
        abhiHome = true;
      } else {
        const { isBrowserTalantonImpactSurface } =
          require("@/lib/talanton-surface") as typeof import("@/lib/talanton-surface");
        if (isBrowserTalantonImpactSurface()) {
          companyName = "Talanton Impact";
        } else {
        const { isBrowserCorpCentreSurface } =
          require("@/lib/corpcentre-surface") as typeof import("@/lib/corpcentre-surface");
        if (isBrowserCorpCentreSurface()) {
          companyName = "CorpCentre";
          showTreasurySurfaces = cash > 0;
        } else {
          const { isBrowserDemoSurface, getDemoEnterpriseFixtures } =
            require("@/lib/demo-enterprise") as typeof import("@/lib/demo-enterprise");
          if (isBrowserDemoSurface()) {
            companyName = getDemoEnterpriseFixtures().company.tradingName;
            showTreasurySurfaces = cash > 0;
          } else if (
            host === "internal.unit311central.com" ||
            host === "internal.localhost"
          ) {
            companyName = "Unit311";
            showTreasurySurfaces = cash > 0;
          }
          // Customer hosts (OnwardAir, etc.): never surface platform treasury.
        }
        }
      }

      try {
        const cached = window.sessionStorage?.getItem("unit311-whoami-workspace-name");
        if (cached && cached.trim()) companyName = cached.trim();
      } catch {
        /* ignore */
      }
    }
  } catch {
    // keep default
  }

  const effectiveOnboarding = resolveEffectiveOnboardingCount({
    clients: input.clients,
    onboardingPipelineCount: input.onboardingPipelineCount,
    abhiHome,
  });
  const showOverdueFinance = !abhiHome && overdue > 0;

  const attention =
    (showOverdueFinance ? 1 : 0) +
    (atRisk.length > 0 ? 1 : 0) +
    (effectiveOnboarding > 0 ? 1 : 0);

  const summaryParts = abhiHome
    ? [
        `${activeClients.length} active members.`,
        `${openProjects} live programmes in delivery.`,
        effectiveOnboarding > 0
          ? `${effectiveOnboarding} member${effectiveOnboarding === 1 ? "" : "s"} in onboarding.`
          : "Membership receivables are current.",
        atRisk.length > 0
          ? `${atRisk.length} programme${atRisk.length === 1 ? "" : "s"} behind plan.`
          : "No programmes currently flagged at risk.",
      ]
    : [
        `${activeClients.length} active clients across the portfolio.`,
        `${openProjects} live projects in delivery.`,
        cash > 0
          ? `Cash position ${formatCompactMoney(cash, currency)}.`
          : "No cash balance recorded yet.",
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
  if (showOverdueFinance) {
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
  if (effectiveOnboarding > 0) {
    alerts.push({
      id: "live-onboard",
      title: `${effectiveOnboarding} ${abhiHome ? "member" : "client"}${effectiveOnboarding === 1 ? "" : "s"} in onboarding`,
      detail: abhiHome
        ? "Complete membership provisioning and welcome packs this week."
        : "Complete workspace provisioning and kickoff packs this week.",
      severity: "info",
      timeLabel: abhiHome ? "Members" : "Clients",
    });
  }
  // Cash is already on the KPI row — never show platform/Wise treasury chips on customer homes.
  if (!abhiHome && showTreasurySurfaces && cash > 0) {
    alerts.push({
      id: "live-treasury",
      title: `${companyName} cash position`,
      detail: `Available cash ${formatCompactMoney(cash, currency)} across operating currencies.`,
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
  if (showOverdueFinance && overdueCount > 0) {
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
  if (showOverdueFinance) {
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
      meta: abhiHome ? "Members · Membership setup" : "Clients · Workspace setup",
      status: "Action",
      dueLabel: "This week",
      priority: "medium",
    });
  } else if (abhiHome && effectiveOnboarding > 0) {
    queue.push({
      id: "q-onboard-pipeline",
      title: `Review ${effectiveOnboarding} member onboarding pipeline`,
      meta: "Members · Membership setup",
      status: "Action",
      dueLabel: "This week",
      priority: "medium",
    });
  }
  if (!abhiHome && showTreasurySurfaces && cash > 0) {
    queue.push({
      id: "q-cash",
      title: "Confirm cash balances for board pack",
      meta: `Bank · ${formatCompactMoney(cash, currency)}`,
      status: "Review",
      dueLabel: "This week",
      priority: "medium",
    });
  }

  // OnwardAir: Competitor Intelligence feed → Business Alerts (read-only here).
  // Weekly refresh must run in a client effect — never during render / useMemo.
  try {
    if (typeof window !== "undefined") {
      const { isBrowserOnwardAirSurface } =
        require("@/lib/onwardair-surface") as typeof import("@/lib/onwardair-surface");
      if (isBrowserOnwardAirSurface()) {
        const feed =
          require("@/lib/onwardair/competitor-intelligence-feed-store") as typeof import("@/lib/onwardair/competitor-intelligence-feed-store");
        const ciAlerts = feed.listCompetitorIntelHomeAlerts().slice(0, 3);
        for (const item of ciAlerts) {
          alerts.push({
            id: `ci-${item.id}`,
            title: item.title,
            detail: item.summary.slice(0, 180) + (item.summary.length > 180 ? "…" : ""),
            severity: item.severity,
            timeLabel: "Competitor Intel",
          });
        }
        for (const item of feed.listCompetitorIntelFeed().slice(0, 2)) {
          activity.unshift({
            id: `ci-act-${item.id}`,
            title: item.title,
            meta: `${item.category}${item.competitorName ? ` · ${item.competitorName}` : ""}`,
            timeLabel: "Intel",
            category: "Competitor Intelligence",
          });
        }
        if (ciAlerts.length > 0) {
          queue.unshift({
            id: "q-ci-weekly",
            title: "Unreviewed competitor public signals",
            meta: "OnwardAir Intelligence · Competitor Intelligence",
            status: "Review",
            dueLabel: "This week",
            priority: "medium",
          });
        }
      }
    }
  } catch {
    /* feed optional */
  }

  const needsAttentionCount = abhiHome ? alerts.length : Math.max(attention, queue.length);
  const needsAttentionDetail =
    alerts.length === 0
      ? `Review ${companyName} operating dashboard before leadership sync.`
      : alerts.map((a) => a.title).join(" · ");

  return {
    ai: {
      headline: greetingForNow(),
      summary: summaryParts.join(" "),
      nextUp: needsAttentionDetail,
      metrics: [
        { label: "Needs attention", value: String(needsAttentionCount) },
        {
          label: abhiHome ? "Live programmes" : "Live projects",
          value: String(openProjects),
        },
        {
          label: abhiHome ? "Active members" : "Active clients",
          value: String(activeClients.length),
        },
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
    onboardingPipelineCount?: number;
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
          descriptionSingleLine: true,
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
              hint: "Workspace cash position",
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
            { id: "revenue", label: "Revenue", values: [], format: "currency", currency: "USD" },
            {
              id: "spend",
              label: "Operating spend",
              values: [],
              format: "currency",
              currency: "USD",
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
