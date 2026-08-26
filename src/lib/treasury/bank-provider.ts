/**
 * Bank treasury provider selection — client-safe slug helpers.
 * Server-only Demo detection lives in bank-provider-server.ts.
 */

import { demoWorkspaceSlug } from "@/lib/runtime-surface";
import { isOnwardAirSlug } from "@/lib/onwardair-surface";
import { isSaecSlug } from "@/lib/saec-surface";
import { INTERNAL_WORKSPACE_SLUG } from "@/lib/workspace-host";

export function isDemoWiseWorkspaceSlug(slug: string | null | undefined): boolean {
  if (!slug) return false;
  return slug.trim().toLowerCase() === demoWorkspaceSlug();
}

export function isLiveWiseWorkspaceSlug(slug: string | null | undefined): boolean {
  if (!slug) return false;
  return slug.trim().toLowerCase() === INTERNAL_WORKSPACE_SLUG;
}

export function isOnwardAirBankWorkspaceSlug(slug: string | null | undefined): boolean {
  return isOnwardAirSlug(slug);
}

export function isOmniTransitBankWorkspaceSlug(slug: string | null | undefined): boolean {
  return isSaecSlug(slug);
}

/** Workspaces allowed to use the Bank treasury UI (live or simulated). */
export function isWiseTreasuryWorkspaceSlug(slug: string | null | undefined): boolean {
  return (
    isDemoWiseWorkspaceSlug(slug) ||
    isLiveWiseWorkspaceSlug(slug) ||
    isOnwardAirBankWorkspaceSlug(slug) ||
    isOmniTransitBankWorkspaceSlug(slug)
  );
}
