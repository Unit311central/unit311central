/** OnwardAir pre-demo portals page — auth helpers + editable content defaults. */

export const ONWARDAIR_DEMO_PLATFORM_USERNAME = "demo@onwardair.tech";
export const ONWARDAIR_PORTALS_ADMIN_USERNAME = "admin@onwardair.tech";
export const ONWARDAIR_PORTALS_SHARED_PASSWORD = "Houston1999$";

export type PortalsIndent = 0 | 1 | 2;

export type PortalsModuleRow = {
  id: string;
  text: string;
  /** 0 = top-level, 1 = sub-row, 2 = sub-sub-row. */
  indent?: PortalsIndent;
};

export type OnwardAirPortalsEditableContent = {
  majorModules: PortalsModuleRow[];
  customModules: PortalsModuleRow[];
};

function row(id: string, text: string, indent: PortalsIndent = 0): PortalsModuleRow {
  return { id, text, indent };
}

export const DEFAULT_MAJOR_MODULES: PortalsModuleRow[] = [
  row("m1", "Home dashboard"),
  row("m2", "AI Executive Assistant"),

  row("m3", "OnwardAir Intelligence"),
  row("m3a", "Competitor Intelligence", 1),
  row("m3b", "Ecosystem Partners", 1),

  row("m4", "Project Management"),
  row("m4a", "Dashboard", 1),
  row("m4b", "Internal Projects", 1),
  row("m4c", "External Projects", 1),

  row("m5", "Business Central"),
  row("m5a", "Clients", 1),
  row("m5b", "CRM", 1),

  row("m6", "Engineering"),
  row("m6a", "Overview", 1),
  row("m6b", "Programs & Milestones", 1),
  row("m6c", "Assurance & Certification", 1),
  row("m6d", "Engineering Risks", 1),

  row("m7", "IP & Patents"),
  row("m7a", "IP Overview", 1),
  row("m7b", "Patent Register", 1),
  row("m7c", "Patent Portfolio", 1),

  row("m8", "Fundraising"),
  row("m8a", "Pipeline", 1),
  row("m8b", "Meetings", 1),
  row("m8c", "Pitch Decks", 1),
  row("m8d", "Data Rooms", 1),

  row("m9", "Board"),
  row("m9a", "Dashboard", 1),
  row("m9b", "Board Meetings", 1),
  row("m9c", "Board Packs", 1),
  row("m9d", "Risk Register", 1),
  row("m9e", "Board Members", 1),

  row("m10", "Financials"),
  row("m10a", "Dashboard", 1),
  row("m10b", "General Ledger", 1),
  row("m10c", "AR", 1),
  row("m10d", "AP", 1),
  row("m10e", "Expenses", 1),
  row("m10f", "Banks", 1),
  row("m10g", "Financial Reports", 1),

  row("m11", "Human Resources"),
  row("m11a", "Dashboard", 1),
  row("m11b", "Employees", 1),
  row("m11c", "Org Chart", 1),
  row("m11d", "Recruitment", 1),
  row("m11e", "Payroll", 1),

  row("m12", "Marketing & Events"),
  row("m12a", "Dashboard", 1),
  row("m12b", "Social", 1),
  row("m12c", "Digital Newsletter", 1),
  row("m12d", "External Events", 1),

  row("m13", "Corporate Information"),
  row("m13a", "Company Details", 1),
  row("m13b", "Cap Table", 1),
  row("m13c", "Office Locations", 1),

  row("m14", "Technology Management"),
  row("m14a", "Devices", 1),
  row("m14b", "Software & SaaS", 1),

  row("m15", "Business Productivity"),
  row("m15a", "Email", 1),
  row("m15b", "Calendar", 1),
  row("m15c", "Messaging", 1),
  row("m15d", "Support Desk", 1),

  row("m16", "Operations"),
  row("m16a", "Assets", 1),
  row("m16b", "Inventory", 1),
  row("m16c", "Procurement", 1),

  row("m17", "Training"),
  row("m17a", "Dashboard", 1),
  row("m17b", "Courses", 1),

  row("m18", "QMS"),
  row("m18a", "Document Control", 1),
  row("m18b", "CAPA", 1),
  row("m18c", "Internal Audits", 1),

  row("m19", "External Client Access"),
  row("m19a", "Dashboard", 1),
  row("m19b", "External Users", 1),

  row("m20", "Settings"),
  row("m20a", "Profile", 1),
  row("m20b", "Users", 1),
  row("m20c", "General", 1),
];

export const DEFAULT_CUSTOM_MODULES: PortalsModuleRow[] = [
  row("c1", "Competitor Intelligence (certification-race public signals)"),
  row("c2", "Ecosystem Partners (pre-ops stakeholder register)"),
  row("c3", "Board Portal"),
  row("c4", "Client portal — Coastal Freight Partners"),
  row("c5", "FAA / AS9100 certification programme tracking"),
  row("c6", "Engineering Assurance & Certification"),
  row("c7", "IP & Patents register"),
  row("c8", "Board pack generation via AI Executive Assistant"),
  row("c9", "Fundraising pipeline + data rooms"),
  row("c10", "QMS aligned to aerospace (AS9100)"),
  row("c11", "Custom messaging and chat channels"),
  row("c12", "Works as app on Apple or Android"),
];

export function defaultOnwardAirPortalsContent(): OnwardAirPortalsEditableContent {
  return {
    majorModules: DEFAULT_MAJOR_MODULES.map((entry) => ({ ...entry })),
    customModules: DEFAULT_CUSTOM_MODULES.map((entry) => ({ ...entry })),
  };
}

export function normalizeUsername(username: string | null | undefined): string {
  return String(username ?? "")
    .trim()
    .toLowerCase();
}

export function isOnwardAirDemoPlatformUsername(username: string | null | undefined): boolean {
  return normalizeUsername(username) === ONWARDAIR_DEMO_PLATFORM_USERNAME;
}

export function isOnwardAirPortalsAdminUsername(username: string | null | undefined): boolean {
  return normalizeUsername(username) === ONWARDAIR_PORTALS_ADMIN_USERNAME;
}

/** Platform users allowed onto /portals (OnwardAir demo/admin). */
export function isOnwardAirPortalsAllowedUsername(username: string | null | undefined): boolean {
  return isOnwardAirDemoPlatformUsername(username) || isOnwardAirPortalsAdminUsername(username);
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

export function sanitizePortalsContent(raw: unknown): OnwardAirPortalsEditableContent {
  const fallback = defaultOnwardAirPortalsContent();
  if (!raw || typeof raw !== "object") return fallback;
  const body = raw as Partial<OnwardAirPortalsEditableContent>;

  function cleanRows(value: unknown, prefix: string): PortalsModuleRow[] {
    if (!Array.isArray(value)) return fallback[prefix === "m" ? "majorModules" : "customModules"];
    const rows: PortalsModuleRow[] = [];
    for (const entry of value) {
      if (!entry || typeof entry !== "object") continue;
      const text = String((entry as PortalsModuleRow).text ?? "");
      const rawIndent = (entry as PortalsModuleRow).indent;
      const indent: PortalsIndent = rawIndent === 2 ? 2 : rawIndent === 1 ? 1 : 0;
      const id =
        typeof (entry as PortalsModuleRow).id === "string" && (entry as PortalsModuleRow).id
          ? String((entry as PortalsModuleRow).id)
          : newPortalsRowId(prefix);
      rows.push({ id, text, indent });
    }
    return rows.length > 0
      ? rows
      : fallback[prefix === "m" ? "majorModules" : "customModules"];
  }

  return {
    majorModules: cleanRows(body.majorModules, "m"),
    customModules: cleanRows(body.customModules, "c"),
  };
}
