/**
 * Scoped business PDF — only requested live metrics, never invented figures.
 */

import { jsPDF } from "jspdf";

import { getFinancialOverview } from "@/lib/accounting/overview-service";
import { getTypeTotals } from "@/lib/accounting/balances";
import type { FinancialOverviewSnapshot } from "@/lib/accounting/types";
import {
  createArtifactId,
  putAssistantArtifact,
  type AssistantStoredArtifact,
} from "@/lib/ai-operating-assistant/artifact-store";
import {
  drawAssistantPdfFooter,
  drawAssistantPdfHeader,
  resolveAssistantPdfBrand,
} from "@/lib/ai-operating-assistant/pdf-brand";
import {
  formatReportPeriodLabel,
  lastNMonthKeys,
  quarterMonthKeys,
  type ReportPeriod,
} from "@/lib/ai-operating-assistant/report-period";
import {
  metricLabel,
  type ScopedPdfMetricId,
} from "@/lib/ai-operating-assistant/scoped-pdf-metrics";
import { isOverdue } from "@/lib/ai-operating-assistant/tool-result";
import { listLeads } from "@/lib/crm-leads-service";
import { listLeaveRequests, listVacancies } from "@/lib/hr-mock-store";
import { listHrEmployees } from "@/lib/hr-employees-service";
import { listInternalClients } from "@/lib/internal-clients-service";
import { listProjects } from "@/lib/internal-projects-service";
import { calculateLivePayrollSnapshot } from "@/lib/payroll/payroll-service";
import { FUNDS_PLATFORM_OVERVIEW, formatFundUsd } from "@/lib/talanton/funds-data";
import { buildPortfolioExecutiveBriefing } from "@/lib/talanton/portfolio-intelligence";
import { buildPortfolioImpactBriefing } from "@/lib/talanton/impact-intelligence";

export type ScopedPdfRow = { label: string; value: string };

export type ScopedPdfSection = {
  metricId: ScopedPdfMetricId;
  heading: string;
  rows: ScopedPdfRow[];
  note?: string;
};

export type ScopedPdfLiveBundle = {
  sections: ScopedPdfSection[];
  unknownTopics: string[];
  periodLabel: string;
  sources: string[];
  blocked: string[];
};

function money(value: number, currency = "GBP") {
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value || 0);
  } catch {
    return `£${(value || 0).toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;
  }
}

function monthLabel(isoMonth: string) {
  const [year, month] = isoMonth.split("-").map(Number);
  if (!year || !month) return isoMonth;
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function pnlForPeriod(
  overview: FinancialOverviewSnapshot,
  period: ReportPeriod,
): { rows: ScopedPdfRow[]; note?: string } {
  if (period.kind === "ytd") {
    const revenue = overview.annualRevenue || overview.revenueYtd;
    const expenses = overview.annualExpenses || overview.monthlyExpenses;
    const profit = overview.netProfit;
    return {
      rows: [
        { label: "Revenue (YTD)", value: money(revenue) },
        { label: "Expenses (YTD)", value: money(expenses) },
        { label: "Net profit / (loss)", value: money(profit) },
      ],
    };
  }

  if (period.kind === "last_n_months") {
    const keys = lastNMonthKeys(period.n);
    let revenue = 0;
    let expenses = 0;
    let monthsWithData = 0;
    const monthRows: ScopedPdfRow[] = [];
    for (const key of keys) {
      const rev = overview.charts.monthlyRevenue.find((r) => r.month === key)?.amount ?? 0;
      const out = overview.charts.monthlyOutgoings.find((r) => r.month === key)?.amount ?? 0;
      const pl = overview.charts.monthlyProfitLoss.find((r) => r.month === key);
      const net = pl ? pl.profit - pl.loss : rev - out;
      if (rev !== 0 || out !== 0 || (pl && (pl.profit !== 0 || pl.loss !== 0))) {
        monthsWithData += 1;
      }
      revenue += rev;
      expenses += out;
      monthRows.push({
        label: monthLabel(key),
        value: money(net),
      });
    }
    const note =
      monthsWithData < keys.length
        ? `Live series covered ${monthsWithData} of ${keys.length} requested months (zeros = no posted activity).`
        : undefined;
    return {
      rows: [
        { label: "Revenue (sum)", value: money(revenue) },
        { label: "Expenses (sum)", value: money(expenses) },
        { label: "Net profit / (loss)", value: money(revenue - expenses) },
        ...monthRows.map((r) => ({ label: `  ${r.label} net`, value: r.value })),
      ],
      note,
    };
  }

  if (period.kind === "quarter") {
    const keys = quarterMonthKeys({ year: period.year, quarter: period.quarter });
    let revenue = 0;
    let expenses = 0;
    let netTotal = 0;
    const monthRows: ScopedPdfRow[] = [];
    for (const key of keys) {
      const rev = overview.charts.monthlyRevenue.find((r) => r.month === key)?.amount ?? 0;
      const out = overview.charts.monthlyOutgoings.find((r) => r.month === key)?.amount ?? 0;
      const pl = overview.charts.monthlyProfitLoss.find((r) => r.month === key);
      const net = pl ? pl.profit - pl.loss : rev - out;
      revenue += rev;
      expenses += out;
      netTotal += net;
      monthRows.push({ label: monthLabel(key), value: money(net) });
    }
    return {
      rows: [
        { label: "Revenue (quarter sum)", value: money(revenue) },
        { label: "Expenses (quarter sum)", value: money(expenses) },
        { label: "Net profit / (loss)", value: money(netTotal) },
        ...monthRows.map((r) => ({ label: `  ${r.label} net`, value: r.value })),
      ],
    };
  }

  if (period.kind !== "month") {
    return {
      rows: [{ label: "Status", value: "Unsupported period for P&L snapshot" }],
    };
  }

  const key = period.key;
  const monthlyPl = overview.charts.monthlyProfitLoss.find((row) => row.month === key);
  const monthlyRevenuePoint = overview.charts.monthlyRevenue.find((row) => row.month === key);
  const monthlyOutPoint = overview.charts.monthlyOutgoings.find((row) => row.month === key);
  const revenue = monthlyRevenuePoint?.amount ?? overview.monthlyRevenue;
  const expenses = monthlyOutPoint?.amount ?? overview.monthlyExpenses;
  const profit = monthlyPl
    ? monthlyPl.profit - monthlyPl.loss
    : revenue - expenses;
  return {
    rows: [
      { label: `Revenue (${monthLabel(key)})`, value: money(revenue) },
      { label: `Expenses (${monthLabel(key)})`, value: money(expenses) },
      { label: "Net profit / (loss)", value: money(profit) },
    ],
  };
}

export async function loadScopedPdfBundle(input: {
  metrics: ScopedPdfMetricId[];
  period: ReportPeriod;
  unknownTopics: string[];
  canAccessFinancials: boolean;
  canAccessHr: boolean;
}): Promise<ScopedPdfLiveBundle> {
  const sources = new Set<string>();
  const blocked: string[] = [];
  const sections: ScopedPdfSection[] = [];

  const financeIds: ScopedPdfMetricId[] = [
    "pnl",
    "balance_sheet",
    "burn_rate",
    "runway",
    "cash",
    "ar_overdue",
    "ar_outstanding",
    "ap_outstanding",
    "revenue_ytd",
    "net_profit",
    "outstanding_invoices",
    "payroll_total",
  ];
  const needsFinance = input.metrics.some((m) => financeIds.includes(m));
  const needsPayroll = input.metrics.includes("payroll_total");
  const needsCrm = input.metrics.some((m) =>
    ["crm_pipeline_value", "hot_leads", "open_leads"].includes(m),
  );
  const needsClients = input.metrics.includes("active_clients");
  const needsHr = input.metrics.some((m) =>
    ["headcount", "open_vacancies", "pending_leave"].includes(m),
  );
  const needsProjects = input.metrics.some((m) =>
    ["open_projects", "total_projects", "overdue_projects"].includes(m),
  );

  const [overview, payrollSnap, leads, clients, employees, projects] = await Promise.all([
    needsFinance && input.canAccessFinancials
      ? getFinancialOverview().catch(() => null)
      : Promise.resolve(null),
    needsPayroll && (input.canAccessHr || input.canAccessFinancials)
      ? calculateLivePayrollSnapshot().catch(() => null)
      : Promise.resolve(null),
    needsCrm ? listLeads("All").catch(() => []) : Promise.resolve([]),
    needsClients ? listInternalClients().catch(() => []) : Promise.resolve([]),
    needsHr && input.canAccessHr && input.metrics.includes("headcount")
      ? listHrEmployees().catch(() => [])
      : Promise.resolve([]),
    needsProjects ? listProjects().catch(() => []) : Promise.resolve([]),
  ]);

  const vacancies =
    needsHr && input.canAccessHr && input.metrics.includes("open_vacancies")
      ? listVacancies()
      : [];
  const leaveRequests =
    needsHr && input.canAccessHr && input.metrics.includes("pending_leave")
      ? listLeaveRequests()
      : [];

  if (overview) sources.add("supabase:financials");
  if (payrollSnap) sources.add("payroll:live");
  if (needsCrm) sources.add("supabase:crm_leads");
  if (needsClients) sources.add("supabase:clients");
  if (employees.length || vacancies.length || leaveRequests.length) {
    sources.add("hr:live");
  }
  if (needsProjects) sources.add("supabase:projects");

  const denyFinance = (metricId: ScopedPdfMetricId, heading: string) => {
    blocked.push(heading);
    sections.push({
      metricId,
      heading,
      rows: [{ label: "Status", value: "Permission denied" }],
      note: "Your role cannot access financials.",
    });
  };
  const denyHr = (metricId: ScopedPdfMetricId, heading: string) => {
    blocked.push(heading);
    sections.push({
      metricId,
      heading,
      rows: [{ label: "Status", value: "Permission denied" }],
      note: "Your role cannot access HR.",
    });
  };

  for (const metricId of input.metrics) {
    const heading = metricLabel(metricId);

    if (financeIds.includes(metricId) && metricId !== "payroll_total" && !input.canAccessFinancials) {
      denyFinance(metricId, heading);
      continue;
    }
    if (
      metricId === "payroll_total" &&
      !input.canAccessHr &&
      !input.canAccessFinancials
    ) {
      sections.push({
        metricId,
        heading,
        rows: [{ label: "Status", value: "Permission denied" }],
        note: "Your role cannot access payroll.",
      });
      blocked.push(heading);
      continue;
    }
    if (
      (metricId === "headcount" ||
        metricId === "open_vacancies" ||
        metricId === "pending_leave") &&
      !input.canAccessHr
    ) {
      denyHr(metricId, heading);
      continue;
    }

    switch (metricId) {
      case "pnl": {
        if (!overview) {
          sections.push({
            metricId,
            heading,
            rows: [{ label: "Status", value: "No live financial data" }],
          });
        } else {
          const built = pnlForPeriod(overview, input.period);
          sections.push({ metricId, heading, rows: built.rows, note: built.note });
        }
        break;
      }
      case "balance_sheet": {
        if (!input.canAccessFinancials) {
          denyFinance(metricId, heading);
          break;
        }
        try {
          const totals = await getTypeTotals();
          sections.push({
            metricId,
            heading,
            rows: [
              { label: "Total assets", value: money(totals.assets) },
              { label: "Total liabilities", value: money(totals.liabilities) },
              { label: "Total equity", value: money(totals.equity) },
              {
                label: "Cash (GL Wise accounts)",
                value: money(totals.cashPosition ?? overview?.cashPosition ?? 0),
              },
            ],
            note: "From live general ledger account balances — not forecast figures.",
          });
        } catch {
          sections.push({
            metricId,
            heading,
            rows: [{ label: "Status", value: "Balance sheet unavailable (GL not configured)" }],
          });
        }
        break;
      }
      case "burn_rate": {
        const monthly = overview?.burnRate.monthly ?? 0;
        const currency = overview?.burnRate.currency || "GBP";
        sections.push({
          metricId,
          heading,
          rows: [{ label: "Monthly burn", value: money(monthly, currency) }],
        });
        break;
      }
      case "runway": {
        const runway = overview?.burnRate.runwayMonths;
        sections.push({
          metricId,
          heading,
          rows: [
            {
              label: "Cash runway (months)",
              value: runway == null ? "Not available" : String(runway),
            },
          ],
        });
        break;
      }
      case "cash": {
        sections.push({
          metricId,
          heading,
          rows: [{ label: "Cash position", value: money(overview?.cashPosition ?? 0) }],
        });
        break;
      }
      case "ar_overdue": {
        sections.push({
          metricId,
          heading,
          rows: [{ label: "AR overdue", value: money(overview?.ar.overdue ?? 0) }],
        });
        break;
      }
      case "ar_outstanding": {
        sections.push({
          metricId,
          heading,
          rows: [
            {
              label: "AR outstanding",
              value: money(overview?.ar.outstanding ?? overview?.accountsReceivable ?? 0),
            },
          ],
        });
        break;
      }
      case "ap_outstanding": {
        sections.push({
          metricId,
          heading,
          rows: [
            {
              label: "AP outstanding",
              value: money(overview?.ap.outstanding ?? overview?.accountsPayable ?? 0),
            },
          ],
        });
        break;
      }
      case "revenue_ytd": {
        sections.push({
          metricId,
          heading,
          rows: [
            {
              label: "Revenue YTD",
              value: money(overview?.revenueYtd ?? overview?.annualRevenue ?? 0),
            },
          ],
        });
        break;
      }
      case "net_profit": {
        sections.push({
          metricId,
          heading,
          rows: [{ label: "Net profit", value: money(overview?.netProfit ?? 0) }],
        });
        break;
      }
      case "outstanding_invoices": {
        sections.push({
          metricId,
          heading,
          rows: [
            {
              label: "Outstanding invoices",
              value: String(overview?.outstandingInvoices ?? 0),
            },
          ],
        });
        break;
      }
      case "payroll_total": {
        const monthly = payrollSnap
          ? Math.round((payrollSnap.monthlyGross + payrollSnap.employerTax) * 100) / 100
          : overview?.payroll.monthly ?? 0;
        const currency = payrollSnap?.currency ?? "GBP";
        const empCount = payrollSnap?.employeeCount ?? overview?.payroll.employees ?? 0;
        sections.push({
          metricId,
          heading,
          rows: [
            { label: "Monthly payroll total", value: money(monthly, currency) },
            { label: "Employees on payroll", value: String(empCount) },
          ],
        });
        break;
      }
      case "crm_pipeline_value": {
        const open = leads.filter((l) => l.status !== "Won" && l.status !== "Lost");
        const value = open.reduce((sum, lead) => sum + (lead.estimatedValue ?? 0), 0);
        sections.push({
          metricId,
          heading,
          rows: [
            { label: "Open pipeline value", value: money(Math.round(value)) },
            { label: "Open opportunities", value: String(open.length) },
          ],
        });
        break;
      }
      case "hot_leads": {
        const hot = leads.filter((l) => l.status === "Hot");
        sections.push({
          metricId,
          heading,
          rows: [{ label: "Hot leads", value: String(hot.length) }],
        });
        break;
      }
      case "open_leads": {
        const open = leads.filter((l) => l.status !== "Won" && l.status !== "Lost");
        sections.push({
          metricId,
          heading,
          rows: [{ label: "Open leads", value: String(open.length) }],
        });
        break;
      }
      case "active_clients": {
        const active = clients.filter(
          (c) => String(c.accountStatus || "").toLowerCase() === "active",
        );
        sections.push({
          metricId,
          heading,
          rows: [
            { label: "Active clients", value: String(active.length) },
            { label: "Total clients", value: String(clients.length) },
          ],
        });
        break;
      }
      case "headcount": {
        const active = employees.filter(
          (e) =>
            String((e as { status?: string }).status || "active").toLowerCase() !==
            "terminated",
        );
        sections.push({
          metricId,
          heading,
          rows: [
            { label: "Headcount", value: String(active.length || employees.length) },
          ],
        });
        break;
      }
      case "open_vacancies": {
        sections.push({
          metricId,
          heading,
          rows: [{ label: "Open vacancies", value: String(vacancies.length) }],
        });
        break;
      }
      case "pending_leave": {
        const pending = leaveRequests.filter((r) => {
          const status = String((r as { status?: string }).status || "").toLowerCase();
          return status === "pending" || status === "requested" || status === "awaiting";
        });
        sections.push({
          metricId,
          heading,
          rows: [{ label: "Pending leave requests", value: String(pending.length) }],
        });
        break;
      }
      case "open_projects": {
        const open = projects.filter((p) => {
          const phase = String(p.phase || "").toLowerCase();
          return phase === "live" || phase === "active" || phase === "in_progress";
        });
        sections.push({
          metricId,
          heading,
          rows: [{ label: "Open / live projects", value: String(open.length) }],
        });
        break;
      }
      case "total_projects": {
        sections.push({
          metricId,
          heading,
          rows: [{ label: "Total projects", value: String(projects.length) }],
        });
        break;
      }
      case "overdue_projects": {
        const overdue = projects.filter((p) => isOverdue(p.endDate));
        sections.push({
          metricId,
          heading,
          rows: [{ label: "Overdue projects", value: String(overdue.length) }],
        });
        break;
      }
      case "portfolio_capital": {
        const o = FUNDS_PLATFORM_OVERVIEW;
        sources.add("talanton:funds-data");
        sections.push({
          metricId,
          heading,
          rows: [
            { label: "Capital committed", value: formatFundUsd(o.capitalCommittedUsd) },
            { label: "Portfolio companies", value: String(o.portfolioCompanies) },
            { label: "Countries", value: String(o.countriesRepresented) },
          ],
        });
        break;
      }
      case "fund_deployment": {
        const o = FUNDS_PLATFORM_OVERVIEW;
        const pct = Math.round((o.capitalDeployedUsd / o.capitalCommittedUsd) * 100);
        sources.add("talanton:funds-data");
        sections.push({
          metricId,
          heading,
          rows: [
            { label: "Capital deployed", value: formatFundUsd(o.capitalDeployedUsd) },
            { label: "Available capital", value: formatFundUsd(o.availableCapitalUsd) },
            { label: "Deployment rate", value: `${pct}%` },
          ],
        });
        break;
      }
      case "impact_health": {
        const impact = buildPortfolioImpactBriefing();
        sources.add("talanton:impact-intelligence");
        sections.push({
          metricId,
          heading,
          rows: [
            { label: "Impact health score", value: `${impact.health.score}/100` },
            { label: "Band", value: impact.health.band },
            { label: "People served", value: impact.summary.peopleServed.toLocaleString() },
          ],
        });
        break;
      }
      case "jobs_created": {
        const impact = buildPortfolioImpactBriefing();
        sources.add("talanton:impact-intelligence");
        sections.push({
          metricId,
          heading,
          rows: [
            { label: "Jobs created", value: impact.summary.jobsCreated.toLocaleString() },
            { label: "Jobs retained", value: impact.summary.jobsRetained.toLocaleString() },
            { label: "Women employed", value: impact.summary.womenEmployed.toLocaleString() },
          ],
        });
        break;
      }
      case "portfolio_health": {
        const portfolio = buildPortfolioExecutiveBriefing();
        sources.add("talanton:portfolio-intelligence");
        sections.push({
          metricId,
          heading,
          rows: [
            { label: "Portfolio health score", value: `${portfolio.health.portfolioHealthScore}/100` },
            { label: "Posture", value: portfolio.health.posture },
            {
              label: "Companies requiring attention",
              value: String(portfolio.health.companiesRequiringAttention),
            },
          ],
        });
        break;
      }
      default:
        break;
    }
  }

  return {
    sections,
    unknownTopics: input.unknownTopics,
    periodLabel: formatReportPeriodLabel(input.period),
    sources: [...sources, "assistant:scoped-pdf"],
    blocked,
  };
}

export async function renderScopedBusinessPdf(input: {
  bundle: ScopedPdfLiveBundle;
  userId: string;
  organisationName?: string | null;
  workspaceSlug?: string | null;
  title?: string;
  filename?: string;
  requestPreview?: string;
}): Promise<AssistantStoredArtifact> {
  const brand = await resolveAssistantPdfBrand(input.workspaceSlug);
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const dateLabel = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const title = input.title || "Custom Business Report";
  let y = drawAssistantPdfHeader(doc, brand, {
    organisationName: input.organisationName,
    title,
    subtitle: input.bundle.periodLabel,
    metaRight: dateLabel,
  });
  const left = 40;
  const usable = pageWidth - 80;
  const { colors } = brand;

  const ensureSpace = (need: number) => {
    if (y + need > doc.internal.pageSize.getHeight() - 56) {
      drawAssistantPdfFooter(doc, brand, title);
      doc.addPage();
      if (brand.kind === "abhi") {
        doc.setFillColor(...colors.page);
        doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), "F");
      }
      y = 48;
    }
  };

  const drawSection = (heading: string) => {
    ensureSpace(40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...colors.navy);
    doc.text(heading, left, y);
    y += 16;
  };

  const drawRow = (label: string, value: string, emphasize = false) => {
    ensureSpace(28);
    doc.setFillColor(...colors.soft);
    doc.rect(left, y - 12, usable, 22, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...colors.muted);
    doc.text(label, left + 8, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...(emphasize ? colors.navy : colors.text));
    doc.text(value, left + usable - 8, y, { align: "right" });
    y += 26;
  };

  if (input.requestPreview) {
    drawSection("Request");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    const lines = doc.splitTextToSize(input.requestPreview, usable);
    ensureSpace(lines.length * 12 + 8);
    doc.text(lines, left, y);
    y += lines.length * 12 + 12;
  }

  for (const section of input.bundle.sections) {
    drawSection(section.heading);
    for (let i = 0; i < section.rows.length; i += 1) {
      const row = section.rows[i]!;
      drawRow(row.label, row.value, i === section.rows.length - 1 && section.rows.length <= 3);
    }
    if (section.note) {
      ensureSpace(24);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      const noteLines = doc.splitTextToSize(section.note, usable);
      doc.text(noteLines, left, y);
      y += noteLines.length * 11 + 8;
    }
    y += 8;
  }

  if (input.bundle.unknownTopics.length > 0) {
    drawSection("No live source registered");
    for (const topic of input.bundle.unknownTopics) {
      drawRow(topic, "Not available");
    }
    y += 4;
  }

  ensureSpace(40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...colors.muted);
  doc.text(
    `Only metrics you asked for are included. ${brand.footnoteSource}`,
    left,
    y,
    { maxWidth: usable },
  );
  drawAssistantPdfFooter(doc, brand, title);

  const filename =
    input.filename?.trim() ||
    `Custom Business Report - ${input.bundle.periodLabel.replace(/[^\w\s\-–]/g, "").slice(0, 48)}.pdf`;
  const arrayBuffer = doc.output("arraybuffer");
  const bytes = Buffer.from(arrayBuffer);
  const id = createArtifactId();

  return putAssistantArtifact({
    id,
    kind: "pdf",
    title,
    filename,
    mimeType: "application/pdf",
    bytes,
    userId: input.userId,
    meta: {
      scopedMetrics: input.bundle.sections.map((s) => s.metricId),
      unknownTopics: input.bundle.unknownTopics,
      periodLabel: input.bundle.periodLabel,
      generatedAt: new Date().toISOString(),
      brand: brand.kind,
    },
  });
}
