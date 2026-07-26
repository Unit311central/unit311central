/**
 * Server-only Demo Wise simulator detection.
 * Never import this from Client Components.
 */

import "server-only";

import { isDemoDomainHost } from "@/lib/app-domains";
import { isDemoWiseWorkspaceSlug } from "@/lib/treasury/bank-provider";

/**
 * Demo host / Demo workspace always uses the simulator — never fall through to live Wise.
 * Also honors middleware `x-unit311-demo: 1` when Host forwarding is ambiguous.
 */
export async function shouldUseDemoWiseSimulator(): Promise<boolean> {
  try {
    const { headers } = await import("next/headers");
    const { getRequestHost } = await import("@/lib/app-domains");
    const requestHeaders = await headers();
    if (requestHeaders.get("x-unit311-demo") === "1") {
      return true;
    }
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
