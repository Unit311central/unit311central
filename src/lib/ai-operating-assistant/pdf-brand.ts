/**
 * Shared EA PDF chrome — ABHI board-paper brand on ABHI hosts;
 * Unit311 sky mark elsewhere.
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { jsPDF } from "jspdf";

import {
  ABHI_LOGO_INTRINSIC_HEIGHT,
  ABHI_LOGO_INTRINSIC_WIDTH,
  ABHI_LOGO_SRC,
  isAbhiSlug,
} from "@/lib/abhi-surface";
import { isTalantonImpactSlug } from "@/lib/talanton-surface";

function isCorpCentreWorkspaceSlug(slug: string): boolean {
  return slug === "corpcentre" || slug === "corporatecentre";
}

export type AssistantPdfBrandKind = "abhi" | "corpcentre" | "talanton" | "unit311";

export type AssistantPdfRgb = readonly [number, number, number];

export type AssistantPdfBrand = {
  kind: AssistantPdfBrandKind;
  /** Primary wordmark / product name in the header. */
  brandName: string;
  /** Fallback org line under the brand. */
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

const ABHI_COLORS = {
  navy: [0, 43, 92] as const,
  text: [27, 36, 48] as const,
  muted: [91, 101, 119] as const,
  soft: [238, 241, 245] as const,
  line: [213, 220, 230] as const,
  white: [255, 255, 255] as const,
  page: [245, 247, 250] as const,
  headerAccent: [0, 43, 92] as const,
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

async function loadPublicImageDataUrl(
  relativePath: string,
): Promise<{ dataUrl: string; format: "PNG" | "JPEG" } | null> {
  try {
    const absolute = join(process.cwd(), "public", relativePath.replace(/^\//, ""));
    const bytes = await readFile(absolute);
    const lower = relativePath.toLowerCase();
    const format: "PNG" | "JPEG" = lower.endsWith(".png") ? "PNG" : "JPEG";
    const mime = format === "PNG" ? "image/png" : "image/jpeg";
    return {
      dataUrl: `data:${mime};base64,${bytes.toString("base64")}`,
      format,
    };
  } catch {
    return null;
  }
}

export async function resolveAssistantPdfBrand(
  workspaceSlug?: string | null,
): Promise<AssistantPdfBrand> {
  const slug = String(workspaceSlug ?? "")
    .trim()
    .toLowerCase();

  if (isAbhiSlug(slug)) {
    const logo = await loadPublicImageDataUrl(ABHI_LOGO_SRC);
    return {
      kind: "abhi",
      brandName: "ABHI",
      organisationFallback: "ABHI",
      colors: ABHI_COLORS,
      logoDataUrl: logo?.dataUrl ?? null,
      logoFormat: logo?.format ?? null,
      footnoteSource:
        "Figures sourced from live ABHI workspace data. Empty sections mean no records — not estimates.",
    };
  }

  if (isCorpCentreWorkspaceSlug(slug)) {
    return {
      kind: "corpcentre",
      brandName: "Corp.Centre",
      organisationFallback: "Corp.Centre",
      colors: UNIT311_COLORS,
      logoDataUrl: null,
      logoFormat: null,
      footnoteSource:
        "Figures sourced from live Corp.Centre workspace data. Empty sections mean no records — not estimates.",
    };
  }

  if (isTalantonImpactSlug(slug)) {
    return {
      kind: "talanton",
      brandName: "Talanton Impact",
      organisationFallback: "Talanton Impact",
      colors: UNIT311_COLORS,
      logoDataUrl: null,
      logoFormat: null,
      footnoteSource:
        "Figures sourced from live Talanton Impact workspace data. Empty sections mean no records — not estimates.",
    };
  }

  return {
    kind: "unit311",
    brandName: "Unit311",
    organisationFallback: "Central",
    colors: UNIT311_COLORS,
    logoDataUrl: null,
    logoFormat: null,
    footnoteSource:
      "Figures sourced from live Unit311 workspace data. Empty sections mean no records — not estimates.",
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

  // Soft page wash for ABHI board-paper feel
  if (brand.kind === "abhi") {
    doc.setFillColor(...colors.page);
    doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), "F");
  }

  if (brand.kind === "abhi" && brand.logoDataUrl && brand.logoFormat) {
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

  let y = brand.kind === "abhi" ? 108 : 100;

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
