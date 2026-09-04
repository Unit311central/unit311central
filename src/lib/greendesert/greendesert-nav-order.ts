/**
 * Factory-default Green Desert LHS workspace module order.
 * Intelligence first until the user reorders in Settings → General → Sidebar.
 */

export const GREENDESERT_LOCKED_WORKSPACE_SECTION_ORDER = [
  "GREENDESERT INTELLIGENCE",
  "Sales Management",
  "Finances",
  "Fundraising",
  "Board",
  "Corporate Information",
  "Operations",
  "Marketing & Events",
  "Technology Management",
  "Human Resources",
  "Business Productivity",
  "Support Desk",
  "Tools",
  "External Client Access",
] as const;

export const GREENDESERT_LOCKED_SECTION_ORDER_KEYS: readonly string[] =
  GREENDESERT_LOCKED_WORKSPACE_SECTION_ORDER.map((label) => `workspace:${label}`);

/** Bump when factory Green Desert sidebar order changes — one-time reset for non-customized storage. */
export const GREENDESERT_SIDEBAR_FACTORY_REVISION = 10;

export function isGreenDesertLockedSectionBundle(
  sections: readonly { kind?: string; label?: string | null }[],
): boolean {
  return sections.some((section) => section.label === "GREENDESERT INTELLIGENCE");
}
