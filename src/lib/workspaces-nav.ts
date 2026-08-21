import type { InternalNavSection } from "@/lib/internal-operations-data";

export const WORKSPACES_MODULE_LABEL = "Workspaces";

const DEFAULT_WORKSPACES_COLOR = "#0EA5E9";

/** Top-level Workspaces module — internal Central administration shell (Phase 1). */
export function buildWorkspacesNavSection(options?: {
  color?: string;
  icon?: string;
}): InternalNavSection {
  return {
    kind: "workspace",
    label: WORKSPACES_MODULE_LABEL,
    icon: options?.icon ?? "Boxes",
    color: options?.color ?? DEFAULT_WORKSPACES_COLOR,
    items: [
      {
        label: "Workspace Overview",
        icon: "LayoutDashboard",
        view: "workspaces-overview",
      },
      {
        label: "New Workspace",
        icon: "PlusCircle",
        view: "workspaces-new",
      },
    ],
  };
}
