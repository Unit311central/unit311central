import type { InternalNavItem } from "@/lib/internal-operations-data";
import { isInterfaceWorxSlug } from "@/lib/interface-worx-surface";

/** Tools views hidden on InterfaceWorx production workspace only. */
export const INTERFACE_WORX_EXCLUDED_TOOLS_VIEWS = new Set(["testing", "telemetry"]);

export function filterInterfaceWorxToolsNavItems(items: readonly InternalNavItem[]): InternalNavItem[] {
  return items.filter((item) => !item.view || !INTERFACE_WORX_EXCLUDED_TOOLS_VIEWS.has(item.view));
}

export function shouldFilterInterfaceWorxToolsNav(workspaceSlug: string | null | undefined): boolean {
  return isInterfaceWorxSlug(workspaceSlug);
}
