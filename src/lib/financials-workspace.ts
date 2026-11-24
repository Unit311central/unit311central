import { requireCurrentWorkspace } from "@/lib/workspace-context";

import type { SalesBusinessContext } from "@/lib/sales-business-context";

export type FinancialsWorkspaceScope = {
  /** Explicit override for system/provisioning callers. Prefer omit to use session context. */
  workspaceId?: string | null;
  /** Optional slug hint (avoids an extra DB round-trip / RLS miss on overview). */
  workspaceSlug?: string | null;
  /**
   * Set only for the unit311 workspace. When omitted, quote queries stay workspace-only.
   */
  businessContext?: SalesBusinessContext | null;
};

/**
 * Resolve the tenant key for Financials module operations.
 * Uses requireCurrentWorkspace() unless an explicit workspaceId is provided.
 */
export async function resolveFinancialsWorkspaceId(
  scope?: FinancialsWorkspaceScope,
): Promise<string> {
  const explicit = scope?.workspaceId?.trim();
  if (explicit) return explicit;
  const workspace = await requireCurrentWorkspace();
  return workspace.id;
}
