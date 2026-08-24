/**
 * Generic customer workspace host detection ({slug}.unit311central.com).
 * Excludes platform/specialist tenants (Demo, Internal, OnwardAir, ABHI, Talanton, CorpCentre).
 */

import {
  DEMO_WORKSPACE_SLUG,
  parseClientPlatformSubdomainSafe,
} from "@/lib/app-domains";
import { isAbhiSlug } from "@/lib/abhi-surface";
import { isCorpCentreWorkspaceSlug } from "@/lib/corpcentre-financials";
import { isDemoWorkspaceSlug } from "@/lib/demo/read-only";
import { isOnwardAirSlug } from "@/lib/onwardair-surface";
import { isTalantonImpactSlug } from "@/lib/talanton-surface";
import { INTERNAL_WORKSPACE_SLUG } from "@/lib/workspace-host";

export function isCustomerWorkspaceSlug(slug: string | null | undefined): boolean {
  const normalized = String(slug ?? "").trim().toLowerCase();
  if (!normalized) return false;
  if (
    normalized === INTERNAL_WORKSPACE_SLUG ||
    normalized === "internal" ||
    normalized === DEMO_WORKSPACE_SLUG ||
    normalized === "demo"
  ) {
    return false;
  }
  if (isOnwardAirSlug(normalized)) return false;
  if (isAbhiSlug(normalized)) return false;
  if (isTalantonImpactSlug(normalized)) return false;
  if (isCorpCentreWorkspaceSlug(normalized)) return false;
  if (isDemoWorkspaceSlug(normalized)) return false;
  return true;
}

export function readBrowserCustomerWorkspaceSlug(): string | null {
  if (typeof window === "undefined") return null;
  const slug = parseClientPlatformSubdomainSafe(window.location.hostname);
  return slug && isCustomerWorkspaceSlug(slug) ? slug : null;
}

export function isBrowserCustomerWorkspaceSurface(): boolean {
  return readBrowserCustomerWorkspaceSlug() != null;
}
