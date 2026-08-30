import type { InternalNavSection } from "@/lib/internal-operations-data";
import { isQaEnabledWorkspaceSlug } from "@/lib/qa-workspace/surface";

function injectQaTasksNavItem(section: InternalNavSection): InternalNavSection {
  const hasQaTasks = section.items.some((item) => item.view === "qa-tasks");
  if (hasQaTasks) return section;
  return {
    ...section,
    items: [
      ...section.items,
      {
        label: "QA Tasks",
        icon: "ClipboardList",
        view: "qa-tasks" as const,
      },
    ],
  };
}

/** Inject QA Tasks under Tools for QA-enabled workspaces (Test + InterfaceWorx beta). */
export function injectQaWorkspaceNav(
  sections: readonly InternalNavSection[],
  workspaceSlug: string | null | undefined,
): InternalNavSection[] {
  if (!isQaEnabledWorkspaceSlug(workspaceSlug)) return [...sections];

  return sections.map((section) => {
    if (section.kind !== "workspace" || section.label !== "Tools") return section;
    return injectQaTasksNavItem(section);
  });
}

/** @deprecated Use injectQaWorkspaceNav */
export function injectTestWorkspaceQaNav(
  sections: readonly InternalNavSection[],
  workspaceSlug: string | null | undefined,
): InternalNavSection[] {
  return injectQaWorkspaceNav(sections, workspaceSlug);
}
