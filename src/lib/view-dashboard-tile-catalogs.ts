import type { DashboardTileDefinition } from "@/lib/dashboard-view-tiles";
import {
  isClientPreActiveStatus,
  type ManagedClient,
} from "@/lib/client-management-data";
import { formatMoney, withPreferredCurrencySymbol } from "@/lib/accounting/chart-of-accounts";
import { isBrowserAbhiSurface } from "@/lib/abhi-surface";
import { isBrowserCorpCentreSurface } from "@/lib/corpcentre-surface";
import { isBrowserOnwardAirSurface } from "@/lib/onwardair-surface";
import { inferExpenseCategory, type FinancialExpense } from "@/lib/expenses-data";

function crmReportingCurrency(): "AUD" | "GBP" | "USD" {
  try {
    if (typeof window !== "undefined" && isBrowserOnwardAirSurface()) return "USD";
    if (typeof window !== "undefined" && isBrowserCorpCentreSurface()) return "AUD";
  } catch {
    // SSR / non-browser — keep platform default
  }
  return "GBP";
}

export function crmEstimatedValueCurrencyLabel(): string {
  return crmReportingCurrency();
}

export const CRM_DASHBOARD_TILES: DashboardTileDefinition[] = [
  { id: "open-leads", label: "Open leads", value: "0", hint: "Pipeline not closed" },
  { id: "qualified", label: "Qualified", value: "0", hint: "Ready for proposal" },
  { id: "pipeline-value", label: "Pipeline value", value: "£0", hint: "Estimated total" },
  { id: "due-this-week", label: "Won this quarter", value: "0", hint: "Closed-won leads" },
];

export function buildCrmDashboardCatalog(
  leads: Array<{ status?: string | null; estimatedValue?: number | null }>,
): DashboardTileDefinition[] {
  const open = leads.filter((lead) => {
    const status = (lead.status ?? "").toLowerCase();
    return status && !["won", "lost", "closed"].includes(status);
  });
  const qualified = leads.filter((lead) => {
    const status = (lead.status ?? "").toLowerCase();
    return status === "qualified" || status === "proposal" || status === "hot" || status === "warm";
  });
  const pipelineValue = open.reduce((sum, lead) => sum + (Number(lead.estimatedValue) || 0), 0);
  const won = leads.filter((lead) => (lead.status ?? "").toLowerCase() === "won");
  const currency = crmReportingCurrency();
  const money = withPreferredCurrencySymbol(
    new Intl.NumberFormat(currency === "AUD" ? "en-AU" : "en-GB", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(pipelineValue),
    currency,
  );

  return CRM_DASHBOARD_TILES.map((tile) => {
    switch (tile.id) {
      case "open-leads":
        return { ...tile, value: String(open.length) };
      case "qualified":
        return { ...tile, value: String(qualified.length) };
      case "pipeline-value":
        return { ...tile, value: money };
      case "due-this-week":
        return { ...tile, value: String(won.length), hint: "Closed-won leads" };
      default:
        return tile;
    }
  });
}

export const CLIENTS_DASHBOARD_TILES: DashboardTileDefinition[] = [
  { id: "total-clients", label: "Total clients", value: "0", hint: "Excludes archived" },
  { id: "active-clients", label: "Active clients", value: "0", hint: "Live accounts" },
  { id: "onboarding", label: "Onboarding", value: "0", hint: "In setup" },
  { id: "dormant", label: "Dormant", value: "0", hint: "Inactive accounts" },
  { id: "open-tickets", label: "Open support", value: "—", hint: "Load support data on Clients Dashboard" },
  { id: "active-projects", label: "Active projects", value: "—", hint: "Load projects on Clients Dashboard" },
  { id: "portal-users", label: "Portal users", value: "—", hint: "Load external users on Clients Dashboard" },
  { id: "renewals-30", label: "Renewals (30d)", value: "—", hint: "Requires renewal dates" },
];

export function buildClientDashboardCatalog(clients: ManagedClient[]): DashboardTileDefinition[] {
  const directory = clients.filter((client) => client.accountStatus !== "Archived");
  const activeCount = directory.filter((client) => client.accountStatus === "Active").length;
  const onboardingCount = directory.filter((client) =>
    isClientPreActiveStatus(client.accountStatus),
  ).length;
  const dormantCount = directory.filter((client) => client.accountStatus === "Dormant").length;
  const hasRenewal = directory.some((client) => Boolean(client.renewalDate));

  return CLIENTS_DASHBOARD_TILES.map((tile) => {
    switch (tile.id) {
      case "total-clients":
        return { ...tile, value: String(directory.length) };
      case "active-clients":
        return { ...tile, value: String(activeCount) };
      case "onboarding":
        return { ...tile, value: String(onboardingCount) };
      case "dormant":
        return { ...tile, value: String(dormantCount) };
      case "renewals-30":
        if (!hasRenewal) {
          return { ...tile, value: "—", hint: "No renewal dates on file" };
        }
        return tile;
      default:
        return tile;
    }
  });
}

export const REPRESENTATIVES_DASHBOARD_TILES: DashboardTileDefinition[] = [
  { id: "active-reps", label: "Active reps", value: "8", hint: "Field network" },
  { id: "commission-due", label: "Commission due", value: "€42k", hint: "Outstanding" },
  { id: "territories", label: "Territories", value: "12", hint: "Coverage regions" },
  { id: "new-leads", label: "Rep-sourced leads", value: "14", hint: "This quarter" },
];

export const ABHI_REPRESENTATIVES_DASHBOARD_TILES: DashboardTileDefinition[] = [
  { id: "active-reps", label: "Active agents", value: "2", hint: "Membership network" },
  { id: "commission-due", label: "Commission due", value: "£10k", hint: "Outstanding" },
  { id: "territories", label: "Territories", value: "2", hint: "UK & Ireland" },
  { id: "new-leads", label: "Rep-sourced leads", value: "5", hint: "This quarter" },
];

/** OnwardAir partners network — USD commissions (OA_PARTNERS ≈ 8). */
export const ONWARDAIR_REPRESENTATIVES_DASHBOARD_TILES: DashboardTileDefinition[] = [
  { id: "active-reps", label: "Active reps", value: "8", hint: "OA partner network" },
  { id: "commission-due", label: "Commission due", value: "$48k", hint: "Outstanding USD" },
  { id: "territories", label: "Territories", value: "5", hint: "US · ME · EU · Defense" },
  { id: "new-leads", label: "Rep-sourced leads", value: "11", hint: "This quarter" },
];

export const PROJECTS_DASHBOARD_TILES: DashboardTileDefinition[] = [
  { id: "live-projects", label: "Live projects", value: "0", hint: "In delivery" },
  { id: "upcoming", label: "Upcoming", value: "0", hint: "Mobilising soon" },
  { id: "avg-progress", label: "Avg progress", value: "0%", hint: "Live portfolio" },
  { id: "at-risk", label: "At risk", value: "0", hint: "Needs attention" },
];

function financialsFallbackCurrency(): string {
  try {
    if (typeof window !== "undefined") {
      const host = window.location.hostname.toLowerCase();
      if (host.includes("onwardair") || host === "onward.unit311central.com") return "USD";
      if (isBrowserOnwardAirSurface()) return "USD";
      if (isBrowserCorpCentreSurface()) return "AUD";
    }
  } catch {
    /* SSR */
  }
  return "GBP";
}

function emptyFinancialsDashboardTiles(currency: string): DashboardTileDefinition[] {
  const money = (value: number) => formatMoney(value, currency);
  return [
    { id: "revenue-ytd", label: "Revenue YTD", value: money(0), hint: "From general ledger" },
    {
      id: "cash-position",
      label: "Cash Position",
      value: money(0),
      hint: "From general ledger cash accounts",
    },
    { id: "burn-rate", label: "Burn Rate", value: `${money(0)} / month`, hint: "Operating spend pace" },
    { id: "accounts-receivable", label: "Accounts Receivable", value: money(0), hint: "Outstanding AR" },
    { id: "accounts-payable", label: "Accounts Payable", value: money(0), hint: "Outstanding AP" },
    { id: "net-profit", label: "Net Profit", value: money(0), hint: "Income − expenses" },
    { id: "outstanding-invoices", label: "Outstanding Invoices", value: "0", hint: "Open invoice count" },
    { id: "monthly-revenue", label: "Monthly Revenue", value: money(0), hint: "Current month" },
    { id: "monthly-expenses", label: "Monthly Expenses", value: money(0), hint: "Current month" },
    { id: "annual-revenue", label: "Annual Revenue", value: money(0), hint: "Calendar year" },
    { id: "annual-expenses", label: "Annual Expenses", value: money(0), hint: "Calendar year" },
    { id: "gross-margin", label: "Gross Margin", value: "0%", hint: "From ledger income/expenses" },
    { id: "forecast", label: "Forecast", value: money(0), hint: "Not configured yet" },
  ];
}

/** Default tile catalog — currency-aware empty state (avoids GBP flash on OA). */
export const FINANCIALS_DASHBOARD_TILES: DashboardTileDefinition[] =
  emptyFinancialsDashboardTiles(financialsFallbackCurrency());

function momFromSeries(series: Array<{ amount: number }> | undefined) {
  if (!series || series.length < 2) return null;
  const curr = series[series.length - 1]!.amount;
  const prev = series[series.length - 2]!.amount;
  if (prev === 0) return curr === 0 ? 0 : 100;
  return Math.round(((curr - prev) / Math.abs(prev)) * 1000) / 10;
}

export function buildFinancialsDashboardCatalog(
  overview: {
    revenueYtd: number;
    cashPosition: number;
    accountsReceivable: number;
    accountsPayable: number;
    netProfit: number;
    outstandingInvoices: number;
    monthlyRevenue: number;
    monthlyExpenses: number;
    annualRevenue: number;
    annualExpenses: number;
    burnRate?: {
      monthly: number;
      quarterly: number;
      annual: number;
      changePct: number;
      trend: "improving" | "stable" | "increasing";
      trendLabel: string;
      currency: string;
      forecastMonthly?: number;
    };
    charts?: {
      monthlyRevenue?: Array<{ amount: number }>;
      cashPosition?: Array<{ amount: number }>;
      monthlyOutgoings?: Array<{ amount: number }>;
    };
  } | null,
): DashboardTileDefinition[] {
  const fallbackCurrency = financialsFallbackCurrency();
  const currency = overview?.burnRate?.currency || fallbackCurrency;
  const money = (value: number) => formatMoney(value, currency);
  const burnMoney = (value: number, code = currency) => formatMoney(value, code);

  if (!overview) return emptyFinancialsDashboardTiles(fallbackCurrency);

  const tileTemplates = emptyFinancialsDashboardTiles(currency);

  const marginBaseExpenses =
    overview.annualExpenses > 0 ? overview.annualExpenses : overview.monthlyExpenses;
  const marginPct =
    overview.revenueYtd <= 0
      ? 0
      : Math.round(((overview.revenueYtd - marginBaseExpenses) / overview.revenueYtd) * 1000) / 10;
  const cashMom = momFromSeries(overview.charts?.cashPosition);
  const revMom = momFromSeries(overview.charts?.monthlyRevenue);
  const spendMom = momFromSeries(overview.charts?.monthlyOutgoings);

  return tileTemplates.map((tile) => {
    switch (tile.id) {
      case "revenue-ytd":
        return {
          ...tile,
          value: money(overview.revenueYtd),
          trend:
            revMom == null ? undefined : `${revMom > 0 ? "▲" : revMom < 0 ? "▼" : "●"} ${revMom > 0 ? "+" : ""}${revMom}% MoM`,
          accent: revMom == null ? undefined : revMom >= 0 ? "improving" : "increasing",
        };
      case "cash-position":
        return {
          ...tile,
          value: money(overview.cashPosition),
          trend:
            cashMom == null
              ? undefined
              : `${cashMom > 0 ? "▲" : cashMom < 0 ? "▼" : "●"} ${cashMom > 0 ? "+" : ""}${cashMom}% MoM`,
          accent: cashMom == null ? undefined : cashMom >= 0 ? "improving" : "increasing",
        };
      case "burn-rate": {
        const burn = overview.burnRate;
        if (!burn) return tile;
        const arrow = burn.trend === "improving" ? "▼" : burn.trend === "increasing" ? "▲" : "●";
        const signed =
          burn.changePct > 0 ? `+${burn.changePct}%` : `${burn.changePct}%`;
        return {
          ...tile,
          value: `${burnMoney(burn.monthly, burn.currency)} / month`,
          meta: [
            `Quarterly ${burnMoney(burn.quarterly, burn.currency)}`,
            `Annual ${burnMoney(burn.annual, burn.currency)}`,
          ],
          trend: `${arrow} ${signed}`,
          hint: burn.trendLabel,
          accent: burn.trend,
          interactive: true,
        };
      }
      case "accounts-receivable":
        return { ...tile, value: money(overview.accountsReceivable) };
      case "accounts-payable":
        return { ...tile, value: money(overview.accountsPayable) };
      case "net-profit":
        return { ...tile, value: money(overview.netProfit) };
      case "outstanding-invoices":
        return { ...tile, value: String(overview.outstandingInvoices) };
      case "monthly-revenue":
        return {
          ...tile,
          value: money(overview.monthlyRevenue),
          trend:
            revMom == null
              ? undefined
              : `${revMom > 0 ? "▲" : revMom < 0 ? "▼" : "●"} ${revMom > 0 ? "+" : ""}${revMom}% MoM`,
          accent: revMom == null ? undefined : revMom >= 0 ? "improving" : "increasing",
        };
      case "monthly-expenses":
        return {
          ...tile,
          value: money(overview.monthlyExpenses),
          trend:
            spendMom == null
              ? undefined
              : `${spendMom > 0 ? "▲" : spendMom < 0 ? "▼" : "●"} ${spendMom > 0 ? "+" : ""}${spendMom}% MoM`,
          accent: spendMom == null ? undefined : spendMom <= 0 ? "improving" : "increasing",
        };
      case "annual-revenue":
        return { ...tile, value: money(overview.annualRevenue) };
      case "annual-expenses":
        return { ...tile, value: money(overview.annualExpenses) };
      case "gross-margin":
        return { ...tile, value: `${marginPct}%` };
      case "forecast":
        return {
          ...tile,
          value: money(overview.burnRate?.forecastMonthly ?? 0),
          hint: "Projected monthly burn",
        };
      default:
        return tile;
    }
  });
}

export const DEBTORS_DASHBOARD_TILES: DashboardTileDefinition[] = [
  { id: "total-outstanding", label: "Outstanding", value: "€186k", hint: "All debtors" },
  { id: "overdue", label: "Overdue", value: "€24k", hint: "> 30 days" },
  { id: "dso", label: "DSO", value: "34 days", hint: "Days sales outstanding" },
  { id: "collected-mtd", label: "Collected MTD", value: "€58k", hint: "Cash received" },
];

export const CREDITORS_DASHBOARD_TILES: DashboardTileDefinition[] = [
  { id: "payables", label: "Payables", value: "€92k", hint: "Open invoices" },
  { id: "due-week", label: "Due this week", value: "€18k", hint: "Scheduled payments" },
  { id: "overdue-ap", label: "Overdue AP", value: "€6k", hint: "Needs approval" },
  { id: "paid-mtd", label: "Paid MTD", value: "€41k", hint: "Settled" },
];

export const EXPENSES_DASHBOARD_TILES: DashboardTileDefinition[] = [
  { id: "spend-mtd", label: "Spend MTD", value: "£0", hint: "From expense journals" },
  { id: "pending-approval", label: "Unpaid", value: "0", hint: "Open payables" },
  { id: "travel", label: "Categories", value: "0", hint: "Ledger-linked" },
  { id: "budget-remaining", label: "Posted", value: "0", hint: "With journal links" },
];

function expensesReportingCurrency(expenses: FinancialExpense[]): string {
  try {
    if (typeof window !== "undefined") {
      const host = window.location.hostname.toLowerCase();
      if (host.includes("onwardair") || host === "onward.unit311central.com") return "USD";
      if (isBrowserOnwardAirSurface()) return "USD";
      if (isBrowserCorpCentreSurface()) return "AUD";
      if (isBrowserAbhiSurface()) return "GBP";
    }
  } catch {
    // SSR / non-browser
  }
  if (expenses.some((expense) => String(expense.currency || "").toUpperCase() === "AUD")) {
    return "AUD";
  }
  const codes = expenses.map((expense) => String(expense.currency || "").toUpperCase());
  const gbp = codes.filter((code) => code === "GBP").length;
  const usd = codes.filter((code) => code === "USD").length;
  const eur = codes.filter((code) => code === "EUR").length;
  if (usd > 0 && usd >= gbp && usd >= eur) return "USD";
  if (gbp >= usd && gbp >= eur && gbp > 0) return "GBP";
  if (eur > gbp && eur > usd) return "EUR";
  return "GBP";
}

function emptyExpensesDashboardTiles(currency: string): DashboardTileDefinition[] {
  const money = (value: number) => formatMoney(value, currency);
  return [
    { id: "spend-mtd", label: "Spend MTD", value: money(0), hint: "From expense journals" },
    { id: "pending-approval", label: "Unpaid", value: "0", hint: "Open payables" },
    { id: "travel", label: "Categories", value: "0", hint: "Ledger-linked" },
    { id: "budget-remaining", label: "Posted", value: "0", hint: "With journal links" },
  ];
}

export function buildExpensesDashboardCatalog(
  expenses: FinancialExpense[],
): DashboardTileDefinition[] {
  const currency = expensesReportingCurrency(expenses);
  const templates = emptyExpensesDashboardTiles(currency);
  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const spendMtd = expenses
    .filter((expense) => {
      const date = expense.expenseDate || expense.dateSubmitted;
      return date.slice(0, 7) === monthPrefix;
    })
    .reduce((sum, expense) => sum + expense.amount, 0);

  const unpaidCount = expenses.filter((expense) => !expense.paid).length;

  const categories = new Set(
    expenses.map(
      (expense) =>
        expense.categoryAccountCode ||
        inferExpenseCategory(expense.purposeDescription),
    ),
  );

  const postedCount = expenses.filter((expense) => Boolean(expense.journalEntryId)).length;
  const money = (value: number) => formatMoney(value, currency);

  return templates.map((tile) => {
    switch (tile.id) {
      case "spend-mtd":
        return { ...tile, value: money(spendMtd) };
      case "pending-approval":
        return { ...tile, value: String(unpaidCount) };
      case "travel":
        return { ...tile, value: String(categories.size) };
      case "budget-remaining":
        return { ...tile, value: String(postedCount) };
      default:
        return tile;
    }
  });
}

export const HR_DASHBOARD_TILES: DashboardTileDefinition[] = [
  { id: "headcount", label: "Headcount", value: "47", hint: "Active employees" },
  { id: "open-roles", label: "Open roles", value: "3", hint: "Recruiting" },
  { id: "on-leave", label: "On leave", value: "4", hint: "This week" },
  { id: "reviews-due", label: "Reviews due", value: "6", hint: "Performance cycle" },
];

export const DEFAULT_CRM_TILE_LAYOUT = CRM_DASHBOARD_TILES.map((tile) => tile.id);
export const DEFAULT_CLIENTS_TILE_LAYOUT = CLIENTS_DASHBOARD_TILES.map((tile) => tile.id);
export const DEFAULT_REPRESENTATIVES_TILE_LAYOUT = REPRESENTATIVES_DASHBOARD_TILES.map((tile) => tile.id);
export const DEFAULT_PROJECTS_TILE_LAYOUT = PROJECTS_DASHBOARD_TILES.map((tile) => tile.id);
/** Cleaner default KPI strip — full catalogue remains available via Customize. */
export const DEFAULT_FINANCIALS_TILE_LAYOUT = [
  "revenue-ytd",
  "cash-position",
  "burn-rate",
  "accounts-receivable",
  "accounts-payable",
  "net-profit",
  "gross-margin",
  "monthly-revenue",
];
export const DEFAULT_DEBTORS_TILE_LAYOUT = DEBTORS_DASHBOARD_TILES.map((tile) => tile.id);
export const DEFAULT_CREDITORS_TILE_LAYOUT = CREDITORS_DASHBOARD_TILES.map((tile) => tile.id);
export const DEFAULT_EXPENSES_TILE_LAYOUT = EXPENSES_DASHBOARD_TILES.map((tile) => tile.id);
export const DEFAULT_HR_TILE_LAYOUT = HR_DASHBOARD_TILES.map((tile) => tile.id);

export const SOFTWARE_ASSETS_DASHBOARD_TILES: DashboardTileDefinition[] = [
  { id: "total-products", label: "Total software products", value: "0", hint: "Register size" },
  { id: "monthly-spend", label: "Monthly software spend", value: "£0", hint: "Active + trial" },
  { id: "annual-spend", label: "Annual software spend", value: "£0", hint: "Active + trial" },
  { id: "licences-purchased", label: "Licences purchased", value: "0", hint: "Total seats" },
  { id: "licences-in-use", label: "Licences in use", value: "0", hint: "Allocated" },
  { id: "renewals-30", label: "Renewals due (30 days)", value: "0", hint: "Upcoming" },
];

export function buildSoftwareAssetsDashboardCatalog(
  summary: {
    totalProducts: number;
    monthlySpend: number;
    annualSpend: number;
    licencesPurchased: number;
    licencesInUse: number;
    renewalsDueIn30Days: number;
    currency: string;
  },
  formatMoney: (amount: number, currency: string) => string,
): DashboardTileDefinition[] {
  return SOFTWARE_ASSETS_DASHBOARD_TILES.map((tile) => {
    switch (tile.id) {
      case "total-products":
        return { ...tile, value: String(summary.totalProducts) };
      case "monthly-spend":
        return { ...tile, value: formatMoney(summary.monthlySpend, summary.currency) };
      case "annual-spend":
        return { ...tile, value: formatMoney(summary.annualSpend, summary.currency) };
      case "licences-purchased":
        return { ...tile, value: String(summary.licencesPurchased) };
      case "licences-in-use":
        return { ...tile, value: String(summary.licencesInUse) };
      case "renewals-30":
        return { ...tile, value: String(summary.renewalsDueIn30Days) };
      default:
        return tile;
    }
  });
}

export const DEFAULT_SOFTWARE_ASSETS_TILE_LAYOUT = SOFTWARE_ASSETS_DASHBOARD_TILES.map(
  (tile) => tile.id,
);

