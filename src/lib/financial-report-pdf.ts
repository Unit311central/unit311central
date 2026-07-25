import { jsPDF } from "jspdf";

import type { FinancialReportRecord } from "@/lib/financial-reports-mock-data";

/** Client-side PDF for Financial Reports centre — real downloadable bytes. */
export function buildFinancialReportPdfBlob(report: FinancialReportRecord): Blob {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  let y = margin;

  const write = (text: string, size = 11, style: "normal" | "bold" = "normal") => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, 515);
    for (const line of lines) {
      if (y > 780) {
        doc.addPage();
        y = margin;
      }
      doc.text(String(line), margin, y);
      y += size + 6;
    }
  };

  write("Unit311 Central — Financial Report", 16, "bold");
  y += 8;
  write(report.name, 14, "bold");
  y += 4;
  write(`Type: ${report.reportType}`);
  write(`Category: ${report.category}`);
  write(`Period: ${report.periodLabel} (${report.periodKind})`);
  write(`Organisation: ${report.organisation || "—"}`);
  write(`Department: ${report.department || "—"}`);
  write(`Project: ${report.project || "—"}`);
  write(`Currency: ${report.currency || "—"}`);
  write(`Status: ${report.status} · Maturity: ${report.maturity}`);
  write(`Generated: ${new Date().toLocaleString("en-GB")}`);
  y += 10;
  write("Summary", 12, "bold");
  write(
    report.description?.trim() ||
      "This report pack was generated from the Financial Reports centre. Connect live ledger exports for full GL-backed statements.",
  );
  y += 8;
  write("Notes", 12, "bold");
  write(
    report.includeNotes
      ? "Notes included per template settings."
      : "Notes were not requested for this template.",
  );
  write(
    report.includeCharts
      ? "Charts were requested in the template (tabular PDF summary only in this export)."
      : "Charts were not requested.",
  );
  y += 12;
  write(
    "This PDF is a Unit311 Central report package. For full P&L / balance sheet from live GL, use Financials or the Executive Assistant financial PDF tools.",
    9,
  );

  return doc.output("blob");
}

export function downloadFinancialReportPdf(report: FinancialReportRecord) {
  const blob = buildFinancialReportPdfBlob(report);
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
