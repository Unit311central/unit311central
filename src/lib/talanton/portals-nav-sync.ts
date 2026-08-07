import type {
  InternalNavChildItem,
  InternalNavItem,
  InternalNavSection,
} from "@/lib/internal-operations-data";
import { getTalantonImpactNavSections } from "@/lib/internal-role-views";

import type { PortalsIndent, PortalsModuleRow } from "@/lib/talanton/portals-demo";

const PIN_DISPLAY_LABELS: Record<string, string> = {
  HOME: "Home dashboard",
  "EXECUTIVE ASSISTANT": "AI Executive Assistant",
};

function slugPart(text: string): string {
  return text.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "item";
}

function nextIndent(indent: PortalsIndent): PortalsIndent {
  if (indent >= 2) return 2;
  return (indent + 1) as PortalsIndent;
}

function flattenChildItems(
  items: readonly InternalNavChildItem[],
  indent: PortalsIndent,
  idPrefix: string,
  out: PortalsModuleRow[],
): void {
  items.forEach((item, index) => {
    const id = `${idPrefix}-${slugPart(item.label)}-${index}`;
    out.push({ id, text: item.label, indent });
    if (item.children?.length) {
      flattenChildItems(item.children, nextIndent(indent), id, out);
    }
  });
}

function flattenNavItem(
  item: InternalNavItem,
  indent: PortalsIndent,
  idPrefix: string,
  out: PortalsModuleRow[],
): void {
  const id = `${idPrefix}-${slugPart(item.label)}`;
  out.push({ id, text: item.label, indent });
  if (item.children?.length) {
    flattenChildItems(item.children, nextIndent(indent), id, out);
  }
}

function flattenNavSection(
  section: InternalNavSection,
  sectionIndex: number,
  out: PortalsModuleRow[],
): void {
  if (section.kind === "pin") {
    section.items.forEach((item, itemIndex) => {
      out.push({
        id: `pin-${sectionIndex}-${itemIndex}`,
        text: PIN_DISPLAY_LABELS[item.label] ?? item.label,
        indent: 0,
      });
    });
    return;
  }

  if (!section.label) return;

  const sectionId = `ws-${slugPart(section.label)}`;
  out.push({ id: sectionId, text: section.label, indent: 0 });
  section.items.forEach((item, itemIndex) => {
    flattenNavItem(item, 1, `${sectionId}-${itemIndex}`, out);
  });
}

/** Major Modules column — mirrors the Talanton customer sidebar order and nesting. */
export function buildTalantonPortalsMajorModules(): PortalsModuleRow[] {
  const sections = getTalantonImpactNavSections();
  const out: PortalsModuleRow[] = [];
  sections.forEach((section, index) => flattenNavSection(section, index, out));
  return out;
}
