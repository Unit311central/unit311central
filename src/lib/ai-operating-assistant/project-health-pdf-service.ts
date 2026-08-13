/**
 * Active project health PDF — derived from live project fields only.
 */

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
} from "@/lib/ai-operating-assistant/pdf-brand";
import { isOverdue } from "@/lib/ai-operating-assistant/tool-result";
import type { InternalProject } from "@/lib/projects-data";

export type ProjectHealthBand = "Green" | "Amber" | "Red";

export type ProjectHealthRow = {
  name: string;
  clientName: string;
  progressPct: number;
  endDate: string | null;
  band: ProjectHealthBand;
  indicators: string[];
};

function isActiveProject(project: InternalProject) {
  const phase = String(project.phase || "").toLowerCase();
  return phase === "live" || phase === "active" || phase === "in_progress";
}

export function assessProjectHealth(project: InternalProject): ProjectHealthRow {
  const overdue = isOverdue(project.endDate);
  const progress = project.progressPct ?? 0;
  const notes = project.notes?.trim() ?? "";
  const indicators: string[] = [`Progress ${progress}%`];
  if (project.endDate) indicators.push(`Due ${project.endDate}`);
  if (project.operator) indicators.push(`Operator ${project.operator}`);
  if (overdue) indicators.push("Past end date");
  if (notes) indicators.push(`Notes: ${notes}`);

  let band: ProjectHealthBand = "Green";
  if (overdue || progress < 40) {
    band = "Red";
  } else if (progress < 60 || /risk|blocked|delay/i.test(notes)) {
    band = "Amber";
  }

  return {
    name: project.name,
    clientName: project.clientName,
    progressPct: progress,
    endDate: project.endDate,
    band,
    indicators,
  };
}

export function buildProjectHealthRows(projects: InternalProject[]): ProjectHealthRow[] {
  return projects
    .filter(isActiveProject)
    .map(assessProjectHealth)
    .sort((a, b) => {
      const rank = (band: ProjectHealthBand) => (band === "Red" ? 0 : band === "Amber" ? 1 : 2);
      return rank(a.band) - rank(b.band) || a.name.localeCompare(b.name);
    });
}

export async function renderProjectHealthPdf(input: {
  projects: InternalProject[];
  userId: string;
  organisationName?: string | null;
  workspaceSlug?: string | null;
  requestPreview?: string;
}): Promise<AssistantStoredArtifact> {
  const brand = await resolveAssistantPdfBrand(input.workspaceSlug);
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const title = "Active Projects — Health Status Update";
  const rows = buildProjectHealthRows(input.projects);
  const dateLabel = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  let y = drawAssistantPdfHeader(doc, brand, {
    organisationName: input.organisationName,
    title,
    subtitle: `${rows.length} active project(s) · RAG from progress %, due dates, and recorded notes`,
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

  if (rows.length === 0) {
    ensureSpace(24);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...colors.text);
    doc.text("No active projects on record.", left, y);
  } else {
    for (const row of rows) {
      ensureSpace(70);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...colors.navy);
      doc.text(`${row.name} — ${row.band}`, left, y);
      y += 14;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...colors.text);
      doc.text(`${row.clientName}`, left, y);
      y += 14;
      for (const indicator of row.indicators) {
        ensureSpace(18);
        const lines = doc.splitTextToSize(`• ${indicator}`, usable - 8);
        doc.text(lines, left + 4, y);
        y += Math.max(14, lines.length * 12);
      }
      y += 8;
    }
  }

  drawAssistantPdfFooter(doc, brand, title);
  const bytes = Buffer.from(doc.output("arraybuffer"));
  const stamp = new Date().toISOString().slice(0, 10);
  return putAssistantArtifact({
    id: createArtifactId(),
    kind: "pdf",
    title,
    filename: `Active-Projects-Health-${stamp}.pdf`,
    mimeType: "application/pdf",
    bytes,
    userId: input.userId,
  });
}
