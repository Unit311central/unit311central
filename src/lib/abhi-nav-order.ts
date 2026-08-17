/**
 * Factory-default ABHI LHS workspace module order.
 * Used for new users until they reorder in Settings → General → Sidebar.
 * Pins (Home, Executive Assistant) and Settings are fixed by the shell — not listed here.
 *
 * DO NOT change this list unless the user explicitly asks in chat
 * or they change it themselves via Settings → General → Sidebar reorder.
 */

export const ABHI_LOCKED_WORKSPACE_SECTION_ORDER = [
  "Business Central",
  "ABHI Intelligence",
  "Financials",
  "Human Resources",
  "Marketing & Events",
  "Corporate Information",
  "Board",
  "Operations",
  "Technology Management",
  "Business Productivity",
  "Support Desk",
  "Project Management",
  "Training",
  "QMS",
  "Tools",
  "External Client Access",
] as const;

export type AbhiLockedWorkspaceSection = (typeof ABHI_LOCKED_WORKSPACE_SECTION_ORDER)[number];

export const ABHI_LOCKED_SECTION_ORDER_KEYS: readonly string[] =
  ABHI_LOCKED_WORKSPACE_SECTION_ORDER.map((label) => `workspace:${label}`);

/** Bump when factory ABHI sidebar order changes — one-time reset for non-customized storage only. */
export const ABHI_SIDEBAR_FACTORY_REVISION = 9;

export function isAbhiLockedSectionBundle(
  sections: readonly { kind?: string; label?: string | null }[],
): boolean {
  return sections.some((section) => section.label === "ABHI Intelligence");
}
