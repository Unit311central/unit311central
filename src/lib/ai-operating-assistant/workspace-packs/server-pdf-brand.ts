/**
 * Server-only EA PDF branding — kept separate from board-pack configs so
 * scoped PDF generation does not pull pptxgenjs into the route.
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ABHI_LOGO_SRC } from "@/lib/abhi-surface";
import type { AssistantPdfBrand } from "@/lib/ai-operating-assistant/pdf-brand";
import { brandFromWorkspaceClaim } from "@/lib/workspace-brand";

import type { EaPdfBrandingDelegate } from "./types";

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

async function loadAbhiLogoDataUrl(): Promise<{ dataUrl: string; format: "PNG" | "JPEG" } | null> {
  try {
    const absolute = join(process.cwd(), "public", ABHI_LOGO_SRC.replace(/^\//, ""));
    const bytes = await readFile(absolute);
    const format: "PNG" | "JPEG" = ABHI_LOGO_SRC.toLowerCase().endsWith(".png") ? "PNG" : "JPEG";
    const mime = format === "PNG" ? "image/png" : "image/jpeg";
    return { dataUrl: `data:${mime};base64,${bytes.toString("base64")}`, format };
  } catch {
    return null;
  }
}

const abhiPdfBranding: EaPdfBrandingDelegate = {
  async resolveBrand(workspaceSlug, workspaceName) {
    const brand = brandFromWorkspaceClaim({ slug: workspaceSlug, name: workspaceName });
    const logo = await loadAbhiLogoDataUrl();
    return {
      kind: "abhi",
      brandName: brand.productName,
      organisationFallback: brand.displayName,
      colors: ABHI_COLORS,
      logoDataUrl: logo?.dataUrl ?? null,
      logoFormat: logo?.format ?? null,
      footnoteSource: brand.pdfFootnote,
    } satisfies AssistantPdfBrand;
  },
};

const SERVER_PDF_BRANDING_BY_ID: Record<string, EaPdfBrandingDelegate> = {
  abhi: abhiPdfBranding,
};

export async function resolveServerPdfBrandForPackId(
  packId: string | null | undefined,
  workspaceSlug?: string | null,
  workspaceName?: string | null,
): Promise<AssistantPdfBrand | null> {
  const delegate = packId ? SERVER_PDF_BRANDING_BY_ID[packId] : null;
  if (!delegate) return null;
  return delegate.resolveBrand(workspaceSlug, workspaceName);
}
