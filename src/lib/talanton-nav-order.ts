/**
 * Factory-default Talanton Impact LHS workspace module order.
 * Used for new users until they reorder in Settings → General → Sidebar.
 * DO NOT change unless the owner explicitly asks in chat.
 */

export const TALANTON_LOCKED_WORKSPACE_SECTION_ORDER = [
  "Funds",
  "Portfolio Companies",
  "Talanton Intelligence",
  "Marketing & Stories",
  "Board",
  "Financials",
  "Project Management",
  "Corporate Information",
  "Human Resources",
  "Technology Management",
  "Business Productivity",
  "Support Desk",
  "Training",
  "Tools",
] as const;

export type TalantonLockedWorkspaceSection =
  (typeof TALANTON_LOCKED_WORKSPACE_SECTION_ORDER)[number];

export const TALANTON_LOCKED_SECTION_ORDER_KEYS: readonly string[] =
  TALANTON_LOCKED_WORKSPACE_SECTION_ORDER.map((label) => `workspace:${label}`);

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
