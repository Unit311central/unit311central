import { isDemoWorkspaceSlug } from "@/lib/demo/read-only";
import type { InternalNavSection } from "@/lib/internal-operations-data";

/** Demo-only group under Tools. The heading has no view, so it does not navigate. */
export function injectDemoAttendanceNav(
  sections: readonly InternalNavSection[],
  workspaceSlug: string | null | undefined,
): InternalNavSection[] {
  if (!isDemoWorkspaceSlug(workspaceSlug)) return [...sections];

  return sections.map((section) => {
    if (section.kind !== "workspace" || section.label !== "Tools") return section;
    if (section.items.some((item) => item.label === "ATTENDANCE" || item.label === "Attendance")) {
      return section;
    }
    return {
      ...section,
      items: [
        ...section.items,
        {
          label: "ATTENDANCE",
          icon: "Users",
          children: [
            { label: "Dashboard", view: "attendance-dashboard" as const },
            { label: "Employees", view: "attendance-employees" as const },
            { label: "Test", view: "attendance-test" as const },
          ],
        },
      ],
    };
  });
}
