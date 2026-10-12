import { INTERNAL_SITE_HOST, isDemoDomainHost } from "@/lib/app-domains";
import { isWolfCentralHost } from "@/lib/wolf/wolf-surface";
import type { InternalNavChildItem, InternalNavSection } from "@/lib/internal-operations-data";
import { SALES_MANAGEMENT_MODULE_LABEL } from "@/lib/sales-management-nav";

/** Sales Management deep link tab for Target Clients (internal central host only). */
export const TARGET_CLIENTS_TAB = "target-clients" as const;

/** Legacy design-preview tab id — still accepted in URLs. */
export const TARGET_CLIENTS_PREVIEW_TAB_LEGACY = "target-clients-preview" as const;

export function isInternalUnit311CentralHost(hostname: string | null | undefined): boolean {
  const normalized = String(hostname ?? "")
    .trim()
    .toLowerCase()
    .split(":")[0];
  return normalized === INTERNAL_SITE_HOST || normalized === "internal.localhost";
}

/**
 * Live Target Clients opening screen + LHS nav — Internal, Demo and WOLF Central hosts only.
 * @see sales-management-rollout.ts for workspace slug pairing on APIs.
 */
export function isTargetClientsRolloutHost(hostname: string | null | undefined): boolean {
  return (
    isInternalUnit311CentralHost(hostname) ||
    isDemoDomainHost(hostname) ||
    isWolfCentralHost(hostname)
  );
}

/** Dev-only URL — no login, may show fictional sample rows. */
export const TARGET_CLIENTS_DEV_PREVIEW_PATH = "/dev/target-clients-preview";

export function isTargetClientsTab(value: string | null | undefined): boolean {
  return value === TARGET_CLIENTS_TAB || value === TARGET_CLIENTS_PREVIEW_TAB_LEGACY;
}

const TARGET_CLIENTS_NAV_ITEM: InternalNavChildItem = {
  label: "Target Clients",
  view: "sales-management",
  query: { tab: TARGET_CLIENTS_TAB },
};

/** Inserts Target Clients before Opportunities in Sales Management → Sales (canonical rollout hosts). */
export function withTargetClientsNav(
  sections: readonly InternalNavSection[],
): InternalNavSection[] {
  return sections.map((section) => {
    if (section.label !== SALES_MANAGEMENT_MODULE_LABEL) {
      return section as InternalNavSection;
    }

    const items = section.items.map((item) => {
      if (item.label !== "Sales" || !item.children?.length) {
        return item;
      }

      const alreadyPresent = item.children.some(
        (child) =>
          child.label === "Target Clients" ||
          child.query?.tab === TARGET_CLIENTS_TAB ||
          child.query?.tab === TARGET_CLIENTS_PREVIEW_TAB_LEGACY,
      );
      if (alreadyPresent) return item;

      const nextChildren: InternalNavChildItem[] = [];
      for (const child of item.children) {
        if (child.label === "Opportunities") {
          nextChildren.push(TARGET_CLIENTS_NAV_ITEM);
        }
        nextChildren.push(child);
      }

      return { ...item, children: nextChildren };
    });

    return { ...section, items };
  });
}
