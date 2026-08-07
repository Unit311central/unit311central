/**
 * Settings → General → Sidebar customisation.
 * Reorders high-level LHS modules (workspace sections). Pins (Home / EA) stay fixed;
 * Settings stays last.
 */

import type { InternalNavSection } from "@/lib/internal-operations-data";
import {
  isOnwardAirLockedSectionBundle,
  ONWARDAIR_LOCKED_SECTION_ORDER_KEYS,
} from "@/lib/onwardair-nav-order";
import {
  isTalantonLockedSectionBundle,
  TALANTON_LOCKED_SECTION_ORDER_KEYS,
} from "@/lib/talanton-nav-order";
import { canonicalizeTalantonImpactSlug } from "@/lib/talanton-surface";

export const SIDEBAR_NAV_CUSTOM_STORAGE_KEY = "unit311-nav-custom";
export const SIDEBAR_NAV_CUSTOM_EVENT = "unit311-nav-custom-changed";

const LEGACY_SIDEBAR_NAV_CUSTOM_STORAGE_KEY = SIDEBAR_NAV_CUSTOM_STORAGE_KEY;

/** Host slug for per-workspace sidebar order (Talanton vs OnwardAir vs internal). */
export function resolveSidebarNavWorkspaceSlug(): string {
  if (typeof window === "undefined") return "";
  const host = window.location.hostname.toLowerCase();
  const match = host.match(/^([a-z0-9-]+)\.unit311central\.com$/i);
  if (match?.[1] && !["www", "app", "login"].includes(match[1])) {
    return canonicalizeTalantonImpactSlug(match[1]) ?? match[1];
  }
  if (host.endsWith(".localhost") && host !== "localhost") {
    const slug = host.split(".")[0] || "";
    return canonicalizeTalantonImpactSlug(slug) ?? slug;
  }
  if (host === "internal.unit311central.com" || host === "internal.localhost") return "internal";
  if (host === "demo.unit311central.com" || host === "demo.localhost") return "demo";
  return "";
}

export function sidebarNavCustomStorageKey(workspaceSlug?: string | null): string {
  const slug = (workspaceSlug ?? resolveSidebarNavWorkspaceSlug()).trim().toLowerCase();
  return slug ? `${SIDEBAR_NAV_CUSTOM_STORAGE_KEY}:${slug}` : LEGACY_SIDEBAR_NAV_CUSTOM_STORAGE_KEY;
}

function readSidebarNavCustomRaw(workspaceSlug?: string | null): string | null {
  if (typeof window === "undefined") return null;
  const scopedKey = sidebarNavCustomStorageKey(workspaceSlug);
  return window.localStorage.getItem(scopedKey);
}

function migrateLegacySidebarNavCustom(
  sections: readonly InternalNavSection[],
  workspaceSlug?: string | null,
): string | null {
  if (typeof window === "undefined") return null;
  const slug = (workspaceSlug ?? resolveSidebarNavWorkspaceSlug()).trim().toLowerCase();
  if (!slug) return readSidebarNavCustomRaw();

  const scopedKey = sidebarNavCustomStorageKey(slug);
  const scoped = window.localStorage.getItem(scopedKey);
  if (scoped) return scoped;

  const legacy = window.localStorage.getItem(LEGACY_SIDEBAR_NAV_CUSTOM_STORAGE_KEY);
  if (!legacy) return null;

  try {
    const parsed = JSON.parse(legacy) as Partial<SidebarNavCustomStorage>;
    const storedOrder = parsed.sectionOrder ?? [];
    if (!legacyOrderMatchesWorkspace(storedOrder, sections)) return null;
    window.localStorage.setItem(scopedKey, legacy);
    return legacy;
  } catch {
    return null;
  }
}

/** Skip migrating a shared legacy blob when it clearly belongs to another workspace. */
function legacyOrderMatchesWorkspace(
  storedOrder: readonly string[],
  sections: readonly InternalNavSection[],
): boolean {
  if (storedOrder.length === 0) return true;
  const canonical = defaultSectionOrder(sections);
  if (canonical.length === 0) return true;
  const overlap = storedOrder.filter((key) => canonical.includes(key)).length;
  return overlap >= Math.min(4, Math.ceil(canonical.length * 0.35));
}

export type SidebarNavLeafItem = {
  id: string;
  label: string;
  sectionKey: string;
  parentLabel?: string;
  custom?: boolean;
};

export type SidebarNavCustomStorage = {
  /**
   * v3: reset append-polluted orders.
   * v4: reset to corrected OnwardAir locked LHS order (Tools → External Client Access → Settings).
   * v5: reset to Talanton locked LHS order when Funds / Talanton Intelligence present.
   */
  version: 2 | 3 | 4 | 5;
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
  const movable = sections.filter(isMovableWorkspaceSection).map(getNavSectionKey);
  if (isOnwardAirLockedSectionBundle(sections)) {
    const known = new Set(movable);
    const locked = ONWARDAIR_LOCKED_SECTION_ORDER_KEYS.filter((key) => known.has(key));
    const extras = movable.filter((key) => !locked.includes(key));
    return [...locked, ...extras];
  }
  if (isTalantonLockedSectionBundle(sections)) {
    const known = new Set(movable);
    const locked = TALANTON_LOCKED_SECTION_ORDER_KEYS.filter((key) => known.has(key));
    const extras = movable.filter((key) => !locked.includes(key));
    return [...locked, ...extras];
  }
  return movable;
}

export function emptyNavCustomStorage(sections: readonly InternalNavSection[]): SidebarNavCustomStorage {
  return {
    version: isTalantonLockedSectionBundle(sections) ? 5 : 4,
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

/**
 * Merge for display: apply canonical inserts for the current section set, but keep
 * any stored keys that are temporarily filtered out (grants / host gating) so a
 * later full load does not treat them as brand-new and shove them to defaults.
 */
/** Preserve sidebar order when a host renames a module (e.g. Talanton Business Central → Project Management). */
function migrateRenamedSectionKeys(
  storedOrder: readonly string[],
  canonicalOrder: readonly string[],
): string[] {
  const renames: Record<string, string> = {};
  if (
    canonicalOrder.includes("workspace:Project Management") &&
    !canonicalOrder.includes("workspace:Business Central")
  ) {
    renames["workspace:Business Central"] = "workspace:Project Management";
  }
  if (Object.keys(renames).length === 0) return [...storedOrder];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const key of storedOrder) {
    const next = renames[key] ?? key;
    if (seen.has(next)) continue;
    seen.add(next);
    out.push(next);
  }
  return out;
}

export function resolveSectionOrderForSections(
  storedOrder: readonly string[],
  sections: readonly InternalNavSection[],
): string[] {
  const canonical = defaultSectionOrder(sections);
  const migrated = migrateRenamedSectionKeys(storedOrder, canonical);
  const known = new Set(canonical);
  const active = mergeSectionOrder(
    migrated.filter((key) => known.has(key)),
    canonical,
  );
  const extras = migrated.filter((key) => !known.has(key) && !active.includes(key));
  return [...active, ...extras];
}

export function loadSidebarNavCustom(
  sections: readonly InternalNavSection[],
): SidebarNavCustomStorage {
  const fallback = emptyNavCustomStorage(sections);
  if (typeof window === "undefined") return fallback;

  try {
    const raw = migrateLegacySidebarNavCustom(sections) ?? readSidebarNavCustomRaw();
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<SidebarNavCustomStorage>;
    const canonical = defaultSectionOrder(sections);
    const storedVersion = Number(parsed.version ?? 1);
    const storedOrder = parsed.sectionOrder ?? [];
    const targetVersion = isTalantonLockedSectionBundle(sections) ? 5 : 4;

    if (storedVersion < 4) {
      return {
        version: targetVersion,
        sectionOrder:
          storedOrder.length > 0
            ? resolveSectionOrderForSections(storedOrder, sections)
            : canonical,
        hidden: parsed.hidden ?? {},
        customItems: parsed.customItems ?? [],
        order: parsed.order,
      };
    }

    if (isTalantonLockedSectionBundle(sections) && storedVersion < 5) {
      return {
        version: 5,
        sectionOrder:
          storedOrder.length > 0
            ? resolveSectionOrderForSections(storedOrder, sections)
            : canonical,
        hidden: parsed.hidden ?? {},
        customItems: parsed.customItems ?? [],
        order: parsed.order,
      };
    }

    return {
      version: targetVersion,
      sectionOrder: resolveSectionOrderForSections(storedOrder, sections),
      hidden: parsed.hidden ?? {},
      customItems: parsed.customItems ?? [],
      order: parsed.order,
    };
  } catch {
    return fallback;
  }
}

/**
 * Persist only when storage is missing, needs the v4 locked-order migration, or
 * brand-new module keys must be recorded. Never rewrite the user's order just
 * because the current render filtered a different section subset.
 */
export function reconcileSidebarNavCustom(
  sections: readonly InternalNavSection[],
): SidebarNavCustomStorage {
  const next = loadSidebarNavCustom(sections);
  if (typeof window === "undefined") return next;

  try {
    const raw = migrateLegacySidebarNavCustom(sections) ?? readSidebarNavCustomRaw();
    if (!raw) {
      saveSidebarNavCustom(next);
      return next;
    }
    const parsed = JSON.parse(raw) as Partial<SidebarNavCustomStorage>;
    const storedVersion = Number(parsed.version ?? 1);
    const targetVersion = isTalantonLockedSectionBundle(sections) ? 5 : 4;
    if (storedVersion < 4 || (isTalantonLockedSectionBundle(sections) && storedVersion < 5)) {
      saveSidebarNavCustom(next);
      return next;
    }

    const canonical = defaultSectionOrder(sections);
    const prev = parsed.sectionOrder ?? [];
    const missingKeys = canonical.some((key) => !prev.includes(key));
    if (!missingKeys) return next;

    const mergedActive = mergeSectionOrder(prev, canonical);
    const extras = prev.filter((key) => !mergedActive.includes(key));
    const payload: SidebarNavCustomStorage = {
      version: targetVersion,
      sectionOrder: [...mergedActive, ...extras],
      hidden: parsed.hidden ?? {},
      customItems: parsed.customItems ?? [],
    };
    saveSidebarNavCustom(payload);
    return payload;
  } catch {
    return next;
  }
}

export function saveSidebarNavCustom(next: SidebarNavCustomStorage) {
  if (typeof window === "undefined") return;
  const payload: SidebarNavCustomStorage = {
    version: next.version,
    sectionOrder: next.sectionOrder,
    hidden: next.hidden,
    customItems: next.customItems,
  };
  window.localStorage.setItem(sidebarNavCustomStorageKey(), JSON.stringify(payload));
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
