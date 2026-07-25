/**
 * Bank treasury provider selection.
 * Demo workspace / Demo host → simulated Wise. Internal → live Wise.
 */

import { isDemoDomainHost } from "@/lib/app-domains";
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

/** Demo host always uses the simulator — never fall through to live Wise. */
export async function shouldUseDemoWiseSimulator(): Promise<boolean> {
  try {
    const { headers } = await import("next/headers");
    const { getRequestHost } = await import("@/lib/app-domains");
    const requestHeaders = await headers();
    if (isDemoDomainHost(getRequestHost({ headers: requestHeaders }))) {
      return true;
    }
  } catch {
    // Outside a request context — fall through to workspace slug check.
  }

  try {
    const { getCurrentWorkspace } = await import("@/lib/workspace-context");
    const workspace = await getCurrentWorkspace();
    return isDemoWiseWorkspaceSlug(workspace?.slug ?? null);
  } catch {
    return false;
  }
}
