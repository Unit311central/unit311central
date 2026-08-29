/**
 * Generic customer workspace intelligence pack — fallback when no slug-specific pack exists.
 */

import { CUSTOMER_INTELLIGENCE_PACK_SLUG } from "@/lib/intelligence/workspace-packs/customer-constants";
import { buildStandardIntelligencePack } from "@/lib/intelligence/workspace-packs/_standard-pack";

export const customerIntelligencePack = buildStandardIntelligencePack({
  id: "customer-intelligence",
  slug: CUSTOMER_INTELLIGENCE_PACK_SLUG,
  label: "INTELLIGENCE",
  hostSurface: "customer",
});

export { CUSTOMER_INTELLIGENCE_PACK_SLUG };
