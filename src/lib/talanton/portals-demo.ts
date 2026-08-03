/** Talanton Impact pre-demo portals page — auth helpers + editable content defaults. */

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

export const DEFAULT_MAJOR_MODULES: PortalsModuleRow[] = [
  row("m1", "Home dashboard"),
  row("m2", "AI Executive Assistant"),

  row("m3", "Funds"),
  row("m3a", "Fund Dashboard", 1),
  row("m3b", "Impact Fund", 1),
  row("m3c", "Momentum Fund", 1),
  row("m3d", "Stewards Fund", 1),

  row("m4", "Portfolio Companies"),
  row("m4a", "Dashboard", 1),
  row("m4b", "Directory", 1),

  row("m5", "Talanton Intelligence"),
  row("m5a", "Portfolio Intelligence", 1),
  row("m5b", "Executive Briefing", 2),
  row("m5c", "Company Intelligence", 2),
  row("m5d", "Impact Intelligence", 1),
  row("m5e", "Impact Dashboard", 2),
  row("m5f", "Company Impact", 2),
  row("m5g", "Opportunity Intelligence", 1),

  row("m6", "Marketing & Stories"),
  row("m6a", "Portfolio Stories", 1),
  row("m6b", "Digital Newsletter", 1),
  row("m6c", "Media Library", 1),
  row("m6d", "Mailing List Management", 1),

  row("m7", "Board"),
  row("m7a", "Board Dashboard", 1),
  row("m7b", "Board Meetings", 1),
  row("m7c", "Board Decks", 1),
  row("m7d", "Minutes & Decisions", 1),
  row("m7e", "Risk Register", 1),
  row("m7f", "Board Members", 1),

  row("m8", "Business Central"),
  row("m8a", "Projects", 1),
  row("m8b", "Internal Projects", 2),
  row("m8c", "External Projects", 2),

  row("m9", "Financials"),
  row("m9a", "Dashboard", 1),
  row("m9b", "General Ledger", 1),
  row("m9c", "Accounts Receivable", 1),
  row("m9d", "Accounts Payable", 1),
  row("m9e", "Expenses", 1),
  row("m9f", "Bank", 1),
  row("m9g", "Financial Reports", 1),

  row("m10", "Human Resources"),
  row("m10a", "Dashboard", 1),
  row("m10b", "Employees", 1),
  row("m10c", "Org Chart", 1),
  row("m10d", "Recruitment", 1),
  row("m10e", "Time & Attendance", 1),
  row("m10f", "Payroll", 1),
  row("m10g", "Performance", 1),
  row("m10h", "HR Reports", 1),

  row("m11", "Corporate Information"),
  row("m11a", "Dashboard", 1),
  row("m11b", "Cap Table Management", 1),
  row("m11c", "Company Details", 1),
  row("m11d", "Office Locations", 1),
  row("m11e", "Bank Accounts", 1),
  row("m11f", "Board of Directors", 1),
  row("m11g", "Professional Advisors", 1),
  row("m11h", "Contracts", 1),
  row("m11i", "Risk Register", 1),

  row("m12", "Technology Management"),
  row("m12a", "Dashboard", 1),
  row("m12b", "Devices", 1),
  row("m12c", "Software & SaaS", 1),
  row("m12d", "Telecommunications", 1),
  row("m12e", "Technology Assets", 1),

  row("m13", "Business Productivity"),
  row("m13a", "Dashboard", 1),
  row("m13b", "Email", 1),
  row("m13c", "Calendar", 1),
  row("m13d", "Messaging", 1),
  row("m13e", "Communications", 1),
  row("m13f", "Social", 1),
  row("m13g", "Support Desk", 1),
  row("m13h", "Whiteboard", 1),

  row("m14", "Operations"),
  row("m14a", "Assets", 1),
  row("m14b", "Inventory", 1),
  row("m14c", "Procurement", 1),
  row("m14d", "Logistics", 1),

  row("m15", "Training"),
  row("m15a", "Dashboard", 1),
  row("m15b", "Staff Courses", 1),
  row("m15c", "Portfolio Courses", 1),
  row("m15d", "Course Management", 1),

  row("m16", "Tools"),
  row("m16a", "Integrations", 1),
  row("m16b", "Users", 1),

  row("m17", "External Client Access"),
  row("m17a", "Dashboard", 1),
  row("m17b", "External Users", 1),

  row("m18", "Settings"),
  row("m18a", "Profile", 1),
  row("m18b", "General", 1),
  row("m18c", "Billing", 1),
  row("m18d", "Appearance", 1),
];

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
    majorModules: DEFAULT_MAJOR_MODULES.map((entry) => ({ ...entry })),
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
