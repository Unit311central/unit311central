import { INTERFACE_WORX_SLUG } from "@/lib/interface-worx-surface";
import { INTELLIGENCE_WORKSPACE_NAV_LABELS } from "@/lib/intelligence/intelligence-nav-labels";
import { buildStandardIntelligencePack } from "@/lib/intelligence/workspace-packs/_standard-pack";

export const interfaceWorxIntelligencePack = buildStandardIntelligencePack({
  id: "interfaceworx-intelligence",
  slug: INTERFACE_WORX_SLUG,
  label: INTELLIGENCE_WORKSPACE_NAV_LABELS[INTERFACE_WORX_SLUG],
  hostSurface: "customer",
});
