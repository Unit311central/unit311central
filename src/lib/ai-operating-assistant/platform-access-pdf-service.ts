/**
 * Platform user access PDF — workspace users / operators with entitlements.
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
import type { ManagedUser } from "@/lib/user-management-data";

export type PlatformAccessRow = {
  fullName: string;
  username: string;
  email: string;
  role: string;
  status: string;
  accessSummary: string;
};

function summarizeAccess(user: ManagedUser): string {
  const views = user.allowedViews;
  if (views == null) return "Full platform access (all modules)";
  if (views.length === 0) return "No module views granted";
  if (views.length <= 6) return views.join(", ");
  return `${views.slice(0, 6).join(", ")} +${views.length - 6} more`;
}

export function toPlatformAccessRows(users: ManagedUser[]): PlatformAccessRow[] {
  return [...users]
    .sort((a, b) => a.fullName.localeCompare(b.fullName))
    .map((user) => ({
      fullName: user.fullName || user.username,
      username: user.username,
      email: user.email || "—",
      role: user.role,
      status: user.status,
      accessSummary: summarizeAccess(user),
    }));
}

export async function renderPlatformAccessPdf(input: {
  users: ManagedUser[];
  userId: string;
  organisationName?: string | null;
  workspaceSlug?: string | null;
  requestPreview?: string;
}): Promise<AssistantStoredArtifact> {
  const brand = await resolveAssistantPdfBrand(input.workspaceSlug);
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const title = "Platform Users & Access Summary";
  const rows = toPlatformAccessRows(input.users);
  const dateLabel = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  let y = drawAssistantPdfHeader(doc, brand, {
    organisationName: input.organisationName,
    title,
    subtitle: `${rows.length} user(s) · roles and allowed module views`,
    metaRight: dateLabel,
  });
  const left = 40;
  const usable = pageWidth - 80;
  const { colors } = brand;
  const rowHeight = 22;

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

  const cols = [
    { label: "Name", width: usable * 0.22 },
    { label: "Username", width: usable * 0.2 },
    { label: "Role", width: usable * 0.12 },
    { label: "Status", width: usable * 0.1 },
    { label: "Platform access", width: usable * 0.36 },
  ];

  const drawHeader = () => {
    doc.setFillColor(...colors.navy);
    doc.rect(left, y, usable, rowHeight, "F");
    doc.setTextColor(...colors.white);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    let x = left + 6;
    for (const col of cols) {
      doc.text(col.label, x, y + 14);
      x += col.width;
    }
    y += rowHeight;
  };

  if (rows.length === 0) {
    ensureSpace(24);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...colors.text);
    doc.text("No platform users available for this workspace.", left, y);
  } else {
    drawHeader();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    for (const row of rows) {
      if (y + rowHeight > doc.internal.pageSize.getHeight() - 56) {
        drawAssistantPdfFooter(doc, brand, title);
        doc.addPage();
        if (brand.kind === "abhi") {
          doc.setFillColor(...colors.page);
          doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), "F");
        }
        y = 48;
        drawHeader();
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
      }
      const fill = rows.indexOf(row) % 2 === 0 ? colors.soft : colors.white;
      doc.setFillColor(...fill);
      doc.rect(left, y, usable, rowHeight, "F");
      doc.setTextColor(...colors.text);
      let x = left + 6;
      const values = [row.fullName, row.username, row.role, row.status, row.accessSummary];
      for (let i = 0; i < cols.length; i += 1) {
        const col = cols[i]!;
        const value = values[i] ?? "—";
        const clipped = doc.splitTextToSize(value, col.width - 8)[0] ?? value;
        doc.text(clipped, x, y + 14);
        x += col.width;
      }
      y += rowHeight;
    }
  }

  drawAssistantPdfFooter(doc, brand, title);
  const bytes = Buffer.from(doc.output("arraybuffer"));
  const stamp = new Date().toISOString().slice(0, 10);
  return putAssistantArtifact({
    id: createArtifactId(),
    kind: "pdf",
    title,
    filename: `Platform-Users-Access-${stamp}.pdf`,
    mimeType: "application/pdf",
    bytes,
    userId: input.userId,
  });
}
