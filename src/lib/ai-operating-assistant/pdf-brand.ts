/**
 * Shared EA PDF chrome — workspace-aware brand marks via EaWorkspacePack.
 */

import { jsPDF } from "jspdf";

import {
  ABHI_LOGO_INTRINSIC_HEIGHT,
  ABHI_LOGO_INTRINSIC_WIDTH,
} from "@/lib/abhi-surface";
import {
  NORTHSTAR_LOGO_INTRINSIC_HEIGHT,
  NORTHSTAR_LOGO_INTRINSIC_WIDTH,
} from "@/lib/demo/northstar-surface";
import {
  ensureEaWorkspacePacksRegistered,
  resolveEaWorkspacePdfBrand,
} from "@/lib/ai-operating-assistant/workspace-packs";
import { brandFromWorkspaceClaim, type WorkspaceBrandKind } from "@/lib/workspace-brand";

export type AssistantPdfBrandKind = WorkspaceBrandKind | "unit311" | "northstar";

export type AssistantPdfRgb = readonly [number, number, number];

export type AssistantPdfBrand = {
  kind: AssistantPdfBrandKind;
  brandName: string;
  organisationFallback: string;
  colors: {
    navy: AssistantPdfRgb;
    text: AssistantPdfRgb;
    muted: AssistantPdfRgb;
    soft: AssistantPdfRgb;
    line: AssistantPdfRgb;
    white: AssistantPdfRgb;
    page: AssistantPdfRgb;
    headerAccent: AssistantPdfRgb;
  };
  logoDataUrl: string | null;
  logoFormat: "PNG" | "JPEG" | null;
  footnoteSource: string;
};

const UNIT311_COLORS = {
  navy: [15, 23, 42] as const,
  text: [15, 23, 42] as const,
  muted: [100, 116, 139] as const,
  soft: [248, 250, 252] as const,
  line: [226, 232, 240] as const,
  white: [255, 255, 255] as const,
  page: [255, 255, 255] as const,
  headerAccent: [14, 165, 233] as const,
};

export async function resolveAssistantPdfBrand(
  workspaceSlug?: string | null,
  workspaceName?: string | null,
): Promise<AssistantPdfBrand> {
  ensureEaWorkspacePacksRegistered();
  const packBrand = await resolveEaWorkspacePdfBrand(workspaceSlug, workspaceName);
  if (packBrand) return packBrand;

  const slug = String(workspaceSlug ?? "")
    .trim()
    .toLowerCase();
  const brand = brandFromWorkspaceClaim({ slug, name: workspaceName });
  const kind: AssistantPdfBrandKind =
    brand.kind === "platform" ? "unit311" : brand.kind;

  return {
    kind,
    brandName: brand.productName,
    organisationFallback: brand.displayName,
    colors: UNIT311_COLORS,
    logoDataUrl: null,
    logoFormat: null,
    footnoteSource: brand.pdfFootnote,
  };
}

export type DrawAssistantPdfHeaderInput = {
  organisationName?: string | null;
  title: string;
  subtitle?: string;
  metaRight?: string;
};

/**
 * Draws brand mark + title block. Returns the Y cursor below the header.
 */
export function drawAssistantPdfHeader(
  doc: jsPDF,
  brand: AssistantPdfBrand,
  input: DrawAssistantPdfHeaderInput,
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const { colors } = brand;
  const org =
    input.organisationName?.trim() || brand.organisationFallback;

  if (brand.kind === "abhi") {
    doc.setFillColor(...colors.page);
    doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), "F");
  }

  if (brand.kind === "northstar" && brand.logoDataUrl && brand.logoFormat) {
    const logoW = 110;
    const logoH = logoW * (NORTHSTAR_LOGO_INTRINSIC_HEIGHT / NORTHSTAR_LOGO_INTRINSIC_WIDTH);
    doc.addImage(brand.logoDataUrl, brand.logoFormat, 40, 36, logoW, logoH);
    doc.setTextColor(...colors.muted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(org, 40, 36 + logoH + 14);
  } else if (brand.kind === "abhi" && brand.logoDataUrl && brand.logoFormat) {
    const logoW = 92;
    const logoH =
      logoW * (ABHI_LOGO_INTRINSIC_HEIGHT / ABHI_LOGO_INTRINSIC_WIDTH);
    doc.addImage(
      brand.logoDataUrl,
      brand.logoFormat,
      40,
      36,
      logoW,
      logoH,
    );
    doc.setTextColor(...colors.muted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(org, 40, 36 + logoH + 14);
  } else {
    doc.setFillColor(...colors.headerAccent);
    doc.roundedRect(40, 36, 28, 28, 6, 6, "F");
    doc.setTextColor(...colors.white);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    const mark =
      brand.kind === "corpcentre"
        ? "CC"
        : brand.kind === "talanton"
          ? "TI"
          : brand.kind === "northstar"
            ? "NS"
            : "U3";
    doc.text(mark, 48, 54);

    doc.setTextColor(...colors.text);
    doc.setFontSize(18);
    doc.text(brand.brandName, 78, 48);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...colors.muted);
    doc.text(org, 78, 62);
  }

  let y = brand.kind === "abhi" || brand.kind === "northstar" ? 108 : 100;

  doc.setDrawColor(...colors.line);
  doc.setLineWidth(0.75);
  doc.line(40, y - 12, pageWidth - 40, y - 12);

  doc.setTextColor(...colors.navy);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(input.title, 40, y);

  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...colors.muted);
  if (input.subtitle) {
    doc.text(input.subtitle, 40, y);
  }
  if (input.metaRight) {
    doc.text(input.metaRight, pageWidth - 40, y, { align: "right" });
  }

  return y + 18;
}

export function drawAssistantPdfFooter(
  doc: jsPDF,
  brand: AssistantPdfBrand,
  pageLabel?: string,
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const y = pageHeight - 28;

  if (brand.kind === "abhi") {
    doc.setFillColor(...brand.colors.navy);
    doc.rect(0, pageHeight - 36, pageWidth, 36, "F");
    doc.setTextColor(...brand.colors.white);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`${brand.brandName}  ·  Confidential`, 40, y);
    doc.text(pageLabel || "Executive report", pageWidth - 40, y, {
      align: "right",
    });
    return;
  }

  doc.setTextColor(...brand.colors.muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`${brand.brandName}  ·  Confidential`, 40, y);
  if (pageLabel) {
    doc.text(pageLabel, pageWidth - 40, y, { align: "right" });
  }
}

export function assistantPdfTableHeaderFill(
  brand: AssistantPdfBrand,
): AssistantPdfRgb {
  return brand.kind === "abhi" ? brand.colors.navy : brand.colors.navy;
}

// Re-export for consumers that referenced ABHI logo dimensions from pdf-brand.
export { ABHI_LOGO_INTRINSIC_HEIGHT, ABHI_LOGO_INTRINSIC_WIDTH };
