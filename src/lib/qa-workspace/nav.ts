import type { InternalNavSection } from "@/lib/internal-operations-data";
import { isTestWorkspaceSlug } from "@/lib/qa-workspace/surface";

/** Inject QA Tasks under Tools for the dedicated Test workspace only. */
export function injectTestWorkspaceQaNav(
  sections: readonly InternalNavSection[],
  workspaceSlug: string | null | undefined,
): InternalNavSection[] {
  if (!isTestWorkspaceSlug(workspaceSlug)) return [...sections];

  return sections.map((section) => {
    if (section.kind !== "workspace" || section.label !== "Tools") return section;
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
  });
}
