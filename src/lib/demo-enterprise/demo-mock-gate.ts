/**
 * Shared client-side Demo gate for mock stores.
 * Returns Northstar fixtures only on the Demo host.
 */

import type { DemoEnterpriseFixtures } from "@/lib/demo-enterprise";

export function tryGetDemoFixtures(): DemoEnterpriseFixtures | null {
  if (typeof window === "undefined") return null;
  try {
    const mod = require("@/lib/demo-enterprise") as typeof import("@/lib/demo-enterprise");
    if (!mod.isBrowserDemoSurface()) return null;
    return mod.getDemoEnterpriseFixtures();
  } catch {
    return null;
  }
}

export function isDemoBrowserHost(): boolean {
  return tryGetDemoFixtures() !== null;
}
