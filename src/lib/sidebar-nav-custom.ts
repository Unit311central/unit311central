/**
 * Settings → General → Sidebar customisation.
 * Reorders high-level LHS modules (workspace sections). Pins (Home / EA) stay fixed;
 * Settings stays last.
 */

import type { InternalNavSection } from "@/lib/internal-operations-data";

export const SIDEBAR_NAV_CUSTOM_STORAGE_KEY = "unit311-nav-custom";
export const SIDEBAR_NAV_CUSTOM_EVENT = "unit311-nav-custom-changed";

export type SidebarNavLeafItem = {
  id: string;
  label: string;
  sectionKey: string;
  parentLabel?: string;
  custom?: boolean;
};

export type SidebarNavCustomStorage = {
  version: 2;
  /** Ordered workspace section keys (excludes fixed pins + Settings). */
  sectionOrder: string[];
  hidden: Record<string, boolean>;
  customItems: SidebarNavLeafItem[];
  /** Legacy flat item order — kept for migration / ignored for section sort. */
  order?: string[];
};

export function getNavSectionKey(section: InternalNavSection): string {
  if (section.kind === "pin") {
    const first = section.items[0];
    return `pin:${first?.view ?? first?.label ?? "pin"}`;
  }
  return `workspace:${section.label ?? "untitled"}`;
}

export function getNavSectionTitle(section: InternalNavSection): string {
  if (section.kind === "pin") {
    return section.items[0]?.label ?? "Pinned";
  }
  return section.label ?? "Untitled";
}

export function isFixedPinSection(section: InternalNavSection): boolean {
  const key = getNavSectionKey(section);
  return key === "pin:home" || key === "pin:executive-assistant";
}

export function isSettingsSection(section: InternalNavSection): boolean {
  return getNavSectionKey(section) === "workspace:Settings";
}

export function isMovableWorkspaceSection(section: InternalNavSection): boolean {
  return section.kind !== "pin" && !isSettingsSection(section);
}

export function defaultSectionOrder(sections: readonly InternalNavSection[]): string[] {
  return sections.filter(isMovableWorkspaceSection).map(getNavSectionKey);
}

export function emptyNavCustomStorage(sections: readonly InternalNavSection[]): SidebarNavCustomStorage {
  return {
    version: 2,
    sectionOrder: defaultSectionOrder(sections),
    hidden: {},
    customItems: [],
  };
}

export function loadSidebarNavCustom(
  sections: readonly InternalNavSection[],
): SidebarNavCustomStorage {
  const fallback = emptyNavCustomStorage(sections);
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(SIDEBAR_NAV_CUSTOM_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<SidebarNavCustomStorage>;
    const known = new Set(defaultSectionOrder(sections));
    const fromStored = (parsed.sectionOrder ?? []).filter((key) => known.has(key));
    const missing = [...known].filter((key) => !fromStored.includes(key));
    return {
      version: 2,
      sectionOrder: [...fromStored, ...missing],
      hidden: parsed.hidden ?? {},
      customItems: parsed.customItems ?? [],
      order: parsed.order,
    };
  } catch {
    return fallback;
  }
}

export function saveSidebarNavCustom(next: SidebarNavCustomStorage) {
  if (typeof window === "undefined") return;
  const payload: SidebarNavCustomStorage = {
    version: 2,
    sectionOrder: next.sectionOrder,
    hidden: next.hidden,
    customItems: next.customItems,
  };
  window.localStorage.setItem(SIDEBAR_NAV_CUSTOM_STORAGE_KEY, JSON.stringify(payload));
  window.dispatchEvent(new CustomEvent(SIDEBAR_NAV_CUSTOM_EVENT));
}

/** Reorder movable workspace sections; pins stay first, Settings stays last. */
export function applySidebarSectionOrder(
  sections: readonly InternalNavSection[],
  sectionOrder: readonly string[],
): InternalNavSection[] {
  const pins: InternalNavSection[] = [];
  const movable: InternalNavSection[] = [];
  let settings: InternalNavSection | null = null;

  for (const section of sections) {
    if (isFixedPinSection(section) || section.kind === "pin") {
      pins.push(section);
      continue;
    }
    if (isSettingsSection(section)) {
      settings = section;
      continue;
    }
    movable.push(section);
  }

  const byKey = new Map(movable.map((section) => [getNavSectionKey(section), section]));
  const ordered: InternalNavSection[] = [];
  for (const key of sectionOrder) {
    const section = byKey.get(key);
    if (section) {
      ordered.push(section);
      byKey.delete(key);
    }
  }
  for (const section of byKey.values()) ordered.push(section);

  return [...pins, ...ordered, ...(settings ? [settings] : [])];
}

export function listSectionLeafItems(section: InternalNavSection): SidebarNavLeafItem[] {
  const sectionKey = getNavSectionKey(section);
  const sectionLabel = getNavSectionTitle(section);
  const leaves: SidebarNavLeafItem[] = [];

  for (const item of section.items) {
    if (item.children?.length) {
      for (const child of item.children) {
        if (child.children?.length) {
          for (const nested of child.children) {
            leaves.push({
              id: `nav-${sectionLabel}-${item.label}-${child.label}-${nested.label}`,
              label: nested.label,
              sectionKey,
              parentLabel: `${item.label} › ${child.label}`,
            });
          }
        } else {
          leaves.push({
            id: `nav-${sectionLabel}-${item.label}-${child.label}`,
            label: child.label,
            sectionKey,
            parentLabel: item.label,
          });
        }
      }
    } else {
      leaves.push({
        id: `nav-${sectionLabel}-${item.label}`,
        label: item.label,
        sectionKey,
      });
    }
  }

  return leaves;
}
