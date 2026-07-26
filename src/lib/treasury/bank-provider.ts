/**
 * Bank treasury provider selection — client-safe slug helpers.
 * Server-only Demo detection lives in bank-provider-server.ts.
 */

import { demoWorkspaceSlug } from "@/lib/runtime-surface";
import { INTERNAL_WORKSPACE_SLUG } from "@/lib/workspace-host";

export function isDemoWiseWorkspaceSlug(slug: string | null | undefined): boolean {
  if (!slug) return false;
  return slug.trim().toLowerCase() === demoWorkspaceSlug();
}

export function isLiveWiseWorkspaceSlug(slug: string | null | undefined): boolean {
  if (!slug) return false;
  return slug.trim().toLowerCase() === INTERNAL_WORKSPACE_SLUG;
}

/** Workspaces allowed to use the Wise treasury UI (live or simulated). */
export function isWiseTreasuryWorkspaceSlug(slug: string | null | undefined): boolean {
  return isDemoWiseWorkspaceSlug(slug) || isLiveWiseWorkspaceSlug(slug);
}
