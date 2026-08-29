import { GREENDESERT_SLUG } from "@/lib/greendesert-surface";
import { INTELLIGENCE_WORKSPACE_NAV_LABELS } from "@/lib/intelligence/intelligence-nav-labels";
import { buildStandardIntelligencePack } from "@/lib/intelligence/workspace-packs/_standard-pack";

export const greenDesertIntelligencePack = buildStandardIntelligencePack({
  id: "greendesert-intelligence",
  slug: GREENDESERT_SLUG,
  label: INTELLIGENCE_WORKSPACE_NAV_LABELS[GREENDESERT_SLUG],
  hostSurface: "customer",
});
