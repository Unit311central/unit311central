/**
 * Factory-default Talanton Impact LHS workspace module order.
 * Used for new users until they reorder in Settings → General → Sidebar.
 * Pins (Home, Executive Assistant) and Settings are fixed by the shell — not listed here.
 *
 * Owner order (Aug 2026):
 * Talanton Intelligence → Portfolio Companies → Board → Marketing & Stories → Training →
 * Corporate Information → Funds → Financials → Project Management → Human Resources →
 * Business Productivity → Operations → Technology Management → Support Desk → Tools →
 * External Client Access
 */

export const TALANTON_LOCKED_WORKSPACE_SECTION_ORDER = [
  "Talanton Intelligence",
  "Portfolio Companies",
  "Board",
  "Marketing & Stories",
  "Training",
  "Corporate Information",
  "Funds",
  "Financials",
  "Project Management",
  "Human Resources",
  "Business Productivity",
  "Operations",
  "Technology Management",
  "Support Desk",
  "Tools",
  "External Client Access",
] as const;

export type TalantonLockedWorkspaceSection =
  (typeof TALANTON_LOCKED_WORKSPACE_SECTION_ORDER)[number];

export const TALANTON_LOCKED_SECTION_ORDER_KEYS: readonly string[] =
  TALANTON_LOCKED_WORKSPACE_SECTION_ORDER.map((label) => `workspace:${label}`);

/** Bump when factory Talanton sidebar order changes — forces one-time localStorage reset. */
export const TALANTON_SIDEBAR_FACTORY_REVISION = 8;

export function isTalantonLockedSectionBundle(
  sections: readonly { kind?: string; label?: string | null }[],
): boolean {
  return sections.some(
    (section) =>
      section.label === "Funds" ||
      section.label === "Talanton Intelligence" ||
      section.label === "Marketing & Stories",
  );
}

