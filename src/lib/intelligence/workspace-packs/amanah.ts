import { AMANAH_SLUG } from "@/lib/amanah-surface";
import { INTELLIGENCE_WORKSPACE_NAV_LABELS } from "@/lib/intelligence/intelligence-nav-labels";
import { buildStandardIntelligencePack } from "@/lib/intelligence/workspace-packs/_standard-pack";

export const amanahIntelligencePack = buildStandardIntelligencePack({
  id: "amanah-intelligence",
  slug: AMANAH_SLUG,
  label: INTELLIGENCE_WORKSPACE_NAV_LABELS[AMANAH_SLUG],
  hostSurface: "customer",
});
