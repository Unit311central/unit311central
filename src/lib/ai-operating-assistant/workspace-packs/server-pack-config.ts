/**
 * Server-only workspace pack extensions (board pack, PDF branding).
 * Imported from server routes/tools only — not from client bundles.
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";

import {
  ABHI_LOGO_INTRINSIC_HEIGHT,
  ABHI_LOGO_INTRINSIC_WIDTH,
  ABHI_LOGO_SRC,
} from "@/lib/abhi-surface";
import type { AssistantPdfBrand } from "@/lib/ai-operating-assistant/pdf-brand";
import { brandFromWorkspaceClaim } from "@/lib/workspace-brand";

import { abhiBoardPackConfig } from "./boardpack/abhi";
import { demoBoardPackConfig } from "./boardpack/demo";
import { onwardAirBoardPackConfig } from "./boardpack/onwardair";
import { talantonBoardPackConfig } from "./boardpack/talanton";
import type {
  EaBoardPackConfig,
  EaBusinessSnapshotEnricher,
  EaDailyBriefBuilder,
  EaPdfBrandingDelegate,
} from "./types";

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

const SERVER_BOARD_PACK_BY_ID: Record<string, EaBoardPackConfig> = {
  abhi: abhiBoardPackConfig,
  talanton: talantonBoardPackConfig,
  onwardair: onwardAirBoardPackConfig,
  demo: demoBoardPackConfig,
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
    const slug = String(workspaceSlug ?? "").trim().toLowerCase();
    const brand = brandFromWorkspaceClaim({ slug, name: workspaceName });
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

let serverDailyBriefBuilders: Record<string, EaDailyBriefBuilder> | null = null;
let serverSnapshotEnrichers: Record<string, EaBusinessSnapshotEnricher> | null = null;

async function loadServerDailyBriefBuilders(): Promise<Record<string, EaDailyBriefBuilder>> {
  if (serverDailyBriefBuilders) return serverDailyBriefBuilders;
  const { buildTalantonDailyExecutiveBrief } = await import(
    "@/lib/talanton/daily-executive-brief"
  );
  serverDailyBriefBuilders = {
    talanton: async (context) => buildTalantonDailyExecutiveBrief(context),
  };
  return serverDailyBriefBuilders;
}

async function loadServerSnapshotEnrichers(): Promise<Record<string, EaBusinessSnapshotEnricher>> {
  if (serverSnapshotEnrichers) return serverSnapshotEnrichers;
  const { queryOnwardAirModule } = await import("@/lib/onwardair/executive-intelligence");
  const { isOnwardAirSlug } = await import("@/lib/onwardair-surface");
  const { queryNorthstarModule } = await import("@/lib/demo/executive-intelligence");
  const { isNorthstarDemoSlug } = await import("@/lib/demo/northstar-surface");
  serverSnapshotEnrichers = {
    onwardair: async (context, domain, snapshot) => {
      if (
        !isOnwardAirSlug(context.workspace.slug) ||
        !(domain === "fundraising" || domain === "engineering" || domain === "intelligence")
      ) {
        return snapshot;
      }
      const moduleId =
        domain === "fundraising"
          ? "fundraising"
          : domain === "engineering"
            ? "engineering"
            : "intelligence";
      return {
        ...snapshot,
        onwardairModule: queryOnwardAirModule(moduleId),
      };
    },
    demo: async (context, domain, snapshot) => {
      if (!isNorthstarDemoSlug(context.workspace.slug)) return snapshot;
      if (
        !(
          domain === "fundraising" ||
          domain === "engineering" ||
          domain === "intelligence" ||
          domain === "finance"
        )
      ) {
        return snapshot;
      }
      const moduleId =
        domain === "fundraising"
          ? "fundraising"
          : domain === "engineering"
            ? "engineering"
            : domain === "finance"
              ? "financials"
              : "intelligence";
      return {
        ...snapshot,
        northstarModule: queryNorthstarModule(moduleId),
      };
    },
  };
  return serverSnapshotEnrichers;
}

export async function buildServerDailyBriefForPackId(
  packId: string | null | undefined,
  context: Parameters<EaDailyBriefBuilder>[0],
) {
  const builders = await loadServerDailyBriefBuilders();
  const builder = packId ? builders[packId] : null;
  return builder ? builder(context) : null;
}

export async function enrichServerBusinessSnapshotForPackId(
  packId: string | null | undefined,
  context: Parameters<EaBusinessSnapshotEnricher>[0],
  domain: Parameters<EaBusinessSnapshotEnricher>[1],
  snapshot: Record<string, unknown>,
) {
  const enrichers = await loadServerSnapshotEnrichers();
  const enricher = packId && enrichers ? enrichers[packId] : null;
  return enricher ? enricher(context, domain, snapshot) : snapshot;
}

export function getServerBoardPackConfigForPackId(
  packId: string | null | undefined,
): EaBoardPackConfig | null {
  if (!packId) return null;
  return SERVER_BOARD_PACK_BY_ID[packId] ?? null;
}

export async function resolveServerPdfBrandForPackId(
  packId: string | null | undefined,
  workspaceSlug?: string | null,
  workspaceName?: string | null,
): Promise<AssistantPdfBrand | null> {
  const delegate = packId ? SERVER_PDF_BRANDING_BY_ID[packId] : null;
  if (!delegate) return null;
  return delegate.resolveBrand(workspaceSlug, workspaceName);
}

export { ABHI_LOGO_INTRINSIC_HEIGHT, ABHI_LOGO_INTRINSIC_WIDTH };
