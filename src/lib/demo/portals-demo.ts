/** Northstar Demo pre-demo portals page — editable content defaults. */

import {
  DEMO_PORTALS_ADMIN_USERNAME,
  DEMO_PORTALS_PLATFORM_PASSWORD,
  DEMO_PORTALS_PLATFORM_USERNAME,
  isDemoPortalsAdminUsername,
  isDemoPortalsAllowedUsername,
  isDemoPortalsPlatformUsername,
  normalizeUsername,
} from "@/lib/demo/portals-auth";
import type { PortalsEditableContent } from "@/lib/portals/types";

export {
  DEMO_PORTALS_ADMIN_USERNAME,
  DEMO_PORTALS_PLATFORM_PASSWORD,
  DEMO_PORTALS_PLATFORM_USERNAME,
  isDemoPortalsAdminUsername,
  isDemoPortalsAllowedUsername,
  isDemoPortalsPlatformUsername,
  normalizeUsername,
};

export type PortalsIndent = 0 | 1 | 2 | 3;

export type PortalsModuleRow = {
  id: string;
  text: string;
  indent?: PortalsIndent;
};

export type NorthstarDemoPortalsEditableContent = PortalsEditableContent;

function loadDemoPortalsMajorModules() {
  const { buildDemoPortalsMajorModules } =
    require("@/lib/demo/portals-nav-sync") as typeof import("@/lib/demo/portals-nav-sync");
  return buildDemoPortalsMajorModules();
}

export function defaultNorthstarDemoPortalsContent(): NorthstarDemoPortalsEditableContent {
  return {
    majorModules: loadDemoPortalsMajorModules().map((entry) => ({ ...entry })),
    customModules: [],
  };
}

export function newPortalsRowId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function portalsRowIndent(row: PortalsModuleRow | null | undefined): PortalsIndent {
  if (row?.indent === 3) return 3;
  if (row?.indent === 2) return 2;
  if (row?.indent === 1) return 1;
  return 0;
}

export function portalsRowBlockEnd(rows: PortalsModuleRow[], start: number): number {
  const base = portalsRowIndent(rows[start]);
  let end = start + 1;
  while (end < rows.length && portalsRowIndent(rows[end]) > base) end += 1;
  return end;
}

export function sanitizeNorthstarDemoPortalsContent(raw: unknown): NorthstarDemoPortalsEditableContent {
  void raw;
  return {
    majorModules: loadDemoPortalsMajorModules().map((entry) => ({ ...entry })),
    customModules: [],
  };
}
