import { jsPDF } from "jspdf";

import {
  HR_EMPLOYMENT_STATUS_LABELS,
  type HrEmployee,
} from "@/lib/hr-data";
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

type PdfEmployeeRow = {
  fullName: string;
  department: string;
  jobTitle: string;
  status: string;
};

function toRows(employees: HrEmployee[]): PdfEmployeeRow[] {
  return [...employees]
    .sort((a, b) => a.fullName.localeCompare(b.fullName))
    .map((employee) => ({
      fullName: employee.fullName || "—",
      department: employee.department || "—",
      jobTitle: employee.role || "—",
      status:
        HR_EMPLOYMENT_STATUS_LABELS[employee.employmentStatus] ??
        employee.employmentStatus,
    }));
}

function drawTable(
  doc: jsPDF,
  brand: AssistantPdfBrand,
  rows: PdfEmployeeRow[],
  startY: number,
) {
  const left = 40;
  const pageWidth = doc.internal.pageSize.getWidth();
  const usable = pageWidth - 80;
  const cols = [
    { key: "fullName" as const, label: "Name", width: usable * 0.32 },
    { key: "department" as const, label: "Department", width: usable * 0.24 },
    { key: "jobTitle" as const, label: "Job title", width: usable * 0.28 },
    { key: "status" as const, label: "Status", width: usable * 0.16 },
  ];
  const rowHeight = 22;
  let y = startY;
  const { colors } = brand;

  const drawHeader = () => {
    doc.setFillColor(...colors.navy);
    doc.rect(left, y, usable, rowHeight, "F");
    doc.setTextColor(...colors.white);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    let x = left + 6;
    for (const col of cols) {
      doc.text(col.label, x, y + 14);
      x += col.width;
    }
    y += rowHeight;
  };

  drawHeader();

  doc.setFont("helvetica", "normal");
  rows.forEach((row, index) => {
    if (y + rowHeight > doc.internal.pageSize.getHeight() - 56) {
      drawAssistantPdfFooter(doc, brand, "Employee Directory");
      doc.addPage();
      if (brand.kind === "abhi") {
        doc.setFillColor(...colors.page);
        doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), "F");
      }
      y = 48;
      drawHeader();
      doc.setFont("helvetica", "normal");
    }
    if (index % 2 === 0) {
      doc.setFillColor(...colors.soft);
      doc.rect(left, y, usable, rowHeight, "F");
    }
    doc.setTextColor(...colors.text);
    doc.setFontSize(9);
    let x = left + 6;
    for (const col of cols) {
      const text = doc.splitTextToSize(String(row[col.key]), col.width - 10);
      doc.text(text[0] ?? "", x, y + 14);
      x += col.width;
    }
    y += rowHeight;
  });
}

/**
 * Executive employee directory PDF — brand chrome + non-sensitive columns only.
 */
export async function generateEmployeeDirectoryPdf(input: {
  employees: HrEmployee[];
  userId: string;
  organisationName?: string | null;
  workspaceSlug?: string | null;
  title?: string;
  filename?: string;
}): Promise<AssistantStoredArtifact> {
  const brand = await resolveAssistantPdfBrand(input.workspaceSlug);
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const dateLabel = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const title = input.title?.trim() || "Employee Directory";
  const filename = input.filename?.trim() || "Employee Directory.pdf";

  const contentY = drawAssistantPdfHeader(doc, brand, {
    organisationName: input.organisationName,
    title,
    subtitle: dateLabel,
    metaRight: `${input.employees.length} people`,
  });

  drawTable(doc, brand, toRows(input.employees), contentY);
  drawAssistantPdfFooter(doc, brand, title);

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
      employeeCount: input.employees.length,
      generatedAt: new Date().toISOString(),
      brand: brand.kind,
    },
  });
}
