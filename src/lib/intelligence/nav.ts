import type { InternalNavSection, InternalOperationsView } from "@/lib/internal-operations-data";
import { getIntelligencePackBySlug } from "@/lib/intelligence/registry";

/**
 * Inject intelligence navigation from the central registry when a workspace pack
 * exists but the host nav has not already declared intelligence views.
 */
export function injectIntelligenceNavIfMissing(
  sections: readonly InternalNavSection[],
  workspaceSlug: string,
): InternalNavSection[] {
  const pack = getIntelligencePackBySlug(workspaceSlug);
  if (!pack) return [...sections];

  const registeredViews = new Set<string>();
  for (const domain of pack.domains) {
    for (const viewId of domain.navViews ?? []) registeredViews.add(viewId);
  }
  for (const registration of pack.uiViews ?? []) {
    registeredViews.add(registration.viewId);
  }

  const alreadyPresent = sections.some((section) =>
    section.items.some((item) => {
      if (item.view && registeredViews.has(item.view)) return true;
      return item.children?.some((child) => child.view && registeredViews.has(child.view));
    }),
  );
  if (alreadyPresent) return [...sections];

  const intelligenceSection: InternalNavSection = {
    kind: "workspace",
    label: pack.label,
    icon: "Brain",
    color: "#7C3AED",
    items: pack.domains.map((domain) => {
      const primaryView = (domain.navViews?.[0] ?? `intelligence-${domain.id}`) as InternalOperationsView;
      return {
        label: domain.label,
        icon: "Radar",
        view: primaryView,
      };
    }),
  };

  const pinSections = sections.filter((section) => section.kind === "pin");
  const rest = sections.filter((section) => section.kind !== "pin");
  return [...pinSections, intelligenceSection, ...rest];
}
