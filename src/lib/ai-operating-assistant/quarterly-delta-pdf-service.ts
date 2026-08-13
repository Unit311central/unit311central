/**
 * Quarter-over-quarter financial delta PDF for EA demo asks.
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
  drawAssistantPdfFooter,
  drawAssistantPdfHeader,
  resolveAssistantPdfBrand,
} from "@/lib/ai-operating-assistant/pdf-brand";
import {
  formatQuarterLabel,
  getLastCompletedCalendarQuarter,
  getPriorQuarter,
  quarterMonthKeys,
  type QuarterRef,
} from "@/lib/ai-operating-assistant/report-period";

export type DeltaMetricRow = {
  label: string;
  currentLabel: string;
  currentValue: number;
  priorLabel: string;
  priorValue: number;
  absoluteDelta: number;
  percentDelta: string;
  note?: string;
};

export type QuarterlyDeltaBundle = {
  currentQuarter: QuarterRef;
  priorQuarter: QuarterRef;
  rows: DeltaMetricRow[];
  sources: string[];
  blocked: boolean;
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

function formatPercentDelta(current: number, prior: number): string {
  if (prior === 0) {
    return current === 0 ? "0%" : "N/A (prior period was zero)";
  }
  const pct = ((current - prior) / Math.abs(prior)) * 100;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

function sumForMonths(
  points: Array<{ month: string; amount: number }>,
  months: string[],
): number {
  let total = 0;
  for (const key of months) {
    total += points.find((row) => row.month === key)?.amount ?? 0;
  }
  return total;
}

function netProfitForQuarter(overview: FinancialOverviewSnapshot, ref: QuarterRef): number {
  const months = quarterMonthKeys(ref);
  let total = 0;
  for (const key of months) {
    const pl = overview.charts.monthlyProfitLoss.find((row) => row.month === key);
    if (pl) {
      total += pl.profit - pl.loss;
      continue;
    }
    const rev = overview.charts.monthlyRevenue.find((row) => row.month === key)?.amount ?? 0;
    const out = overview.charts.monthlyOutgoings.find((row) => row.month === key)?.amount ?? 0;
    total += rev - out;
  }
  return total;
}

function avgMonthlyBurnForQuarter(overview: FinancialOverviewSnapshot, ref: QuarterRef): number {
  const months = quarterMonthKeys(ref);
  const total = sumForMonths(overview.charts.monthlyOutgoings, months);
  const withData = months.filter(
    (key) =>
      (overview.charts.monthlyOutgoings.find((row) => row.month === key)?.amount ?? 0) !== 0,
  ).length;
  if (withData > 0) return total / withData;
  return months.length > 0 ? total / months.length : 0;
}

function payrollTotalForQuarter(overview: FinancialOverviewSnapshot, ref: QuarterRef): number {
  const months = quarterMonthKeys(ref);
  const trend = overview.payroll.trend ?? [];
  if (trend.length > 0) {
    return sumForMonths(trend, months);
  }
  return overview.payroll.monthly * months.length;
}

function buildDeltaRow(
  label: string,
  currentLabel: string,
  currentValue: number,
  priorLabel: string,
  priorValue: number,
  note?: string,
): DeltaMetricRow {
  return {
    label,
    currentLabel,
    currentValue,
    priorLabel,
    priorValue,
    absoluteDelta: currentValue - priorValue,
    percentDelta: formatPercentDelta(currentValue, priorValue),
    note,
  };
}

export async function loadQuarterlyDeltaBundle(input: {
  canAccessFinancials: boolean;
}): Promise<QuarterlyDeltaBundle> {
  const currentQuarter = getLastCompletedCalendarQuarter();
  const priorQuarter = getPriorQuarter(currentQuarter);
  const currentLabel = formatQuarterLabel(currentQuarter);
  const priorLabel = formatQuarterLabel(priorQuarter);

  if (!input.canAccessFinancials) {
    return {
      currentQuarter,
      priorQuarter,
      rows: [],
      sources: [],
      blocked: true,
    };
  }

  const overview = await getFinancialOverview().catch(() => null);
  if (!overview) {
    return {
      currentQuarter,
      priorQuarter,
      rows: [],
      sources: [],
      blocked: false,
    };
  }

  const pnlCurrent = netProfitForQuarter(overview, currentQuarter);
  const pnlPrior = netProfitForQuarter(overview, priorQuarter);
  const burnCurrent = avgMonthlyBurnForQuarter(overview, currentQuarter);
  const burnPrior = avgMonthlyBurnForQuarter(overview, priorQuarter);
  const payrollCurrent = payrollTotalForQuarter(overview, currentQuarter);
  const payrollPrior = payrollTotalForQuarter(overview, priorQuarter);

  const payrollNote =
    (overview.payroll.trend?.length ?? 0) === 0
      ? "Payroll totals use the current monthly payroll rate applied across each quarter month (no historical payroll series posted)."
      : undefined;

  return {
    currentQuarter,
    priorQuarter,
    rows: [
      buildDeltaRow(
        "Profit & Loss (net)",
        currentLabel,
        pnlCurrent,
        priorLabel,
        pnlPrior,
      ),
      buildDeltaRow(
        "Burn rate (avg monthly)",
        currentLabel,
        burnCurrent,
        priorLabel,
        burnPrior,
        "Average monthly outgoings across each quarter.",
      ),
      buildDeltaRow(
        "Payroll costs (quarter total)",
        currentLabel,
        payrollCurrent,
        priorLabel,
        payrollPrior,
        payrollNote,
      ),
    ],
    sources: ["supabase:financials", "assistant:quarterly-delta-pdf"],
    blocked: false,
  };
}

export async function renderQuarterlyDeltaPdf(input: {
  bundle: QuarterlyDeltaBundle;
  userId: string;
  organisationName?: string | null;
  workspaceSlug?: string | null;
  requestPreview?: string;
}): Promise<AssistantStoredArtifact> {
  const brand = await resolveAssistantPdfBrand(input.workspaceSlug);
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const currentLabel = formatQuarterLabel(input.bundle.currentQuarter);
  const priorLabel = formatQuarterLabel(input.bundle.priorQuarter);
  const title = `Financial Delta Report — ${currentLabel} vs ${priorLabel}`;
  const dateLabel = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  let y = drawAssistantPdfHeader(doc, brand, {
    organisationName: input.organisationName,
    title,
    subtitle: `Comparison: ${currentLabel} (last completed quarter) vs ${priorLabel} (prior quarter)`,
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

  if (input.requestPreview) {
    ensureSpace(40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...colors.navy);
    doc.text("Request", left, y);
    y += 16;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    const lines = doc.splitTextToSize(input.requestPreview, usable);
    doc.text(lines, left, y);
    y += lines.length * 12 + 12;
  }

  if (input.bundle.blocked) {
    ensureSpace(30);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...colors.text);
    doc.text("Your role cannot access financial reports.", left, y);
  } else if (input.bundle.rows.length === 0) {
    ensureSpace(30);
    doc.text("No live financial data available for quarter-over-quarter comparison.", left, y);
  } else {
    for (const row of input.bundle.rows) {
      ensureSpace(120);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...colors.navy);
      doc.text(row.label, left, y);
      y += 18;

      const drawMetric = (label: string, value: string) => {
        ensureSpace(28);
        doc.setFillColor(...colors.soft);
        doc.rect(left, y - 12, usable, 22, "F");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(...colors.muted);
        doc.text(label, left + 8, y);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...colors.text);
        doc.text(value, left + usable - 8, y, { align: "right" });
        y += 26;
      };

      drawMetric(`${row.currentLabel}`, money(row.currentValue));
      drawMetric(`${row.priorLabel}`, money(row.priorValue));
      drawMetric("Absolute delta", money(row.absoluteDelta));
      drawMetric("Percentage delta", row.percentDelta);
      if (row.note) {
        ensureSpace(24);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...colors.muted);
        const noteLines = doc.splitTextToSize(row.note, usable);
        doc.text(noteLines, left, y);
        y += noteLines.length * 10 + 8;
      }
      y += 8;
    }
  }

  drawAssistantPdfFooter(doc, brand, title);
  const bytes = Buffer.from(doc.output("arraybuffer"));
  const filename = `Financial-Delta-${currentLabel}-vs-${priorLabel}.pdf`.replace(/\s+/g, "-");
  return putAssistantArtifact({
    id: createArtifactId(),
    kind: "pdf",
    title,
    filename,
    mimeType: "application/pdf",
    bytes,
    userId: input.userId,
  });
}
