import type { InternalNavItem } from "@/lib/internal-operations-data";
import { INTERNAL_WORKSPACE_SLUG } from "@/lib/workspace-host";

/** Tools views hidden on the legacy BCN / Unit311 internal workspace only. */
export const LEGACY_BCN_EXCLUDED_TOOLS_VIEWS = new Set(["testing", "telemetry"]);

export function filterLegacyBcnToolsNavItems(items: readonly InternalNavItem[]): InternalNavItem[] {
  return items.filter((item) => !item.view || !LEGACY_BCN_EXCLUDED_TOOLS_VIEWS.has(item.view));
}

export function shouldFilterLegacyBcnToolsNav(workspaceSlug: string | null | undefined): boolean {
  return String(workspaceSlug ?? "").trim().toLowerCase() === INTERNAL_WORKSPACE_SLUG;
}
