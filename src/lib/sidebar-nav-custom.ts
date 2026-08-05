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
  /** v3: one-time reset of append-polluted v2 sectionOrder to canonical defaults. */
  version: 2 | 3;
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
    version: 3,
    sectionOrder: defaultSectionOrder(sections),
    hidden: {},
    customItems: [],
  };
}

/**
 * Keep the user's relative order for known keys; slot newly added modules at their
 * canonical position (beside nearest neighbors) instead of always appending.
 */
export function mergeSectionOrder(
  storedOrder: readonly string[],
  canonicalOrder: readonly string[],
): string[] {
  const known = new Set(canonicalOrder);
  const stored = storedOrder.filter((key) => known.has(key));
  if (stored.length === 0) return [...canonicalOrder];

  const result = [...stored];
  for (const key of canonicalOrder) {
    if (result.includes(key)) continue;
    const canonIdx = canonicalOrder.indexOf(key);
    let insertAt = result.length;
    for (let i = canonIdx - 1; i >= 0; i--) {
      const at = result.indexOf(canonicalOrder[i]!);
      if (at >= 0) {
        insertAt = at + 1;
        break;
      }
    }
    if (insertAt === result.length) {
      for (let i = canonIdx + 1; i < canonicalOrder.length; i++) {
        const at = result.indexOf(canonicalOrder[i]!);
        if (at >= 0) {
          insertAt = at;
          break;
        }
      }
    }
    result.splice(insertAt, 0, key);
  }
  return result;
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
    const canonical = defaultSectionOrder(sections);
    const known = new Set(canonical);
    const storedVersion = Number(parsed.version ?? 1);

    // v2 and earlier appended brand-new modules at the end whenever OA nav
    // grew — that permanently scrambled custom order. Reset once to canonical.
    if (storedVersion < 3) {
      return {
        version: 3,
        sectionOrder: canonical,
        hidden: parsed.hidden ?? {},
        customItems: parsed.customItems ?? [],
        order: parsed.order,
      };
    }

    const fromStored = (parsed.sectionOrder ?? []).filter((key) => known.has(key));
    return {
      version: 3,
      sectionOrder: mergeSectionOrder(fromStored, canonical),
      hidden: parsed.hidden ?? {},
      customItems: parsed.customItems ?? [],
      order: parsed.order,
    };
  } catch {
    return fallback;
  }
}

/**
 * Load merged order and persist when storage is stale (new modules, removed keys,
 * or previous append-at-end merge). Safe to call from useEffect — not during render.
 */
export function reconcileSidebarNavCustom(
  sections: readonly InternalNavSection[],
): SidebarNavCustomStorage {
  const next = loadSidebarNavCustom(sections);
  if (typeof window === "undefined") return next;

  try {
    const raw = window.localStorage.getItem(SIDEBAR_NAV_CUSTOM_STORAGE_KEY);
    if (!raw) {
      saveSidebarNavCustom(next);
      return next;
    }
    const parsed = JSON.parse(raw) as Partial<SidebarNavCustomStorage>;
    const known = new Set(defaultSectionOrder(sections));
    const prev = parsed.sectionOrder ?? [];
    const versionStale = Number(parsed.version ?? 1) < 3;
    const staleKeys = prev.some((key) => !known.has(key));
    const missingKeys = [...known].some((key) => !prev.includes(key));
    const orderChanged =
      prev.length !== next.sectionOrder.length ||
      next.sectionOrder.some((key, index) => prev[index] !== key);
    if (versionStale || staleKeys || missingKeys || orderChanged) {
      saveSidebarNavCustom(next);
    }
  } catch {
    saveSidebarNavCustom(next);
  }
  return next;
}

export function saveSidebarNavCustom(next: SidebarNavCustomStorage) {
  if (typeof window === "undefined") return;
  const payload: SidebarNavCustomStorage = {
    version: 3,
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
