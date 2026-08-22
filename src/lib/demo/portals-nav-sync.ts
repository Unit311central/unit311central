import { DEMO_WORKSPACE_SLUG } from "@/lib/app-domains";
import type { PortalsIndent, PortalsModuleRow } from "@/lib/demo/portals-demo";
import type {
  InternalNavChildItem,
  InternalNavItem,
  InternalNavSection,
} from "@/lib/internal-operations-data";
import { filterInternalNavSectionsForDemoSurface } from "@/lib/internal-role-views";
import { resolveWorkspaceNavBaseSections } from "@/lib/platform-workspaces/workspace-nav-resolver";
import { resolveWorkspaceNavEnablement } from "@/lib/platform-workspaces/workspace-product-nav";
import {
  applySidebarSectionOrder,
  defaultSectionOrder,
} from "@/lib/sidebar-nav-custom";

const PIN_DISPLAY_LABELS: Record<string, string> = {
  HOME: "Home dashboard",
  "EXECUTIVE ASSISTANT": "Executive Assistant",
};

function slugPart(text: string): string {
  return text.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "item";
}

function nextIndent(indent: PortalsIndent): PortalsIndent {
  if (indent >= 3) return 3;
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

/** Major Modules column — mirrors the Northstar demo sidebar order and nesting. */
export function buildDemoPortalsMajorModules(): PortalsModuleRow[] {
  const enablement = resolveWorkspaceNavEnablement({
    workspaceSlug: DEMO_WORKSPACE_SLUG,
    workspaceType: "Demo",
  });
  const base = resolveWorkspaceNavBaseSections({
    workspaceSlug: DEMO_WORKSPACE_SLUG,
    workspaceType: "Demo",
    enablement,
  });
  const filtered = filterInternalNavSectionsForDemoSurface(base, {
    allowHostSurfaces: false,
  });
  const sections = filtered;
  const ordered = applySidebarSectionOrder(sections, {
    sectionOrder: defaultSectionOrder(sections),
    customized: false,
  });
  const out: PortalsModuleRow[] = [];
  ordered.forEach((section, index) => flattenNavSection(section, index, out));
  return out;
}
