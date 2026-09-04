import type { InternalNavItem, InternalNavSection } from "@/lib/internal-operations-data";

export const PROJECT_MANAGEMENT_MODULE_LABEL = "Project Management";

const DEFAULT_PROJECT_MANAGEMENT_COLOR = "#2563EB";

/** Shared top-level Project Management module (nav-only; view IDs unchanged). */
export function buildProjectManagementNavSection(options?: {
  color?: string;
  icon?: string;
  includeGrants?: boolean;
  includeWorkPackages?: boolean;
}): InternalNavSection {
  const items: InternalNavItem[] = [
    { label: "Dashboard", icon: "LayoutDashboard", view: "projects-dashboard" },
    { label: "Internal Projects", icon: "FolderKanban", view: "projects-internal" },
    { label: "External Projects", icon: "FolderOpen", view: "projects-external" },
  ];

  if (options?.includeWorkPackages) {
    items.push({
      label: "Work Packages",
      icon: "ClipboardList",
      view: "internal-work-packages",
    });
  }

  if (options?.includeGrants) {
    items.push({ label: "Grants", icon: "ScrollText", view: "grants" });
  }

  return {
    kind: "workspace",
    label: PROJECT_MANAGEMENT_MODULE_LABEL,
    icon: options?.icon ?? "FolderKanban",
    color: options?.color ?? DEFAULT_PROJECT_MANAGEMENT_COLOR,
    items,
  };
}

/** Remove nested Projects / PM children from Business Central (no data or view ID changes). */
export function stripProjectsFromBusinessCentral(section: InternalNavSection): InternalNavSection {
  return {
    ...section,
    items: section.items
      .filter(
        (item) =>
          item.label !== "Projects" && item.label !== PROJECT_MANAGEMENT_MODULE_LABEL,
      )
      .map((item) => {
        if (!item.children?.length) return item;
        return {
          ...item,
          children: item.children.filter(
            (child) =>
              child.view !== "projects-dashboard" &&
              child.view !== "projects-internal" &&
              child.view !== "projects-external" &&
              child.view !== "grants" &&
              !child.view?.startsWith("projects"),
          ),
        };
      }),
  };
}
