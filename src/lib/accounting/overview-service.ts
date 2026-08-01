import { listFinancialActivity } from "@/lib/accounting/activity";
import {
  getMonthlySeriesFromPostedLines,
  getPostedExpenseLines,
  getTypeTotals,
} from "@/lib/accounting/balances";
import { buildBurnRateSnapshot } from "@/lib/accounting/burn-rate";
import { getOperatingObligations } from "@/lib/accounting/operating-obligations";
import { listInvoices } from "@/lib/accounting/invoices-service";
import type { FinancialOverviewSnapshot } from "@/lib/accounting/types";
import {
  CORPCENTRE_CASH_BALANCE_AUD,
  isCorpCentreWorkspaceSlug,
} from "@/lib/corpcentre-financials";
import {
  ABHI_CASH_BALANCE_GBP,
  ABHI_REVENUE_YTD_GBP,
  isAbhiWorkspaceSlug,
} from "@/lib/abhi-financials";
import { listExpenses } from "@/lib/financial-expenses-service";
import {
  resolveFinancialsWorkspaceId,
  type FinancialsWorkspaceScope,
} from "@/lib/financials-workspace";
import { calculateLivePayrollSnapshot } from "@/lib/payroll/payroll-service";
import { isSupabaseConfigured, createSupabaseServerClient } from "@/lib/supabase/server";
import { convertToGbp } from "@/lib/treasury/treasury-utils";
import { getWiseConnectionStatus, listWiseBalances } from "@/lib/wise-service";

/** Platform reporting currency — matches Wise Bank treasury totals (Internal default). */
export const FINANCIAL_REPORTING_CURRENCY = "GBP";

const FX_TO_AUD: Record<string, number> = {
  AUD: 1,
  GBP: 1.95,
  USD: 1.52,
  EUR: 1.65,
};

async function resolveReportingCurrency(workspaceId: string): Promise<string> {
  try {
    const { createSupabaseServiceRoleClient, isSupabaseServiceRoleConfigured } =
      await import("@/lib/supabase/server");
    const supabase = isSupabaseServiceRoleConfigured()
      ? createSupabaseServiceRoleClient()
      : createSupabaseServerClient();

    const [{ data: settings }, { data: workspace }] = await Promise.all([
      supabase
        .from("workspace_settings")
        .select("currency")
        .eq("workspace_id", workspaceId)
        .maybeSingle(),
      supabase.from("workspaces").select("slug").eq("id", workspaceId).maybeSingle(),
    ]);

    const slug = String(workspace?.slug ?? "")
      .trim()
      .toLowerCase();
    if (isCorpCentreWorkspaceSlug(slug)) {
      return "AUD";
    }

    const currency = String(settings?.currency ?? "")
      .trim()
      .toUpperCase();
    if (currency === "AUD" || currency === "GBP" || currency === "USD" || currency === "EUR") {
      return currency;
    }
  } catch {
    /* fall through */
  }
  return FINANCIAL_REPORTING_CURRENCY;
}

async function resolveWorkspaceSlug(workspaceId: string): Promise<string> {
  try {
    const { createSupabaseServiceRoleClient, isSupabaseServiceRoleConfigured } =
      await import("@/lib/supabase/server");
    const supabase = isSupabaseServiceRoleConfigured()
      ? createSupabaseServiceRoleClient()
      : createSupabaseServerClient();
    const { data } = await supabase
      .from("workspaces")
      .select("slug")
      .eq("id", workspaceId)
      .maybeSingle();
    return String(data?.slug ?? "")
      .trim()
      .toLowerCase();
  } catch {
    return "";
  }
}

function convertToReportingCurrency(amount: number, fromCurrency: string, reporting: string) {
  const from = fromCurrency.toUpperCase();
  const to = reporting.toUpperCase();
  if (from === to) return roundMoney(amount);
  if (to === "GBP") return convertToGbp(amount, from);
  if (to === "AUD") {
    const rate = FX_TO_AUD[from] ?? 1;
    return roundMoney(amount * rate);
  }
  // Other reporting currencies: convert via GBP pivot.
  const gbp = convertToGbp(amount, from);
  if (to === "USD") return roundMoney(gbp / 0.79);
  if (to === "EUR") return roundMoney(gbp / 0.86);
  return roundMoney(amount);
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function emptyBurnRate(cashBalance = 0): FinancialOverviewSnapshot["burnRate"] {
  return {
    source: "live",
    currency: FINANCIAL_REPORTING_CURRENCY,
    monthly: 0,
    quarterly: 0,
    annual: 0,
    previousMonthly: 0,
    changePct: 0,
    trend: "stable",
    trendLabel: "No change",
    cashBalance,
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
  };
}

/**
 * Live Wise treasury total in GBP — same calculation as Finance → Bank
 * (`computeTreasurySummary.totalTreasuryValueGbp`). Falls back to GL Wise
 * cash accounts when Wise is unavailable.
 * Demo always uses Meridian simulated balances (never live Wise / empty GL).
 */
export async function resolveTreasuryCash(glWiseCash = 0): Promise<number> {
  try {
    // Customer fixtures must never fall through to platform Wise leftovers (~£1.58).
    try {
      const { getCurrentWorkspace } = await import("@/lib/workspace-context");
      const workspace = await getCurrentWorkspace();
      const slug = String(workspace?.slug ?? "")
        .trim()
        .toLowerCase();
      if (isAbhiWorkspaceSlug(slug)) return ABHI_CASH_BALANCE_GBP;
      if (isCorpCentreWorkspaceSlug(slug)) return CORPCENTRE_CASH_BALANCE_AUD;
    } catch {
      /* fall through */
    }

    const { shouldUseDemoWiseSimulator } = await import("@/lib/treasury/bank-provider-server");
    if (await shouldUseDemoWiseSimulator()) {
      const { getDemoTreasuryCashGbp } = await import(
        "@/lib/treasury/providers/demo-wise-simulator"
      );
      return getDemoTreasuryCashGbp();
    }

    const cashPromise = (async () => {
      const status = await getWiseConnectionStatus();
      if (!status.configured || !status.connected) {
        return roundMoney(glWiseCash);
      }
      const balances = await listWiseBalances(status.profileId ?? undefined);
      if (balances.length === 0) return roundMoney(glWiseCash);
      return roundMoney(
        balances.reduce(
          (sum, balance) => sum + convertToGbp(Number(balance.amount) || 0, balance.currency),
          0,
        ),
      );
    })();

    const timeoutMs = 8_000;
    return await Promise.race([
      cashPromise,
      new Promise<number>((resolve) => {
        setTimeout(() => resolve(roundMoney(glWiseCash)), timeoutMs);
      }),
    ]);
  } catch {
    return roundMoney(glWiseCash);
  }
}

function emptyOverview(cashPosition = 0): FinancialOverviewSnapshot {
  return {
    revenueYtd: 0,
    cashPosition,
    accountsReceivable: 0,
    accountsPayable: 0,
    netProfit: 0,
    outstandingInvoices: 0,
    monthlyRevenue: 0,
    monthlyExpenses: 0,
    annualRevenue: 0,
    annualExpenses: 0,
    burnRate: emptyBurnRate(cashPosition),
    ar: {
      outstanding: 0,
      overdue: 0,
      dueSoon: 0,
      collectionRate: 0,
      ageing: [
        { bucket: "Current", amount: 0 },
        { bucket: "1–30", amount: 0 },
        { bucket: "31–60", amount: 0 },
        { bucket: "61–90", amount: 0 },
        { bucket: "90+", amount: 0 },
      ],
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
      cashPosition: [],
    },
    activity: [],
  };
}

/**
 * Single financial source of truth for Home, Financial Overview, GL KPIs,
 * AR, AP, and Wise cash. Always returns numeric values (never null / —).
 */
export async function getFinancialOverview(
  scope?: FinancialsWorkspaceScope,
): Promise<FinancialOverviewSnapshot> {
  if (!isSupabaseConfigured()) {
    // Wise cash still loads without Supabase — same as Finance → Bank.
    return emptyOverview(await resolveTreasuryCash(0));
  }

  try {
    const workspaceId = await resolveFinancialsWorkspaceId(scope);
    const workspaceScope: FinancialsWorkspaceScope = { workspaceId };
    const reportingCurrency = await resolveReportingCurrency(workspaceId);

    const [
      totalsResult,
      chartsResult,
      invoicesResult,
      activityResult,
      postedExpensesResult,
      expensesResult,
      obligationsResult,
      payrollLiveResult,
    ] = await Promise.all([
      getTypeTotals(workspaceScope).then(
        (value) => ({ ok: true as const, value }),
        () => ({ ok: false as const }),
      ),
      getMonthlySeriesFromPostedLines(workspaceScope).then(
        (value) => ({ ok: true as const, value }),
        () => ({ ok: false as const }),
      ),
      listInvoices(workspaceScope).then(
        (value) => ({ ok: true as const, value }),
        () => ({ ok: false as const }),
      ),
      listFinancialActivity(25, workspaceScope).then(
        (value) => ({ ok: true as const, value }),
        () => ({ ok: false as const }),
      ),
      getPostedExpenseLines(workspaceScope).then(
        (value) => ({ ok: true as const, value }),
        () => ({ ok: false as const }),
      ),
      // Same service as Accounts Payable (`/api/financials/expenses`).
      listExpenses({ workspaceId }).then(
        (value) => ({ ok: true as const, value }),
        () => ({ ok: false as const }),
      ),
      getOperatingObligations(workspaceScope).then(
        (value) => ({ ok: true as const, value }),
        () => ({ ok: false as const }),
      ),
      calculateLivePayrollSnapshot({ workspaceId }).then(
        (value) => ({ ok: true as const, value }),
        () => ({ ok: false as const }),
      ),
    ]);

    const totals = totalsResult.ok
      ? totalsResult.value
      : {
          income: 0,
          expenses: 0,
          assets: 0,
          liabilities: 0,
          equity: 0,
          netProfit: 0,
          cashPosition: 0,
          accountsReceivable: 0,
          accountsPayable: 0,
        };
    const charts = chartsResult.ok
      ? chartsResult.value
      : {
          monthlyRevenue: [],
          monthlyProfitLoss: [],
          monthlyOutgoings: [],
          cashPosition: [],
        };
    const invoices = invoicesResult.ok ? invoicesResult.value : [];
    const activity = activityResult.ok ? activityResult.value : [];
    const postedExpenses = postedExpensesResult.ok ? postedExpensesResult.value : [];
    const allExpenses = expensesResult.ok ? expensesResult.value : [];

    // Resolve after GL so we can fall back to Wise GL accounts if Wise API is down.
    // CorpCentre / ABHI use fixed cash fixtures (not platform Wise).
    const workspaceSlug = await resolveWorkspaceSlug(workspaceId);
    let cashPosition: number;
    if (isCorpCentreWorkspaceSlug(workspaceSlug)) {
      cashPosition = CORPCENTRE_CASH_BALANCE_AUD;
    } else if (isAbhiWorkspaceSlug(workspaceSlug)) {
      cashPosition = ABHI_CASH_BALANCE_GBP;
    } else {
      cashPosition = await resolveTreasuryCash(totals.cashPosition);
      if (reportingCurrency !== "GBP") {
        cashPosition = convertToReportingCurrency(cashPosition, "GBP", reportingCurrency);
      }
    }

    if (
      !totalsResult.ok &&
      !chartsResult.ok &&
      !invoicesResult.ok &&
      !expensesResult.ok
    ) {
      return emptyOverview(cashPosition);
    }

    const today = new Date();
    const todayIso = today.toISOString().slice(0, 10);
    const monthPrefix = todayIso.slice(0, 7);
    const unpaid = invoices.filter(
      (invoice) => invoice.status === "issued" || invoice.status === "overdue",
    );
    const overdue = unpaid.filter((invoice) => invoice.dueDate < todayIso);
    const dueSoon = unpaid.filter((invoice) => {
      const due = new Date(`${invoice.dueDate}T00:00:00.000Z`);
      const diff = (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 14;
    });
    const paidCount = invoices.filter((invoice) => invoice.status === "paid").length;
    const collectionRate =
      invoices.length === 0 ? 0 : roundMoney((paidCount / invoices.length) * 100);

    const ageing = [
      { bucket: "Current", amount: 0 },
      { bucket: "1–30", amount: 0 },
      { bucket: "31–60", amount: 0 },
      { bucket: "61–90", amount: 0 },
      { bucket: "90+", amount: 0 },
    ];
    for (const invoice of unpaid) {
      const due = new Date(`${invoice.dueDate}T00:00:00.000Z`);
      const days = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
      const amountGbp = convertToReportingCurrency(
        invoice.amount,
        invoice.currency,
        reportingCurrency,
      );
      if (days <= 0) ageing[0].amount = roundMoney(ageing[0].amount + amountGbp);
      else if (days <= 30) ageing[1].amount = roundMoney(ageing[1].amount + amountGbp);
      else if (days <= 60) ageing[2].amount = roundMoney(ageing[2].amount + amountGbp);
      else if (days <= 90) ageing[3].amount = roundMoney(ageing[3].amount + amountGbp);
      else ageing[4].amount = roundMoney(ageing[4].amount + amountGbp);
    }

    const unpaidExpenses = allExpenses.filter((expense) => !expense.paid);
    const monthEnd = `${monthPrefix}-31`;
    const apDueThisMonth = unpaidExpenses.filter((expense) => {
      const date = String(expense.expenseDate ?? expense.dateSubmitted ?? "");
      return date >= `${monthPrefix}-01` && date <= monthEnd;
    });
    const apOverdue = unpaidExpenses.filter((expense) => {
      const date = String(expense.expenseDate ?? expense.dateSubmitted ?? "");
      return date < todayIso;
    });

    const yearPrefix = todayIso.slice(0, 4);
    const monthlyExpensePoint = charts.monthlyOutgoings.find((point) => point.month === monthPrefix);
    const monthlyRevenuePoint = charts.monthlyRevenue.find((point) => point.month === monthPrefix);
    let annualRevenue = roundMoney(
      charts.monthlyRevenue
        .filter((point) => point.month.startsWith(yearPrefix))
        .reduce((sum, point) => sum + point.amount, 0),
    );
    // CorpCentre fixtures are seeded for a prior calendar year; when the current
    // year has no posted income yet, surface all-time / latest seeded revenue.
    if (isCorpCentreWorkspaceSlug(workspaceSlug) && annualRevenue <= 0) {
      const seededYearRevenue = roundMoney(
        charts.monthlyRevenue
          .filter((point) => point.month.startsWith("2025"))
          .reduce((sum, point) => sum + point.amount, 0),
      );
      annualRevenue =
        seededYearRevenue > 0 ? seededYearRevenue : roundMoney(totals.income);
    }
    if (isAbhiWorkspaceSlug(workspaceSlug)) {
      annualRevenue = ABHI_REVENUE_YTD_GBP;
    }
    const annualExpenses = roundMoney(
      charts.monthlyOutgoings
        .filter((point) => point.month.startsWith(yearPrefix))
        .reduce((sum, point) => sum + point.amount, 0),
    );
    const monthlyRevenue = roundMoney(monthlyRevenuePoint?.amount ?? 0);

    const burnRate =
      postedExpenses.length > 0 || charts.monthlyOutgoings.some((point) => point.amount > 0)
        ? buildBurnRateSnapshot({
            cashBalance: cashPosition,
            monthlyOutgoings: charts.monthlyOutgoings,
            postedExpenses,
            currency: reportingCurrency,
            allowDemo: false,
          })
        : emptyBurnRate(cashPosition);

    const obligations = obligationsResult.ok
      ? obligationsResult.value
      : {
          payroll: {
            monthly: 0,
            annual: 0,
            employees: 0,
            nextPayrollDate: todayIso,
            liability: 0,
            currency: reportingCurrency,
          },
          software: {
            monthly: 0,
            annual: 0,
            count: 0,
            currency: reportingCurrency,
            lines: [],
            upcoming: [],
          },
          monthlyRecurring: 0,
        };

    const payrollLive = payrollLiveResult.ok ? payrollLiveResult.value : null;
    const toReporting = (amount: number, currency: string) =>
      convertToReportingCurrency(amount, currency, reportingCurrency);

    const glRevenue = totals.income;
    const glSpend = totals.expenses;
    const netProfit = roundMoney(glRevenue - glSpend);
    // Calendar YTD from monthly series when available; else all-time income balance.
    const revenueYtd = isAbhiWorkspaceSlug(workspaceSlug)
      ? ABHI_REVENUE_YTD_GBP
      : annualRevenue > 0
        ? annualRevenue
        : roundMoney(glRevenue);

    const payrollPoint =
      burnRate.series.find((point) => point.month === monthPrefix) ??
      burnRate.series[burnRate.series.length - 1];
    const glPayrollMonthly = payrollPoint?.payroll ?? 0;
    const glSoftwareMonthly = payrollPoint?.software ?? 0;

    // Payroll engine (HR salaries + tax settings) is the SSOT when employees exist.
    const payrollMonthly =
      payrollLive && payrollLive.employeeCount > 0
        ? toReporting(payrollLive.monthlyGross, payrollLive.currency)
        : obligations.payroll.employees > 0
          ? toReporting(obligations.payroll.monthly, obligations.payroll.currency)
          : glPayrollMonthly;
    const payrollLiability =
      payrollLive && payrollLive.employeeCount > 0
        ? toReporting(
            payrollLive.net + payrollLive.employeeTax + payrollLive.employerTax,
            payrollLive.currency,
          )
        : obligations.payroll.employees > 0
          ? toReporting(obligations.payroll.liability, obligations.payroll.currency)
          : 0;
    const payrollEmployees =
      payrollLive?.employeeCount || obligations.payroll.employees || 0;
    const payrollNextDate =
      payrollLive?.nextPayrollDate || obligations.payroll.nextPayrollDate || todayIso;
    const softwareMonthly =
      obligations.software.count > 0 ? obligations.software.monthly : glSoftwareMonthly;

    const { shouldUseDemoWiseSimulator } = await import("@/lib/treasury/bank-provider-server");
    const isDemoTreasury = await shouldUseDemoWiseSimulator();

    const vendorExpenseByMonth = (() => {
      const byMonth = new Map<string, number>();
      for (const expense of allExpenses) {
        const key = String(expense.expenseDate ?? expense.dateSubmitted ?? "").slice(0, 7);
        if (!/^\d{4}-\d{2}$/.test(key)) continue;
        byMonth.set(key, (byMonth.get(key) ?? 0) + (Number(expense.amount) || 0));
      }
      return byMonth;
    })();

    const vendorExpenseRunRate = (() => {
      const keys = [...vendorExpenseByMonth.keys()].sort();
      if (keys.length === 0) return 0;
      const recent = keys.slice(-3).map((key) => vendorExpenseByMonth.get(key) ?? 0);
      return recent.reduce((sum, value) => sum + value, 0) / recent.length;
    })();

    // Demo: never add padded GL opex journals on top of live payroll (was ~£1m+/mo nonsense).
    // Burn = payroll employment cost + software register + vendor expense run-rate.
    const payrollBurn =
      payrollLive && payrollLive.employeeCount > 0
        ? toReporting(
            payrollLive.monthlyGross + payrollLive.employerTax,
            payrollLive.currency,
          )
        : payrollMonthly;

    const glBurnBase =
      burnRate.lines.length > 0 ? burnRate.monthly : (monthlyExpensePoint?.amount ?? 0);
    // ABHI: burn is staff payroll employment cost only for now (ignore one-shot GL accruals).
    const monthlyBurn = isAbhiWorkspaceSlug(workspaceSlug)
      ? roundMoney(payrollBurn)
      : isDemoTreasury
        ? roundMoney(payrollBurn + softwareMonthly + vendorExpenseRunRate)
        : roundMoney(
            Math.max(0, glBurnBase - glPayrollMonthly - glSoftwareMonthly) +
              payrollMonthly +
              softwareMonthly,
          );

    const priorMonthPrefix = (() => {
      const [year, month] = monthPrefix.split("-").map(Number);
      const date = new Date(Date.UTC(year, month - 2, 1));
      return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    })();
    const priorVendor =
      vendorExpenseByMonth.get(priorMonthPrefix) ?? vendorExpenseRunRate;
    const previousMonthlyBurn = isAbhiWorkspaceSlug(workspaceSlug)
      ? roundMoney(payrollBurn)
      : isDemoTreasury
        ? roundMoney(payrollBurn + softwareMonthly + priorVendor)
        : roundMoney(
            burnRate.previousMonthly > 0
              ? burnRate.previousMonthly
              : (charts.monthlyOutgoings.find((point) => point.month === priorMonthPrefix)?.amount ??
                monthlyBurn),
          );
    const burnChangePct =
      previousMonthlyBurn <= 0
        ? 0
        : Math.round(((monthlyBurn - previousMonthlyBurn) / previousMonthlyBurn) * 1000) / 10;
    const burnTrend: FinancialOverviewSnapshot["burnRate"]["trend"] =
      burnChangePct <= -2 ? "improving" : burnChangePct >= 2 ? "increasing" : "stable";

    const forecastMonthly = isAbhiWorkspaceSlug(workspaceSlug)
      ? monthlyBurn
      : isDemoTreasury
        ? monthlyBurn
        : roundMoney(
            burnRate.lines.length > 0
              ? Math.max(0, burnRate.forecastMonthly - glPayrollMonthly - glSoftwareMonthly) +
                  payrollMonthly +
                  softwareMonthly
              : monthlyBurn,
          );

    const payrollTrend =
      burnRate.series.length > 0
        ? burnRate.series.slice(-6).map((point) => ({
            month: point.month,
            amount: payrollEmployees > 0 ? payrollMonthly : point.payroll,
          }))
        : [
            {
              month: monthPrefix,
              amount: payrollMonthly,
            },
          ];

    // Debtors / Creditors from the same AR / AP modules (invoices + expenses).
    const arOutstanding = roundMoney(
      unpaid.reduce(
        (sum, invoice) =>
          sum + convertToReportingCurrency(invoice.amount, invoice.currency, reportingCurrency),
        0,
      ),
    );
    const softwareApUpcoming = roundMoney(
      obligations.software.upcoming.reduce((sum, line) => sum + line.monthlyCost, 0),
    );
    const apOutstanding = roundMoney(
      unpaidExpenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0) +
        softwareApUpcoming +
        // Demo: next payroll is an obligation, not already-booked AP outstanding.
        (isDemoTreasury ? 0 : payrollEmployees > 0 ? payrollLiability : 0),
    );

    const softwareApRecent = obligations.software.upcoming.slice(0, 6).map((line) => ({
      id: `software-${line.id}`,
      supplier: line.vendor,
      description: `${line.name} licence (${line.frequency})`,
      amount: line.monthlyCost,
      currency: line.currency,
      dueDate: line.nextPaymentDate,
      paid: false,
    }));

    const payrollApRecent =
      payrollEmployees > 0
        ? [
            {
              id: "payroll-next",
              supplier: "Payroll",
              description: `Monthly payroll · ${payrollEmployees} employees`,
              amount: payrollLiability,
              currency: reportingCurrency,
              dueDate: payrollNextDate,
              paid: false,
            },
            ...(payrollLive && payrollLive.employerTax > 0
              ? [
                  {
                    id: "payroll-employer-tax",
                    supplier: "Employer payroll tax",
                    description: "Estimated employer payroll tax",
                    amount: toReporting(payrollLive.employerTax, payrollLive.currency),
                    currency: reportingCurrency,
                    dueDate: payrollNextDate,
                    paid: false,
                  },
                ]
              : []),
          ]
        : [];

    return {
      revenueYtd,
      cashPosition,
      accountsReceivable: arOutstanding,
      accountsPayable: apOutstanding,
      netProfit,
      outstandingInvoices: unpaid.length,
      monthlyRevenue,
      monthlyExpenses: roundMoney(glSpend + softwareMonthly + Math.max(0, payrollMonthly - glPayrollMonthly)),
      annualRevenue,
      annualExpenses: roundMoney(annualExpenses + softwareMonthly * 12),
      burnRate: {
        ...burnRate,
        monthly: roundMoney(monthlyBurn),
        quarterly: roundMoney(monthlyBurn * 3),
        annual: roundMoney(monthlyBurn * 12),
        previousMonthly: roundMoney(previousMonthlyBurn),
        changePct: burnChangePct,
        trend: burnTrend,
        forecastMonthly: roundMoney(forecastMonthly),
        cashBalance: cashPosition,
        currency: reportingCurrency,
        trendLabel: isAbhiWorkspaceSlug(workspaceSlug)
          ? "Staff payroll"
          : isDemoTreasury
            ? "Payroll + software + vendor opex"
            : burnRate.lines.length > 0
              ? burnRate.trendLabel
              : "Operating registers",
        runwayMonths:
          cashPosition > 0 && monthlyBurn > 0
            ? Math.round((cashPosition / monthlyBurn) * 10) / 10
            : burnRate.runwayMonths,
      },
      ar: {
        outstanding: arOutstanding,
        overdue: roundMoney(
          overdue.reduce(
            (sum, invoice) =>
              sum + convertToReportingCurrency(invoice.amount, invoice.currency, reportingCurrency),
            0,
          ),
        ),
        dueSoon: roundMoney(
          dueSoon.reduce(
            (sum, invoice) =>
              sum + convertToReportingCurrency(invoice.amount, invoice.currency, reportingCurrency),
            0,
          ),
        ),
        collectionRate,
        ageing,
        recentUnpaid: unpaid.slice(0, 8),
      },
      ap: {
        outstanding: apOutstanding,
        dueThisMonth: roundMoney(
          apDueThisMonth.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0) +
            softwareApUpcoming +
            (isDemoTreasury ? 0 : payrollEmployees > 0 ? payrollLiability : 0),
        ),
        overdue: roundMoney(
          apOverdue.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0),
        ),
        upcoming: roundMoney(
          unpaidExpenses
            .filter(
              (expense) =>
                String(expense.expenseDate ?? expense.dateSubmitted) >= todayIso,
            )
            .reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0) +
            softwareApUpcoming +
            (isDemoTreasury ? 0 : payrollEmployees > 0 ? payrollLiability : 0),
        ),
        recent: [...payrollApRecent, ...softwareApRecent, ...unpaidExpenses.slice(0, 8).map((expense) => ({
          id: String(expense.id),
          supplier: String(expense.supplier ?? expense.submitterName ?? "Supplier"),
          description: String(expense.purposeDescription ?? ""),
          amount: Number(expense.amount) || 0,
          currency: String(expense.currency ?? FINANCIAL_REPORTING_CURRENCY),
          dueDate: String(expense.expenseDate ?? expense.dateSubmitted),
          paid: Boolean(expense.paid),
        }))].slice(0, 12),
      },
      payroll: {
        current: payrollMonthly,
        next: payrollMonthly,
        employees: payrollEmployees,
        annual: roundMoney(payrollMonthly * 12),
        monthly: payrollMonthly,
        trend: payrollTrend,
      },
      charts: {
        ...charts,
        // Demo treasury is Wise SSOT at £1.58m — never show GL cash (often deeply negative)
        // then patch only the final month (that produced the fake “+£3.55m vs prior month”).
        cashPosition: isDemoTreasury
          ? (charts.cashPosition.length > 0 ? charts.cashPosition : [{ month: monthPrefix, amount: cashPosition }]).map(
              (point, index, arr) => {
                const t = arr.length <= 1 ? 1 : index / (arr.length - 1);
                return {
                  ...point,
                  amount: roundMoney(cashPosition * (0.9 + 0.1 * t)),
                };
              },
            )
          : charts.cashPosition.length > 0
            ? charts.cashPosition.map((point, index) =>
                index === charts.cashPosition.length - 1
                  ? { ...point, amount: cashPosition }
                  : point,
              )
            : [{ month: monthPrefix, amount: cashPosition }],
      },
      activity,
    };
  } catch {
    // Even when the ledger path blows up, surface live Wise treasury cash.
    return emptyOverview(await resolveTreasuryCash(0));
  }
}
