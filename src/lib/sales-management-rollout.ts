/**
 * Canonical Sales Management rollout — Internal, Demo and WOLF Central only.
 *
 * Internal (`unit311`) is the reference implementation. Demo and WOLF reuse the same
 * UI (`src/components/testflighthub/sales-management/*`), APIs (`/api/sales-management/*`)
 * and CRM services (`crm_leads`), scoped by workspace session — never by hardcoded workspace IDs.
 *
 * Target Clients host + workspace gates live in `sales-management-target-clients.ts` and
 * `assertSalesManagementTargetClientsWorkspace()` below.
 *
 * Do not extend this list to Talanton, ABHI, Interface Worx, GreenDesert, MAM, etc. without
 * an explicit product decision and tenancy review.
 */

import { DEMO_WORKSPACE_SLUG, isDemoDomainHost } from "@/lib/app-domains";
import { isInternalUnit311CentralHost } from "@/lib/sales-management-target-clients";
import { INTERNAL_WORKSPACE_SLUG } from "@/lib/workspace-host";
import { isWolfCentralHost, WOLF_CENTRAL_SLUG } from "@/lib/wolf/wolf-surface";

export const SALES_MANAGEMENT_CANONICAL_WORKSPACE_SLUGS = [
  INTERNAL_WORKSPACE_SLUG,
  DEMO_WORKSPACE_SLUG,
  WOLF_CENTRAL_SLUG,
] as const;

export type SalesManagementCanonicalWorkspaceSlug =
  (typeof SALES_MANAGEMENT_CANONICAL_WORKSPACE_SLUGS)[number];

export function isSalesManagementCanonicalWorkspace(
  slug: string | null | undefined,
): slug is SalesManagementCanonicalWorkspaceSlug {
  const normalized = String(slug ?? "")
    .trim()
    .toLowerCase();
  return (SALES_MANAGEMENT_CANONICAL_WORKSPACE_SLUGS as readonly string[]).includes(normalized);
}

/** Server-side workspace gate for Target Clients APIs (pairs with host check). */
export function assertSalesManagementTargetClientsWorkspace(slug: string): void {
  if (!isSalesManagementCanonicalWorkspace(slug)) {
    throw new Error(
      "Target Clients is only available on Internal, Demo and WOLF Sales Management workspaces.",
    );
  }
}

/** Hosts that run the canonical Internal Sales Management UI (not legacy CRM subviews). */
export function isCanonicalSalesManagementHost(hostname: string | null | undefined): boolean {
  return (
    isInternalUnit311CentralHost(hostname) ||
    isDemoDomainHost(hostname) ||
    isWolfCentralHost(hostname)
  );
}
