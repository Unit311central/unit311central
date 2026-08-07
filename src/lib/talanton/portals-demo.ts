/** Talanton Impact pre-demo portals page — auth helpers + editable content defaults. */

import { buildTalantonPortalsMajorModules } from "@/lib/talanton/portals-nav-sync";

export const TALANTON_DEMO_PLATFORM_USERNAME = "demo@talantonimpact.com";
export const TALANTON_PORTALS_ADMIN_USERNAME = "admin@talantonimpact.com";
export const TALANTON_PORTALS_SHARED_PASSWORD = "Africa1999$";

export type PortalsIndent = 0 | 1 | 2;

export type PortalsModuleRow = {
  id: string;
  text: string;
  /** 0 = top-level, 1 = sub-row, 2 = sub-sub-row. */
  indent?: PortalsIndent;
};

export type TalantonPortalsEditableContent = {
  majorModules: PortalsModuleRow[];
  customModules: PortalsModuleRow[];
};

function row(id: string, text: string, indent: PortalsIndent = 0): PortalsModuleRow {
  return { id, text, indent };
}

export const DEFAULT_CUSTOM_MODULES: PortalsModuleRow[] = [
  row("c1", "Portfolio Intelligence (Executive Briefing + Company Intelligence)"),
  row("c2", "Impact Intelligence (portfolio + company)"),
  row("c3", "Opportunity Intelligence"),
  row("c4", "Funds — Impact / Momentum / Stewards"),
  row("c5", "Board Portal + Impact Intelligence for directors"),
  row("c6", "Portfolio company portals (route-based)"),
  row("c7", "Marketing & Stories + Digital Newsletter"),
  row("c8", "Board pack generation via AI Executive Assistant"),
  row("c9", "Impact Health Score and jobs / people served KPIs"),
  row("c10", "Portfolio Company Map on Home"),
  row("c11", "Training across staff and portfolio companies"),
  row("c12", "Custom messaging and chat channels"),
  row("c13", "Internal to internal and external voice and video — no separate app"),
  row("c14", "Customised views per logged in user"),
  row("c15", "Works as app on Apple or Android"),
];

export function defaultTalantonPortalsContent(): TalantonPortalsEditableContent {
  return {
    majorModules: buildTalantonPortalsMajorModules().map((entry) => ({ ...entry })),
    customModules: DEFAULT_CUSTOM_MODULES.map((entry) => ({ ...entry })),
  };
}

export function normalizeUsername(username: string | null | undefined): string {
  return String(username ?? "")
    .trim()
    .toLowerCase();
}

export function isTalantonDemoPlatformUsername(username: string | null | undefined): boolean {
  return normalizeUsername(username) === TALANTON_DEMO_PLATFORM_USERNAME;
}

export function isTalantonPortalsAdminUsername(username: string | null | undefined): boolean {
  return normalizeUsername(username) === TALANTON_PORTALS_ADMIN_USERNAME;
}

/** Platform users allowed onto /portals (Talanton demo/admin). */
export function isTalantonPortalsAllowedUsername(username: string | null | undefined): boolean {
  return isTalantonDemoPlatformUsername(username) || isTalantonPortalsAdminUsername(username);
}

export function newPortalsRowId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function portalsRowIndent(row: PortalsModuleRow | null | undefined): PortalsIndent {
  if (row?.indent === 2) return 2;
  if (row?.indent === 1) return 1;
  return 0;
}

/** End index (exclusive) of a row plus all deeper descendants. */
export function portalsRowBlockEnd(rows: PortalsModuleRow[], start: number): number {
  const base = portalsRowIndent(rows[start]);
  let end = start + 1;
  while (end < rows.length && portalsRowIndent(rows[end]) > base) end += 1;
  return end;
}

export function sanitizePortalsContent(raw: unknown): TalantonPortalsEditableContent {
  const fallback = defaultTalantonPortalsContent();
  if (!raw || typeof raw !== "object") return fallback;
  const body = raw as Partial<TalantonPortalsEditableContent>;

  function cleanRows(value: unknown, kind: "customModules"): PortalsModuleRow[] {
    if (!Array.isArray(value)) return fallback[kind];
    const rows: PortalsModuleRow[] = [];
    for (const entry of value) {
      if (!entry || typeof entry !== "object") continue;
      const text = String((entry as PortalsModuleRow).text ?? "");
      const rawIndent = (entry as PortalsModuleRow).indent;
      const indent: PortalsIndent = rawIndent === 2 ? 2 : rawIndent === 1 ? 1 : 0;
      const id =
        typeof (entry as PortalsModuleRow).id === "string" && (entry as PortalsModuleRow).id
          ? String((entry as PortalsModuleRow).id)
          : newPortalsRowId("c");
      rows.push({ id, text, indent });
    }
    return rows.length > 0 ? rows : fallback[kind];
  }

  return {
    majorModules: buildTalantonPortalsMajorModules(),
    customModules: cleanRows(body.customModules, "customModules"),
  };
}
