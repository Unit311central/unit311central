/**
 * Talanton Impact customer host detection.
 * Primary: talantonimpact.unit311central.com
 * Alias: talanton.unit311central.com (portals briefing + same workspace)
 */

export const TALANTON_IMPACT_SLUG = "talantonimpact";
/** Short host alias used for /portals briefing (maps to Talanton Impact workspace). */
export const TALANTON_HOST_ALIAS_SLUG = "talanton";

export function getBrowserWorkspaceSlug(): string {
  if (typeof window === "undefined") return "";
  try {
    const { readEffectiveBrowserWorkspaceSlug } =
      require("@/lib/demo-enterprise/workspace-tenancy-surface") as typeof import("@/lib/demo-enterprise/workspace-tenancy-surface");
    const effective = readEffectiveBrowserWorkspaceSlug();
    if (effective) return effective;
  } catch {
    /* ignore */
  }
  const host = window.location.hostname.toLowerCase();
  const match = host.match(/^([a-z0-9-]+)\.unit311central\.com$/i);
  if (match?.[1]) return match[1];
  if (host.includes("talantonimpact") || host.includes("talanton")) {
    return TALANTON_IMPACT_SLUG;
  }
  return "";
}

export function isTalantonImpactSlug(slug: string | null | undefined): boolean {
  const normalized = String(slug ?? "")
    .trim()
    .toLowerCase();
  return normalized === TALANTON_IMPACT_SLUG || normalized === TALANTON_HOST_ALIAS_SLUG;
}

/** Canonical workspace slug for DB / session binding. */
export function canonicalizeTalantonImpactSlug(
  slug: string | null | undefined,
): typeof TALANTON_IMPACT_SLUG | null {
  return isTalantonImpactSlug(slug) ? TALANTON_IMPACT_SLUG : null;
}

/** Talanton reports and displays money in USD across Home, Financials, and modules. */
export const TALANTON_REPORTING_CURRENCY = "USD";

export function isBrowserTalantonImpactSurface(): boolean {
  return isTalantonImpactSlug(getBrowserWorkspaceSlug());
}
