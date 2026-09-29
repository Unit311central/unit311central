/**
 * Talanton Executive Home — host slug must win over stale scoped whoami on customer hosts.
 * Run: node --import tsx src/lib/__tests__/talanton-home-surface.check.ts
 */
import assert from "node:assert/strict";

import { buildExecutiveHomeLiveKpis } from "@/lib/executive-home-dashboard";
import {
  PLATFORM_CACHE_KEYS,
  scopedPlatformCacheKey,
  setCachedJson,
} from "@/lib/platform-fetch-cache";
import {
  getBrowserWorkspaceSlug,
  isBrowserTalantonImpactSurface,
  TALANTON_IMPACT_SLUG,
} from "@/lib/talanton-surface";

function withMockWindow<T>(hostname: string, run: () => T): T {
  const g = globalThis as typeof globalThis & {
    window?: { location: { hostname: string } };
  };
  const priorWindow = g.window;
  g.window = { location: { hostname } } as NonNullable<(typeof g)["window"]>;

  try {
    return run();
  } finally {
    g.window = priorWindow;
  }
}

withMockWindow("talantonimpact.unit311central.com", () => {
  setCachedJson(scopedPlatformCacheKey(PLATFORM_CACHE_KEYS.whoami, "talantonimpact"), {
    workspaceSlug: "demo",
  });
  assert.equal(getBrowserWorkspaceSlug(), TALANTON_IMPACT_SLUG);
  assert.equal(isBrowserTalantonImpactSurface(), true);

  const kpis = buildExecutiveHomeLiveKpis({
    financials: null,
    projects: [],
    clients: [],
  });
  assert.equal(kpis.length, 6, "Talanton home must render six portfolio KPIs");
  assert.equal(kpis[0]?.id, "portfolio-companies");
});

console.log("talanton-home-surface.check.ts ok");
