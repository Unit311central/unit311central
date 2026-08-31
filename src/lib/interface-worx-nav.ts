import type { InternalNavItem } from "@/lib/internal-operations-data";
import { isInterfaceWorxSlug } from "@/lib/interface-worx-surface";

/** Grant Management under Fundraising — Interface Worx only (not Business Central). */
export const INTERFACE_WORX_FUNDRAISING_GRANTS_NAV_ITEM: InternalNavItem = {
  label: "Grants",
  icon: "ScrollText",
  view: "grants",
};

/** Tools views hidden on InterfaceWorx production workspace only. */
export const INTERFACE_WORX_EXCLUDED_TOOLS_VIEWS = new Set(["testing", "telemetry"]);

export function filterInterfaceWorxToolsNavItems(items: readonly InternalNavItem[]): InternalNavItem[] {
  return items.filter((item) => !item.view || !INTERFACE_WORX_EXCLUDED_TOOLS_VIEWS.has(item.view));
}

export function shouldFilterInterfaceWorxToolsNav(workspaceSlug: string | null | undefined): boolean {
  return isInterfaceWorxSlug(workspaceSlug);
}

export function augmentInterfaceWorxFundraisingNavItems(
  items: readonly InternalNavItem[],
): InternalNavItem[] {
  if (items.some((item) => item.view === "grants")) return [...items];
  return [...items, INTERFACE_WORX_FUNDRAISING_GRANTS_NAV_ITEM];
}

export function shouldAugmentInterfaceWorxFundraisingNav(
  workspaceSlug: string | null | undefined,
): boolean {
  return isInterfaceWorxSlug(workspaceSlug);
}

/** Fundraising Grant Management — enabled only on Interface Worx (not default catalogue provisioning). */
export const FUNDRAISING_GRANTS_SUBMODULE_KEY = "fundraising:grants" as const;

export function filterFundraisingProvisioningSubModules(
  workspaceSlug: string | null | undefined,
  subModules: readonly string[],
): string[] {
  if (isInterfaceWorxSlug(workspaceSlug)) return [...subModules];
  return subModules.filter((key) => key !== FUNDRAISING_GRANTS_SUBMODULE_KEY);
}
