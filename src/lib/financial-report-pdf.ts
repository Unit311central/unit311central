import { jsPDF } from "jspdf";

import type { FinancialOverviewSnapshot } from "@/lib/accounting/types";
import type { FinancialReportRecord } from "@/lib/financial-reports-mock-data";
import { resolveBrowserWorkspaceDisplayName } from "@/lib/workspace-brand";

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

/** Client-side PDF backed by live GL overview figures. */
export function buildFinancialReportPdfBlob(
  report: FinancialReportRecord,
  overview: FinancialOverviewSnapshot,
): Blob {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const left = 48;
  const usable = pageWidth - left * 2;
  let y = 48;

  const ensureSpace = (need = 40) => {
    if (y + need > doc.internal.pageSize.getHeight() - 48) {
      doc.addPage();
      y = 48;
    }
  };

  const write = (text: string, size = 11, style: "normal" | "bold" = "normal") => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(style === "bold" ? 15 : 51, style === "bold" ? 23 : 65, style === "bold" ? 42 : 85);
    const lines = doc.splitTextToSize(text, usable);
    for (const line of lines) {
      ensureSpace(size + 8);
      doc.text(String(line), left, y);
      y += size + 6;
    }
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

  const orgName = resolveBrowserWorkspaceDisplayName();
  write(`${orgName} — Financial Report`, 16, "bold");
  y += 4;
  write(report.name, 14, "bold");
  y += 2;
  write(`Type: ${report.reportType} · Category: ${report.category}`);
  write(`Period: ${report.periodLabel} (${report.periodKind})`);
  write(`Organisation: ${report.organisation || "—"}`);
  write(`Currency: ${report.currency || "USD"}`);
  write(`Generated: ${new Date().toLocaleString("en-GB")}`);
  y += 10;

  write("Profit & Loss (live ledger)", 12, "bold");
  drawRow("Revenue (YTD)", money(overview.revenueYtd || overview.annualRevenue, report.currency));
  drawRow("Monthly revenue", money(overview.monthlyRevenue, report.currency));
  drawRow("Monthly expenses", money(overview.monthlyExpenses, report.currency));
  drawRow("Net profit / (loss)", money(overview.netProfit, report.currency), true);

  y += 8;
  write("Balance sheet signals", 12, "bold");
  drawRow("Cash position", money(overview.cashPosition, report.currency));
  drawRow("Accounts receivable", money(overview.accountsReceivable, report.currency));
  drawRow("Accounts payable", money(overview.accountsPayable, report.currency));
  drawRow(
    "Monthly burn",
    money(overview.burnRate.monthly, overview.burnRate.currency || report.currency || "USD"),
  );
  if (overview.burnRate.runwayMonths != null) {
    drawRow("Cash runway (months)", String(overview.burnRate.runwayMonths));
  }

  y += 8;
  write("Receivables", 12, "bold");
  drawRow("Outstanding invoices", String(overview.outstandingInvoices));
  drawRow("AR outstanding", money(overview.ar.outstanding, report.currency));
  drawRow("AR overdue", money(overview.ar.overdue, report.currency));
  drawRow("Collection rate", `${overview.ar.collectionRate}%`);

  if (overview.ar.recentUnpaid.length > 0) {
    y += 8;
    write("Top unpaid invoices", 12, "bold");
    for (const invoice of overview.ar.recentUnpaid.slice(0, 8)) {
      drawRow(
        `${invoice.clientName ?? invoice.invoiceNumber} · due ${invoice.dueDate}`,
        money(invoice.amount, invoice.currency || report.currency || "USD"),
      );
    }
  }

  if (overview.ap.recent.length > 0) {
    y += 8;
    write("Recent payables", 12, "bold");
    for (const bill of overview.ap.recent.slice(0, 6)) {
      drawRow(
        `${bill.supplier} · due ${bill.dueDate}`,
        money(bill.amount, bill.currency || report.currency || "USD"),
      );
    }
  }

  if (report.includeNotes && report.description?.trim()) {
    y += 10;
    write("Notes", 12, "bold");
    write(report.description.trim());
  }

  y += 14;
  ensureSpace(36);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Figures sourced from live ${orgName} financials (GL, invoices, expenses, cash). Zeros mean no posted activity — not estimates.`,
    left,
    y,
    { maxWidth: usable },
  );

  return doc.output("blob");
}

async function fetchLiveFinancialOverview(): Promise<FinancialOverviewSnapshot> {
  const response = await fetch("/api/financials/ledger/overview", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Could not load live financial overview for this report.");
  }
  const payload = (await response.json()) as {
    overview?: FinancialOverviewSnapshot;
    error?: string;
  };
  if (!payload.overview) {
    throw new Error(payload.error || "Live financial overview was empty.");
  }
  return payload.overview;
}

export async function downloadFinancialReportPdf(
  report: FinancialReportRecord,
  overview?: FinancialOverviewSnapshot | null,
) {
  const live = overview ?? (await fetchLiveFinancialOverview());
  const blob = buildFinancialReportPdfBlob(report, live);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const safeName = report.name.replace(/[^\w\-]+/g, "_").slice(0, 80) || "financial-report";
  anchor.href = url;
  anchor.download = `${safeName}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
