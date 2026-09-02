/**
 * Settings → General → Sidebar customisation.
 * Reorders high-level LHS modules (workspace sections). Pins (Home / EA) stay fixed;
 * Settings stays last.
 *
 * Talanton / OnwardAir / ABHI factory order lives in *-nav-order.ts and is used only until
 * the user reorders in Settings (`customized: true`). After that, stored order wins.
 */

import { DEMO_WORKSPACE_SLUG } from "@/lib/app-domains";
import type { InternalNavSection } from "@/lib/internal-operations-data";
import {
  ABHI_LOCKED_SECTION_ORDER_KEYS,
  ABHI_SIDEBAR_FACTORY_REVISION,
  isAbhiLockedSectionBundle,
} from "@/lib/abhi-nav-order";
import {
  isOnwardAirLockedSectionBundle,
  ONWARDAIR_LOCKED_SECTION_ORDER_KEYS,
} from "@/lib/onwardair-nav-order";
import {
  isTalantonLockedSectionBundle,
  TALANTON_LOCKED_SECTION_ORDER_KEYS,
  TALANTON_SIDEBAR_FACTORY_REVISION,
} from "@/lib/talanton-nav-order";
import { canonicalizeTalantonImpactSlug } from "@/lib/talanton-surface";
import { canonicalizeWolfCentralSlug, WOLF_CENTRAL_SLUG } from "@/lib/wolf/wolf-surface";

export const SIDEBAR_NAV_CUSTOM_STORAGE_KEY = "unit311-nav-custom";
export const SIDEBAR_NAV_CUSTOM_EVENT = "unit311-nav-custom-changed";

const LEGACY_SIDEBAR_NAV_CUSTOM_STORAGE_KEY = SIDEBAR_NAV_CUSTOM_STORAGE_KEY;

function isLockedHostSectionBundle(
  sections: readonly { kind?: string; label?: string | null }[],
): boolean {
  return (
    isTalantonLockedSectionBundle(sections) ||
    isOnwardAirLockedSectionBundle(sections) ||
    isAbhiLockedSectionBundle(sections)
  );
}

function targetStorageVersion(sections: readonly InternalNavSection[]): 4 | 6 | 7 | 8 | 9 {
  if (isTalantonLockedSectionBundle(sections)) return TALANTON_SIDEBAR_FACTORY_REVISION;
  if (isAbhiLockedSectionBundle(sections)) return ABHI_SIDEBAR_FACTORY_REVISION;
  if (isOnwardAirLockedSectionBundle(sections)) return 6;
  return 4;
}

function abhiFactorySectionOrder(sections: readonly InternalNavSection[]): string[] {
  const movable = sections.filter(isMovableWorkspaceSection).map(getNavSectionKey);
  const known = new Set(movable);
  const locked = ABHI_LOCKED_SECTION_ORDER_KEYS.filter((key) => known.has(key));
  const extras = movable.filter((key) => !locked.includes(key));
  return [...locked, ...extras];
}

/** Owner factory order — only for non-customized storage when factory revision bumps. */
function abhiFactoryNavCustom(
  sections: readonly InternalNavSection[],
  parsed: Partial<SidebarNavCustomStorage>,
): SidebarNavCustomStorage {
  return {
    version: ABHI_SIDEBAR_FACTORY_REVISION,
    customized: false,
    sectionOrder: abhiFactorySectionOrder(sections),
    hidden: parsed.hidden ?? {},
    customItems: parsed.customItems ?? [],
    order: parsed.order,
  };
}

function talantonFactorySectionOrder(sections: readonly InternalNavSection[]): string[] {
  const movable = sections.filter(isMovableWorkspaceSection).map(getNavSectionKey);
  const known = new Set(movable);
  const locked = TALANTON_LOCKED_SECTION_ORDER_KEYS.filter((key) => known.has(key));
  const extras = movable.filter((key) => !locked.includes(key));
  return [...locked, ...extras];
}

/** Owner factory order — wipes polluted localStorage on Talanton. */
function talantonFactoryNavCustom(
  sections: readonly InternalNavSection[],
  parsed: Partial<SidebarNavCustomStorage>,
): SidebarNavCustomStorage {
  return {
    version: TALANTON_SIDEBAR_FACTORY_REVISION,
    customized: false,
    sectionOrder: talantonFactorySectionOrder(sections),
    hidden: parsed.hidden ?? {},
    customItems: parsed.customItems ?? [],
    order: parsed.order,
  };
}

/** Normalize host/subdomain aliases to workspace tenancy slugs for sidebar storage. */
export function canonicalizeSidebarNavWorkspaceSlug(slug: string | null | undefined): string {
  const normalized = String(slug ?? "").trim().toLowerCase();
  if (!normalized) return "";
  return (
    canonicalizeWolfCentralSlug(normalized) ??
    canonicalizeTalantonImpactSlug(normalized) ??
    normalized
  );
}

/** Host slug for per-workspace sidebar order (Talanton vs OnwardAir vs internal). */
export function resolveSidebarNavWorkspaceSlug(): string {
  if (typeof window === "undefined") return "";
  const host = window.location.hostname.toLowerCase();
  const match = host.match(/^([a-z0-9-]+)\.unit311central\.com$/i);
  if (match?.[1] && !["www", "app", "login"].includes(match[1])) {
    return canonicalizeSidebarNavWorkspaceSlug(match[1]);
  }
  if (host.endsWith(".localhost") && host !== "localhost") {
    const slug = host.split(".")[0] || "";
    return canonicalizeSidebarNavWorkspaceSlug(slug);
  }
  if (host === "internal.unit311central.com" || host === "internal.localhost") return "internal";
  if (host === "demo.unit311central.com" || host === "demo.localhost") return DEMO_WORKSPACE_SLUG;
  return "";
}

export function sidebarNavCustomStorageKey(workspaceSlug?: string | null): string {
  const slug = canonicalizeSidebarNavWorkspaceSlug(
    workspaceSlug ?? resolveSidebarNavWorkspaceSlug(),
  );
  return slug ? `${SIDEBAR_NAV_CUSTOM_STORAGE_KEY}:${slug}` : LEGACY_SIDEBAR_NAV_CUSTOM_STORAGE_KEY;
}

function readSidebarNavCustomRaw(workspaceSlug?: string | null): string | null {
  if (typeof window === "undefined") return null;
  const slug = canonicalizeSidebarNavWorkspaceSlug(
    workspaceSlug ?? resolveSidebarNavWorkspaceSlug(),
  );
  const scopedKey = sidebarNavCustomStorageKey(slug);
  const scoped = window.localStorage.getItem(scopedKey);
  if (scoped) return scoped;

  if (slug === WOLF_CENTRAL_SLUG) {
    const aliasKey = `${SIDEBAR_NAV_CUSTOM_STORAGE_KEY}:wolf`;
    const alias = window.localStorage.getItem(aliasKey);
    if (alias) {
      window.localStorage.setItem(scopedKey, alias);
      window.localStorage.removeItem(aliasKey);
      return alias;
    }
  }

  return null;
}

function migrateLegacySidebarNavCustom(
  sections: readonly InternalNavSection[],
  workspaceSlug?: string | null,
): string | null {
  if (typeof window === "undefined") return null;
  const slug = canonicalizeSidebarNavWorkspaceSlug(workspaceSlug ?? resolveSidebarNavWorkspaceSlug());
  if (!slug) return readSidebarNavCustomRaw();

  const scopedKey = sidebarNavCustomStorageKey(slug);
  const scoped = window.localStorage.getItem(scopedKey);
  if (scoped) return scoped;

  if (slug === DEMO_WORKSPACE_SLUG) {
    const legacyCentral = window.localStorage.getItem(`${SIDEBAR_NAV_CUSTOM_STORAGE_KEY}:central`);
    if (legacyCentral) {
      window.localStorage.setItem(scopedKey, legacyCentral);
      return legacyCentral;
    }
  }

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
   * v4: OnwardAir locked factory order.
   * v5: Talanton locked factory order (superseded by v6 user-order flag).
   * v6: `customized` — when true, Settings order is authoritative and never re-sorted.
   * v7: Talanton owner factory order reset (Aug 2026).
   * v8: ABHI locked factory order + Settings-owned reorder persistence.
   */
  version: 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  /** Ordered workspace section keys (excludes fixed pins + Settings). */
  sectionOrder: string[];
  /** User explicitly reordered in Settings → General → Sidebar. */
  customized: boolean;
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

/** Factory default order for Talanton / OnwardAir (used until user customizes in Settings). */
export function defaultSectionOrder(sections: readonly InternalNavSection[]): string[] {
  const movable = sections.filter(isMovableWorkspaceSection).map(getNavSectionKey);
  if (isOnwardAirLockedSectionBundle(sections)) {
    const known = new Set(movable);
    const locked = ONWARDAIR_LOCKED_SECTION_ORDER_KEYS.filter((key) => known.has(key));
    const extras = movable.filter((key) => !locked.includes(key));
    return [...locked, ...extras];
  }
  if (isTalantonLockedSectionBundle(sections)) {
    return talantonFactorySectionOrder(sections);
  }
  if (isAbhiLockedSectionBundle(sections)) {
    return abhiFactorySectionOrder(sections);
  }
  return movable;
}

export function emptyNavCustomStorage(sections: readonly InternalNavSection[]): SidebarNavCustomStorage {
  return {
    version: targetStorageVersion(sections),
    sectionOrder: defaultSectionOrder(sections),
    customized: false,
    hidden: {},
    customItems: [],
  };
}

/**
 * Keep the user's relative order for known keys; slot newly added modules at their
 * canonical position (beside nearest neighbors) instead of always appending.
 * Only used for factory (non-customized) order when new modules ship.
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

/** Factory order: locked baseline + insert newly shipped modules at factory positions. */
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

/** User-customized order: keep exact sequence; append brand-new modules at the end only. */
function appendNewSectionKeys(
  storedOrder: readonly string[],
  sections: readonly InternalNavSection[],
): string[] {
  const movable = sections.filter(isMovableWorkspaceSection).map(getNavSectionKey);
  const known = new Set(movable);
  const migrated = migrateRenamedSectionKeys(storedOrder, movable);
  const kept = migrated.filter((key) => known.has(key));
  const missing = movable.filter((key) => !kept.includes(key));
  const retired = migrated.filter((key) => !known.has(key));
  return [...kept, ...missing, ...retired];
}

function resolveEffectiveSectionOrder(
  sections: readonly InternalNavSection[],
  sectionOrder: readonly string[],
  customized: boolean,
): string[] {
  if (isTalantonLockedSectionBundle(sections) && !customized) {
    return talantonFactorySectionOrder(sections);
  }
  if (isAbhiLockedSectionBundle(sections) && !customized) {
    return abhiFactorySectionOrder(sections);
  }
  const canonical = defaultSectionOrder(sections);
  if (customized) {
    return appendNewSectionKeys(sectionOrder, sections);
  }
  return resolveSectionOrderForSections(canonical, sections);
}

function buildNavCustomPayload(
  sections: readonly InternalNavSection[],
  parsed: Partial<SidebarNavCustomStorage>,
  customized: boolean,
): SidebarNavCustomStorage {
  const storedOrder = parsed.sectionOrder ?? [];
  return {
    version: targetStorageVersion(sections),
    customized,
    sectionOrder: resolveEffectiveSectionOrder(sections, storedOrder, customized),
    hidden: parsed.hidden ?? {},
    customItems: parsed.customItems ?? [],
    order: parsed.order,
  };
}

export function loadSidebarNavCustom(
  sections: readonly InternalNavSection[],
  workspaceSlug?: string | null,
): SidebarNavCustomStorage {
  const fallback = emptyNavCustomStorage(sections);
  if (typeof window === "undefined") return fallback;

  try {
    const raw =
      migrateLegacySidebarNavCustom(sections, workspaceSlug) ?? readSidebarNavCustomRaw(workspaceSlug);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<SidebarNavCustomStorage>;
    const storedVersion = Number(parsed.version ?? 1);
    const targetVersion = targetStorageVersion(sections);
    const lockedHost = isLockedHostSectionBundle(sections);

    if (isTalantonLockedSectionBundle(sections) && storedVersion < TALANTON_SIDEBAR_FACTORY_REVISION) {
      return talantonFactoryNavCustom(sections, parsed);
    }

    if (
      isAbhiLockedSectionBundle(sections) &&
      storedVersion < ABHI_SIDEBAR_FACTORY_REVISION &&
      parsed.customized !== true
    ) {
      return abhiFactoryNavCustom(sections, parsed);
    }

    if (lockedHost && storedVersion < 6) {
      return buildNavCustomPayload(sections, parsed, parsed.customized === true);
    }

    if (storedVersion < 4) {
      return buildNavCustomPayload(sections, parsed, parsed.customized === true);
    }

    if (isTalantonLockedSectionBundle(sections) && storedVersion < 5) {
      return buildNavCustomPayload(sections, parsed, false);
    }

    return {
      version: targetVersion,
      customized: parsed.customized === true,
      sectionOrder: resolveEffectiveSectionOrder(
        sections,
        parsed.sectionOrder ?? [],
        parsed.customized === true,
      ),
      hidden: parsed.hidden ?? {},
      customItems: parsed.customItems ?? [],
      order: parsed.order,
    };
  } catch {
    return fallback;
  }
}

/**
 * Persist only when storage is missing, needs migration, or brand-new module keys appear.
 * Never re-sort a user-customized order toward the factory baseline.
 */
export function reconcileSidebarNavCustom(
  sections: readonly InternalNavSection[],
  workspaceSlug?: string | null,
): SidebarNavCustomStorage {
  const next = loadSidebarNavCustom(sections, workspaceSlug);
  if (typeof window === "undefined") return next;

  try {
    const raw =
      migrateLegacySidebarNavCustom(sections, workspaceSlug) ?? readSidebarNavCustomRaw(workspaceSlug);
    if (!raw) {
      saveSidebarNavCustom(next, workspaceSlug);
      return next;
    }
    const parsed = JSON.parse(raw) as Partial<SidebarNavCustomStorage>;
    const storedVersion = Number(parsed.version ?? 1);
    const lockedHost = isLockedHostSectionBundle(sections);

    if (
      (storedVersion < 4 && parsed.customized !== true) ||
      (isTalantonLockedSectionBundle(sections) && storedVersion < TALANTON_SIDEBAR_FACTORY_REVISION) ||
      (isAbhiLockedSectionBundle(sections) &&
        storedVersion < ABHI_SIDEBAR_FACTORY_REVISION &&
        parsed.customized !== true) ||
      (isOnwardAirLockedSectionBundle(sections) && storedVersion < 5 && parsed.customized !== true) ||
      (lockedHost && storedVersion < 6 && parsed.customized !== true)
    ) {
      saveSidebarNavCustom(next, workspaceSlug);
      return next;
    }

    if (parsed.customized === true) {
      const movable = sections.filter(isMovableWorkspaceSection).map(getNavSectionKey);
      const prev = parsed.sectionOrder ?? [];
      const missingKeys = movable.filter((key) => !prev.includes(key));
      if (missingKeys.length === 0) return next;
    }

    const movable = sections.filter(isMovableWorkspaceSection).map(getNavSectionKey);
    const prev = parsed.sectionOrder ?? [];
    const missingKeys = movable.filter((key) => !prev.includes(key));
    if (missingKeys.length === 0) return next;

    const payload: SidebarNavCustomStorage = {
      ...next,
      sectionOrder: next.customized
        ? appendNewSectionKeys(prev, sections)
        : appendNewSectionKeys(
            prev.length ? prev : defaultSectionOrder(sections),
            sections,
          ),
    };
    saveSidebarNavCustom(payload, workspaceSlug);
    return payload;
  } catch {
    return next;
  }
}

export function saveSidebarNavCustom(
  next: SidebarNavCustomStorage,
  workspaceSlug?: string | null,
) {
  if (typeof window === "undefined") return;
  const payload: SidebarNavCustomStorage = {
    version: next.version,
    sectionOrder: next.sectionOrder,
    customized: next.customized === true,
    hidden: next.hidden,
    customItems: next.customItems,
  };
  window.localStorage.setItem(sidebarNavCustomStorageKey(workspaceSlug), JSON.stringify(payload));
  window.dispatchEvent(new CustomEvent(SIDEBAR_NAV_CUSTOM_EVENT));
}

/** Mark storage as user-owned (call from Settings when the user reorders). */
export function saveUserSidebarSectionOrder(
  sections: readonly InternalNavSection[],
  sectionOrder: readonly string[],
  current: Pick<SidebarNavCustomStorage, "hidden" | "customItems">,
  workspaceSlug?: string | null,
): SidebarNavCustomStorage {
  const payload: SidebarNavCustomStorage = {
    version: targetStorageVersion(sections),
    customized: true,
    sectionOrder: [...sectionOrder],
    hidden: current.hidden,
    customItems: current.customItems,
  };
  saveSidebarNavCustom(payload, workspaceSlug);
  return payload;
}

/** Reorder movable workspace sections; pins stay first, Settings stays last. */
export function applySidebarSectionOrder(
  sections: readonly InternalNavSection[],
  custom: Pick<SidebarNavCustomStorage, "sectionOrder" | "customized">,
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

  const effectiveOrder = resolveEffectiveSectionOrder(
    sections,
    custom.sectionOrder,
    custom.customized === true,
  );

  const byKey = new Map(movable.map((section) => [getNavSectionKey(section), section]));
  const ordered: InternalNavSection[] = [];
  for (const key of effectiveOrder) {
    const section = byKey.get(key);
    if (section) {
      ordered.push(section);
      byKey.delete(key);
    }
  }
  for (const section of byKey.values()) ordered.push(section);

  return [...pins, ...ordered, ...(settings ? [settings] : [])];
}

/** Move one workspace section key to another index in the movable order list. */
export function reorderSectionKeys(
  keys: readonly string[],
  activeKey: string,
  overKey: string,
): string[] | null {
  const from = keys.indexOf(activeKey);
  const to = keys.indexOf(overKey);
  if (from < 0 || to < 0 || from === to) return null;
  const next = [...keys];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item!);
  return next;
}

/** Move a workspace section key up or down by exactly one slot in the movable order list. */
export function moveSectionKey(
  keys: readonly string[],
  key: string,
  direction: "up" | "down",
): string[] | null {
  const index = keys.indexOf(key);
  if (index < 0) return null;
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= keys.length) return null;
  return reorderSectionKeys(keys, key, keys[targetIndex]!);
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
