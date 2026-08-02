import { jsPDF } from "jspdf";

import {
  createArtifactId,
  putAssistantArtifact,
  type AssistantStoredArtifact,
} from "@/lib/ai-operating-assistant/artifact-store";
import {
  drawAssistantPdfFooter,
  drawAssistantPdfHeader,
  resolveAssistantPdfBrand,
  type AssistantPdfBrand,
} from "@/lib/ai-operating-assistant/pdf-brand";
import type { PayrollDashboardSnapshot, PayrollRun } from "@/lib/payroll/types";

function money(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

async function startDoc(
  title: string,
  workspaceSlug?: string | null,
  organisationName?: string | null,
): Promise<{ doc: jsPDF; brand: AssistantPdfBrand; y: number }> {
  const brand = await resolveAssistantPdfBrand(workspaceSlug);
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const y = drawAssistantPdfHeader(doc, brand, {
    organisationName,
    title,
    subtitle: `Generated ${new Date().toISOString().slice(0, 10)}`,
  });
  return { doc, brand, y };
}

async function toArtifact(
  doc: jsPDF,
  brand: AssistantPdfBrand,
  title: string,
  filename: string,
  userId: string,
): Promise<AssistantStoredArtifact> {
  drawAssistantPdfFooter(doc, brand, title);
  const bytes = Buffer.from(doc.output("arraybuffer"));
  const id = createArtifactId();
  return putAssistantArtifact({
    id,
    kind: "pdf",
    title,
    filename,
    mimeType: "application/pdf",
    bytes,
    userId,
    meta: { brand: brand.kind },
  });
}

export async function generatePayrollSummaryPdf(
  dashboard: PayrollDashboardSnapshot,
  userId: string,
  opts?: { workspaceSlug?: string | null; organisationName?: string | null },
): Promise<AssistantStoredArtifact> {
  const { doc, brand, y: startY } = await startDoc(
    "Payroll Summary",
    opts?.workspaceSlug,
    opts?.organisationName,
  );
  const currency = dashboard.currency;
  let y = startY;
  const rows = [
    ["Monthly gross", money(dashboard.monthlyGrossPayroll, currency)],
    ["Employee tax withheld", money(dashboard.estimatedEmployeeTaxWithheld, currency)],
    ["Employer taxes", money(dashboard.estimatedEmployerTaxes, currency)],
    ["Net payroll", money(dashboard.estimatedNetPayroll, currency)],
    ["Next payroll date", dashboard.nextPayrollDate],
    ["Employees", String(dashboard.employeeCount)],
    ["Average salary", money(dashboard.averageSalary, currency)],
  ];
  for (const [label, value] of rows) {
    doc.setTextColor(...brand.colors.text);
    doc.setFont("helvetica", "bold");
    doc.text(label, 40, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, 240, y);
    y += 18;
  }
  return toArtifact(doc, brand, "Payroll Summary", "payroll-summary.pdf", userId);
}

export async function generateDepartmentPayrollPdf(
  dashboard: PayrollDashboardSnapshot,
  userId: string,
  opts?: { workspaceSlug?: string | null; organisationName?: string | null },
): Promise<AssistantStoredArtifact> {
  const { doc, brand, y: startY } = await startDoc(
    "Department Payroll",
    opts?.workspaceSlug,
    opts?.organisationName,
  );
  let y = startY;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...brand.colors.navy);
  doc.text("Department", 40, y);
  doc.text("Employees", 220, y);
  doc.text("Gross", 320, y);
  doc.text("Net", 420, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...brand.colors.text);
  for (const row of dashboard.departmentBreakdown) {
    if (y > 760) {
      drawAssistantPdfFooter(doc, brand, "Department Payroll");
      doc.addPage();
      y = 48;
    }
    doc.text(row.department.slice(0, 28), 40, y);
    doc.text(String(row.employees), 220, y);
    doc.text(money(row.gross, dashboard.currency), 320, y);
    doc.text(money(row.net, dashboard.currency), 420, y);
    y += 16;
  }
  return toArtifact(doc, brand, "Department Payroll", "department-payroll.pdf", userId);
}

export async function generateEmployeePayrollSummaryPdf(
  run: PayrollRun,
  userId: string,
  opts?: { workspaceSlug?: string | null; organisationName?: string | null },
): Promise<AssistantStoredArtifact> {
  const { doc, brand, y: startY } = await startDoc(
    `Employee Payroll · ${run.payDate}`,
    opts?.workspaceSlug,
    opts?.organisationName,
  );
  let y = startY;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...brand.colors.navy);
  doc.text("Employee", 40, y);
  doc.text("Gross", 220, y);
  doc.text("Tax", 300, y);
  doc.text("Net", 400, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...brand.colors.text);
  for (const line of run.lines ?? []) {
    if (y > 760) {
      drawAssistantPdfFooter(doc, brand, "Employee Payroll Summary");
      doc.addPage();
      y = 48;
    }
    const tax = line.federalTax + line.stateTax + line.socialSecurity + line.medicare;
    doc.text(line.employeeName.slice(0, 28), 40, y);
    doc.text(money(line.gross, line.currency), 220, y);
    doc.text(money(tax, line.currency), 300, y);
    doc.text(money(line.net, line.currency), 400, y);
    y += 16;
  }
  return toArtifact(
    doc,
    brand,
    "Employee Payroll Summary",
    `employee-payroll-${run.payDate}.pdf`,
    userId,
  );
}

export async function generatePayrollCostReportPdf(
  dashboard: PayrollDashboardSnapshot,
  userId: string,
  opts?: { workspaceSlug?: string | null; organisationName?: string | null },
): Promise<AssistantStoredArtifact> {
  const { doc, brand, y: startY } = await startDoc(
    "Payroll Cost Report",
    opts?.workspaceSlug,
    opts?.organisationName,
  );
  let y = startY;
  const totalCost = dashboard.monthlyGrossPayroll + dashboard.estimatedEmployerTaxes;
  doc.setTextColor(...brand.colors.text);
  doc.text(`Total monthly employment cost: ${money(totalCost, dashboard.currency)}`, 40, y);
  y += 24;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...brand.colors.navy);
  doc.text("Month", 40, y);
  doc.text("Gross", 140, y);
  doc.text("Net", 260, y);
  doc.text("Employer tax", 360, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...brand.colors.text);
  for (const point of dashboard.trend) {
    doc.text(point.month, 40, y);
    doc.text(money(point.gross, dashboard.currency), 140, y);
    doc.text(money(point.net, dashboard.currency), 260, y);
    doc.text(money(point.employerTax, dashboard.currency), 360, y);
    y += 16;
  }
  return toArtifact(doc, brand, "Payroll Cost Report", "payroll-cost-report.pdf", userId);
}

export async function generateBoardPayrollReportPdf(
  dashboard: PayrollDashboardSnapshot,
  userId: string,
  opts?: { workspaceSlug?: string | null; organisationName?: string | null },
): Promise<AssistantStoredArtifact> {
  const { doc, brand, y: startY } = await startDoc(
    "Board Payroll Report",
    opts?.workspaceSlug,
    opts?.organisationName,
  );
  let y = startY;
  doc.setFontSize(11);
  doc.setTextColor(...brand.colors.text);
  const paragraphs = [
    `Headcount on payroll: ${dashboard.employeeCount}`,
    `Monthly gross payroll: ${money(dashboard.monthlyGrossPayroll, dashboard.currency)}`,
    `Estimated net payroll: ${money(dashboard.estimatedNetPayroll, dashboard.currency)}`,
    `Employer tax estimate: ${money(dashboard.estimatedEmployerTaxes, dashboard.currency)}`,
    `Next payroll date: ${dashboard.nextPayrollDate}`,
    `Latest run status: ${dashboard.payrollRunStatus}`,
    `Top department by cost: ${dashboard.departmentBreakdown[0]?.department ?? "n/a"} (${money(dashboard.departmentBreakdown[0]?.gross ?? 0, dashboard.currency)})`,
  ];
  for (const line of paragraphs) {
    doc.text(line, 40, y);
    y += 20;
  }
  return toArtifact(doc, brand, "Board Payroll Report", "board-payroll-report.pdf", userId);
}
