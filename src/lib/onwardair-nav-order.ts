/**
 * Locked OnwardAir LHS workspace module order.
 * Source of truth: user screenshot / Settings layout (2026-08-05).
 *
 * DO NOT change this list unless the user explicitly asks in chat
 * or they change it themselves via Settings → General → Sidebar reorder.
 *
 * Tail must remain: Tools → External Client Access → Settings (Settings is fixed last in the shell).
 */

export const ONWARDAIR_LOCKED_WORKSPACE_SECTION_ORDER = [
  "Business Central",
  "Sales Management",
  "OnwardAir Intelligence",
  "Financials",
  "Fundraising",
  "Board",
  "Corporate Information",
  "Operations",
  "Marketing & Events",
  "Technology Management",
  "Human Resources",
  "Business Productivity",
  "Support Desk",
  "Project Management",
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
