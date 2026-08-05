/**
 * Locked OnwardAir LHS workspace module order.
 * Captured from production Settings reorder (2026-08-05).
 *
 * DO NOT change this list unless the user explicitly asks in chat
 * or they change it themselves via Settings → General → Sidebar reorder.
 */

export const ONWARDAIR_LOCKED_WORKSPACE_SECTION_ORDER = [
  "Business Central",
  "Project Management",
  "OnwardAir Intelligence",
  "Financials",
  "Fundraising",
  "Human Resources",
  "Corporate Information",
  "Board",
  "Technology Management",
  "Business Productivity",
  "Support Desk",
  "Marketing & Events",
  "Operations",
  "Engineering",
  "Training",
  "QMS",
  "Tools",
  "External Client Access",
] as const;

export type OnwardAirLockedWorkspaceSection =
  (typeof ONWARDAIR_LOCKED_WORKSPACE_SECTION_ORDER)[number];

export const ONWARDAIR_LOCKED_SECTION_ORDER_KEYS: readonly string[] =
  ONWARDAIR_LOCKED_WORKSPACE_SECTION_ORDER.map((label) => `workspace:${label}`);

export function isOnwardAirLockedSectionBundle(
  sections: readonly { kind?: string; label?: string | null }[],
): boolean {
  return sections.some(
    (section) =>
      section.label === "OnwardAir Intelligence" ||
      section.label === "Fundraising" ||
      section.label === "Board" ||
      section.label === "Engineering",
  );
}
