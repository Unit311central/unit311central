/**
 * Scoped business PDF — only requested live metrics, never invented figures.
 */

import { jsPDF } from "jspdf";

import { getFinancialOverview } from "@/lib/accounting/overview-service";
import type { FinancialOverviewSnapshot } from "@/lib/accounting/types";
import {
  createArtifactId,
  putAssistantArtifact,
  type AssistantStoredArtifact,
} from "@/lib/ai-operating-assistant/artifact-store";
import {
  formatReportPeriodLabel,
  lastNMonthKeys,
  type ReportPeriod,
} from "@/lib/ai-operating-assistant/report-period";
import {
  metricLabel,
  type ScopedPdfMetricId,
} from "@/lib/ai-operating-assistant/scoped-pdf-metrics";
import { listLeads } from "@/lib/crm-leads-service";
import { listHrEmployees } from "@/lib/hr-employees-service";
import { listProjects } from "@/lib/internal-projects-service";
import { calculateLivePayrollSnapshot } from "@/lib/payroll/payroll-service";

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

  const needsFinance = input.metrics.some((m) =>
    ["pnl", "burn_rate", "runway", "cash", "ar_overdue", "payroll_total"].includes(m),
  );
  const needsPayroll = input.metrics.includes("payroll_total");
  const needsCrm = input.metrics.includes("crm_pipeline_value");
  const needsHr = input.metrics.includes("headcount");
  const needsProjects = input.metrics.includes("open_projects");

  const [overview, payrollSnap, leads, employees, projects] = await Promise.all([
    needsFinance && input.canAccessFinancials
      ? getFinancialOverview().catch(() => null)
      : Promise.resolve(null),
    needsPayroll && (input.canAccessHr || input.canAccessFinancials)
      ? calculateLivePayrollSnapshot().catch(() => null)
      : Promise.resolve(null),
    needsCrm ? listLeads("All").catch(() => []) : Promise.resolve([]),
    needsHr && input.canAccessHr ? listHrEmployees().catch(() => []) : Promise.resolve([]),
    needsProjects ? listProjects().catch(() => []) : Promise.resolve([]),
  ]);

  if (overview) sources.add("supabase:financials");
  if (payrollSnap) sources.add("payroll:live");
  if (needsCrm) sources.add("supabase:crm_leads");
  if (needsHr) sources.add("supabase:hr_employees");
  if (needsProjects) sources.add("supabase:projects");

  for (const metricId of input.metrics) {
    const heading = metricLabel(metricId);

    if (
      (metricId === "pnl" ||
        metricId === "burn_rate" ||
        metricId === "runway" ||
        metricId === "cash" ||
        metricId === "ar_overdue") &&
      !input.canAccessFinancials
    ) {
      blocked.push(heading);
      sections.push({
        metricId,
        heading,
        rows: [{ label: "Status", value: "Permission denied" }],
        note: "Your role cannot access financials.",
      });
      continue;
    }

    if (metricId === "payroll_total" && !input.canAccessHr && !input.canAccessFinancials) {
      blocked.push(heading);
      sections.push({
        metricId,
        heading,
        rows: [{ label: "Status", value: "Permission denied" }],
        note: "Your role cannot access payroll.",
      });
      continue;
    }

    if (metricId === "headcount" && !input.canAccessHr) {
      blocked.push(heading);
      sections.push({
        metricId,
        heading,
        rows: [{ label: "Status", value: "Permission denied" }],
        note: "Your role cannot access HR.",
      });
      continue;
    }

    if (metricId === "pnl") {
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
      continue;
    }

    if (metricId === "burn_rate") {
      const monthly = overview?.burnRate.monthly ?? 0;
      const currency = overview?.burnRate.currency || "GBP";
      sections.push({
        metricId,
        heading,
        rows: [{ label: "Monthly burn", value: money(monthly, currency) }],
      });
      continue;
    }

    if (metricId === "runway") {
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
      continue;
    }

    if (metricId === "cash") {
      sections.push({
        metricId,
        heading,
        rows: [{ label: "Cash position", value: money(overview?.cashPosition ?? 0) }],
      });
      continue;
    }

    if (metricId === "ar_overdue") {
      sections.push({
        metricId,
        heading,
        rows: [
          { label: "AR overdue", value: money(overview?.ar.overdue ?? 0) },
          {
            label: "Outstanding invoices",
            value: String(overview?.outstandingInvoices ?? 0),
          },
        ],
      });
      continue;
    }

    if (metricId === "payroll_total") {
      const monthly = payrollSnap
        ? Math.round((payrollSnap.monthlyGross + payrollSnap.employerTax) * 100) / 100
        : overview?.payroll.monthly ?? 0;
      const currency = payrollSnap?.currency ?? "GBP";
      const employees = payrollSnap?.employeeCount ?? overview?.payroll.employees ?? 0;
      sections.push({
        metricId,
        heading,
        rows: [
          { label: "Monthly payroll total", value: money(monthly, currency) },
          { label: "Employees on payroll", value: String(employees) },
        ],
      });
      continue;
    }

    if (metricId === "crm_pipeline_value") {
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
      continue;
    }

    if (metricId === "headcount") {
      const active = employees.filter(
        (e) => String((e as { status?: string }).status || "active").toLowerCase() !== "terminated",
      );
      sections.push({
        metricId,
        heading,
        rows: [
          { label: "Headcount", value: String(active.length || employees.length) },
        ],
      });
      continue;
    }

    if (metricId === "open_projects") {
      const open = projects.filter((p) => {
        const phase = String(p.phase || "").toLowerCase();
        return phase === "live" || phase === "active" || phase === "in_progress";
      });
      sections.push({
        metricId,
        heading,
        rows: [
          { label: "Open / live projects", value: String(open.length) },
          { label: "Total projects", value: String(projects.length) },
        ],
      });
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
  title?: string;
  filename?: string;
  requestPreview?: string;
}): Promise<AssistantStoredArtifact> {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const dateLabel = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  doc.setFillColor(14, 165, 233);
  doc.roundedRect(40, 36, 28, 28, 6, 6, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("U3", 48, 54);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(18);
  doc.text("Unit311", 78, 48);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(input.organisationName?.trim() || "Central", 78, 62);

  const title = input.title || "Custom Business Report";
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(title, 40, 100);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(input.bundle.periodLabel, 40, 116);
  doc.text(dateLabel, pageWidth - 40, 116, { align: "right" });

  let y = 140;
  const left = 40;
  const usable = pageWidth - 80;

  const ensureSpace = (need: number) => {
    if (y + need > doc.internal.pageSize.getHeight() - 56) {
      doc.addPage();
      y = 48;
    }
  };

  const drawSection = (heading: string) => {
    ensureSpace(40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(heading, left, y);
    y += 16;
  };

  const drawRow = (label: string, value: string, emphasize = false) => {
    ensureSpace(28);
    doc.setFillColor(emphasize ? 241 : 248, emphasize ? 245 : 250, emphasize ? 255 : 252);
    doc.rect(left, y - 12, usable, 22, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    doc.text(label, left + 8, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
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
  doc.setTextColor(148, 163, 184);
  doc.text(
    "Only metrics you asked for are included. Figures are live Unit311 data. Zeros mean no posted activity — not estimates.",
    left,
    y,
    { maxWidth: usable },
  );

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
    },
  });
}
