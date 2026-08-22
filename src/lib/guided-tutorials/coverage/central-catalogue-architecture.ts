/**
 * Locked Unit311Central 22-module platform architecture for the central tutorial catalogue.
 *
 * Model:
 *   CENTRAL MODULE → CENTRAL PRODUCT FUNCTION → CENTRAL TUTORIAL ID → runtime binding(s) → workspace availability
 *
 * Workspace availability is metadata only — not tutorial identity.
 */

/** Slugs for the 22 Unit311Central product modules (+ home / executive-assistant top-level). */
export const CENTRAL_PLATFORM_MODULE_SLUGS = [
  "home",
  "executive-assistant",
  "intelligence",
  "business-central",
  "sales-management",
  "financials",
  "fundraising",
  "board",
  "corporate-information",
  "operations",
  "marketing-events",
  "technology-management",
  "human-resources",
  "business-productivity",
  "support-desk",
  "project-management",
  "engineering",
  "training",
  "qms",
  "tools",
  "external-client-access",
  "settings",
] as const;

export type CentralPlatformModuleSlug = (typeof CENTRAL_PLATFORM_MODULE_SLUGS)[number];

const CENTRAL_MODULE_SET = new Set<string>(CENTRAL_PLATFORM_MODULE_SLUGS);

export function isCentralPlatformModuleSlug(moduleSlug: string): moduleSlug is CentralPlatformModuleSlug {
  return CENTRAL_MODULE_SET.has(moduleSlug);
}
