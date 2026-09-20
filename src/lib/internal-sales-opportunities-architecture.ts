import { isInternalDomainHost } from "@/lib/app-domains";
import type { InternalNavSection } from "@/lib/internal-operations-data";
import { SALES_MANAGEMENT_MODULE_LABEL } from "@/lib/sales-management-nav";
import type { SalesManagementTabId } from "@/lib/sales-management-tabs";

/** Internal Unit311 Central host only — not demo or customer tenants. */
export function isInternalOpportunitiesArchitectureEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return isInternalDomainHost(window.location.hostname);
}

/** Tabs hidden from LHS nav in the internal architecture (data/APIs unchanged). */
export const INTERNAL_OPPORTUNITIES_ARCHITECTURE_HIDDEN_TABS: readonly SalesManagementTabId[] = [
  "prospects",
  "pipeline",
  "discovery",
  "activities",
] as const;

/** High-level workflow framework — stage labels TBD in a later UX phase. */
export const INTERNAL_OPPORTUNITY_WORKFLOW_FRAMEWORK = [
  { id: "created", label: "Opportunity created" },
  { id: "discovery", label: "Discovery" },
  { id: "engagement", label: "Client engagement" },
  { id: "documents", label: "Documents / proposal" },
  { id: "quote", label: "Sales quote" },
  { id: "follow-up", label: "Follow-up" },
  { id: "outcome", label: "Outcome" },
] as const;

export function isSalesTabHiddenInInternalOpportunitiesArchitecture(
  tab: SalesManagementTabId,
): boolean {
  return (
    isInternalOpportunitiesArchitectureEnabled() &&
    (INTERNAL_OPPORTUNITIES_ARCHITECTURE_HIDDEN_TABS as readonly string[]).includes(tab)
  );
}

function filterSalesManagementChildren(
  children: InternalNavSection["items"][number]["children"],
): InternalNavSection["items"][number]["children"] {
  if (!children?.length) return children;
  if (!isInternalOpportunitiesArchitectureEnabled()) return children;
  return children.filter(
    (child) =>
      !child.query?.tab ||
      !(INTERNAL_OPPORTUNITIES_ARCHITECTURE_HIDDEN_TABS as readonly string[]).includes(
        child.query.tab,
      ),
  );
}

/** Remove Prospects / Pipeline / Discovery / Activities from Sales Management LHS (internal host). */
export function reshapeSalesManagementNavForInternalOpportunities(
  sections: readonly InternalNavSection[],
): InternalNavSection[] {
  if (!isInternalOpportunitiesArchitectureEnabled()) return [...sections];

  return sections.map((section) => {
    if (section.label !== SALES_MANAGEMENT_MODULE_LABEL) return section;
    return {
      ...section,
      items: section.items.map((item) => {
        if (!item.children?.length) return item;
        const children = filterSalesManagementChildren(item.children);
        return children === item.children ? item : { ...item, children };
      }),
    };
  });
}
