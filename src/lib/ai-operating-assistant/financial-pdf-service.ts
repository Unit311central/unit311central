import { jsPDF } from "jspdf";

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
  resolveFinancialPeriod,
} from "@/lib/ai-operating-assistant/report-period";

export { resolveFinancialPeriod } from "@/lib/ai-operating-assistant/report-period";

function money(value: number, currency = "USD") {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value || 0);
  } catch {
    return `$${(value || 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  }
}

function monthLabel(isoMonth: string) {
  const [year, month] = isoMonth.split("-").map(Number);
  if (!year || !month) return isoMonth;
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Board financial / P&L PDF from live overview figures — never invents metrics.
 */
export async function generateFinancialBoardPdf(input: {
  overview: FinancialOverviewSnapshot;
  userId: string;
  organisationName?: string | null;
  workspaceSlug?: string | null;
  periodKey?: string;
  title?: string;
  filename?: string;
}): Promise<AssistantStoredArtifact> {
  const brand = await resolveAssistantPdfBrand(input.workspaceSlug);
  const periodKey = input.periodKey || resolveFinancialPeriod(null);
  const isYtd = periodKey === "ytd";
  const periodTitle = isYtd ? `Year to date ${new Date().getUTCFullYear()}` : monthLabel(periodKey);

  const monthlyPl = input.overview.charts.monthlyProfitLoss.find((row) => row.month === periodKey);
  const monthlyRevenuePoint = input.overview.charts.monthlyRevenue.find(
    (row) => row.month === periodKey,
  );
  const monthlyOutPoint = input.overview.charts.monthlyOutgoings.find(
    (row) => row.month === periodKey,
  );

  const revenue = isYtd
    ? input.overview.annualRevenue || input.overview.revenueYtd
    : monthlyRevenuePoint?.amount ?? input.overview.monthlyRevenue;
  const expenses = isYtd
    ? input.overview.annualExpenses || input.overview.monthlyExpenses
    : monthlyOutPoint?.amount ?? input.overview.monthlyExpenses;
  const profit = isYtd
    ? input.overview.netProfit
    : monthlyPl
      ? monthlyPl.profit - monthlyPl.loss
      : revenue - expenses;

  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const dateLabel = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const title = input.title || "Board Financial Report";
  let y = drawAssistantPdfHeader(doc, brand, {
    organisationName: input.organisationName,
    title,
    subtitle: periodTitle,
    metaRight: dateLabel,
  });
  const left = 40;
  const usable = pageWidth - 80;
  const { colors } = brand;

  const drawSection = (heading: string) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...colors.navy);
    doc.text(heading, left, y);
    y += 16;
  };

  const drawRow = (label: string, value: string, emphasize = false) => {
    doc.setFillColor(...(emphasize ? colors.soft : colors.soft));
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

  drawSection("Profit & Loss");
  drawRow("Revenue", money(revenue));
  drawRow("Expenses", money(expenses));
  drawRow("Net profit / (loss)", money(profit), true);

  y += 10;
  drawSection("Balance sheet signals");
  drawRow("Cash position", money(input.overview.cashPosition));
  drawRow("Accounts receivable", money(input.overview.accountsReceivable));
  drawRow("Accounts payable", money(input.overview.accountsPayable));
  drawRow(
    "Monthly burn",
    money(input.overview.burnRate.monthly, input.overview.burnRate.currency || "USD"),
  );
  if (input.overview.burnRate.runwayMonths != null) {
    drawRow("Cash runway (months)", String(input.overview.burnRate.runwayMonths));
  }

  y += 10;
  drawSection("Receivables");
  drawRow("Outstanding invoices", String(input.overview.outstandingInvoices));
  drawRow("AR outstanding", money(input.overview.ar.outstanding));
  drawRow("AR overdue", money(input.overview.ar.overdue));
  drawRow("Collection rate", `${input.overview.ar.collectionRate}%`);

  if (input.overview.ar.recentUnpaid.length > 0) {
    y += 8;
    drawSection("Top unpaid invoices");
    for (const invoice of input.overview.ar.recentUnpaid.slice(0, 6)) {
      if (y > doc.internal.pageSize.getHeight() - 60) {
        drawAssistantPdfFooter(doc, brand, title);
        doc.addPage();
        if (brand.kind === "abhi") {
          doc.setFillColor(...colors.page);
          doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), "F");
        }
        y = 48;
      }
      drawRow(
        `${invoice.clientName ?? invoice.invoiceNumber} · due ${invoice.dueDate}`,
        money(invoice.amount, invoice.currency || "USD"),
      );
    }
  }

  y += 12;
  if (y > doc.internal.pageSize.getHeight() - 48) {
    drawAssistantPdfFooter(doc, brand, title);
    doc.addPage();
    y = 48;
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...colors.muted);
  doc.text(
    brand.kind === "abhi"
      ? "Figures sourced from live ABHI financials. Zeros mean no posted activity — not estimates."
      : brand.footnoteSource,
    left,
    y,
    { maxWidth: usable },
  );
  drawAssistantPdfFooter(doc, brand, title);

  const filename =
    input.filename?.trim() ||
    (title.toLowerCase().includes("board")
      ? `Board Financial Report - ${periodTitle}.pdf`
      : `Financial Report - ${periodTitle}.pdf`);
  const arrayBuffer = doc.output("arraybuffer");
  const bytes = Buffer.from(arrayBuffer);
  const id = createArtifactId();

  return putAssistantArtifact({
    id,
    kind: "pdf",
    title: title,
    filename,
    mimeType: "application/pdf",
    bytes,
    userId: input.userId,
    meta: {
      periodKey,
      revenue,
      expenses,
      profit,
      generatedAt: new Date().toISOString(),
    },
  });
}
