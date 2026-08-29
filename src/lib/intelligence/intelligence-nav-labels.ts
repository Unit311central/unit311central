import { DEMO_WORKSPACE_SLUG } from "@/lib/app-domains";
import { AMANAH_SLUG } from "@/lib/amanah-surface";
import { ABHI_SLUG } from "@/lib/abhi-surface";
import { GREENDESERT_SLUG } from "@/lib/greendesert-surface";
import { INTERFACE_WORX_SLUG } from "@/lib/interface-worx-surface";
import { SAEC_SLUG } from "@/lib/saec-surface";

/** Workspace-specific LHS labels for the Intelligence Core Module. */
export const INTELLIGENCE_WORKSPACE_NAV_LABELS: Readonly<Record<string, string>> = {
  [DEMO_WORKSPACE_SLUG]: "NORTHSTAR INTELLIGENCE",
  [ABHI_SLUG]: "ABHI INTELLIGENCE",
  [SAEC_SLUG]: "OMNITRANSIT INTELLIGENCE",
  [AMANAH_SLUG]: "AMANAH INTELLIGENCE",
  [INTERFACE_WORX_SLUG]: "INTERFACEWORX INTELLIGENCE",
  [GREENDESERT_SLUG]: "GREENDESERT INTELLIGENCE",
};

export function resolveIntelligenceNavLabel(workspaceSlug?: string | null): string {
  const slug = String(workspaceSlug ?? "").trim().toLowerCase();
  if (!slug) return "INTELLIGENCE";
  return INTELLIGENCE_WORKSPACE_NAV_LABELS[slug] ?? "INTELLIGENCE";
}
