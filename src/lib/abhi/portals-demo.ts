/** ABHI pre-demo portals page — auth helpers + editable content defaults. */

export const ABHI_DEMO_PLATFORM_USERNAME = "demo@abhi.org.uk";
export const ABHI_PORTALS_ADMIN_USERNAME = "admin@abhi.org.uk";
export const ABHI_PORTALS_SHARED_PASSWORD = "London1999$";

export type PortalsModuleRow = {
  id: string;
  text: string;
  /** 0 = top-level, 1 = nested under previous parent (column 2). */
  indent?: 0 | 1;
};

export type AbhiPortalsEditableContent = {
  majorModules: PortalsModuleRow[];
  customModules: PortalsModuleRow[];
};

function row(id: string, text: string, indent: 0 | 1 = 0): PortalsModuleRow {
  return { id, text, indent };
}

export const DEFAULT_MAJOR_MODULES: PortalsModuleRow[] = [
  row("m1", "Home dashboard"),
  row("m2", "AI Executive Assistant"),
  row("m3", "Business Central"),
  row("m4", "Members"),
  row("m5", "Dashboard Overview", 1),
  row("m6", "Member Directory", 1),
  row("m6b", "Member Intelligence", 1),
  row("m6c", "Regulatory Intelligence"),
  row("m6d", "Dashboard", 1),
  row("m6e", "Regulatory Updates", 1),
  row("m6f", "Impact Assessments", 1),
  row("m6g", "Member Alerts", 1),
  row("m7", "Customer Management"),
  row("m8", "Pipeline", 1),
  row("m9", "Discovery Calls", 1),
  row("m10", "Member onboarding", 1),
  row("m11", "Projects"),
  row("m12", "Internal projects", 1),
  row("m13", "External projects", 1),
  row("m14", "Grants", 1),
  row("m15", "Partners"),
  row("m16", "Financials"),
  row("m17", "Human Resources"),
  row("m18", "Marketing and Events"),
  row("m19", "Corporate Information"),
  row("m20", "Technology Management"),
  row("m21", "Business Productivity"),
  row("m22", "Operations"),
  row("m23", "Training"),
  row("m24", "QMS"),
  row("m25", "Tools"),
  row("m26", "External Client Access"),
  row("m27", "Settings"),
];

export const DEFAULT_CUSTOM_MODULES: PortalsModuleRow[] = [
  row("c1", "Member and Relationship"),
  row("c2", "Regulatory Intelligence Hub"),
  row("c3", "Board Portal"),
  row("c4", "Member Portal"),
  row("c5", "External events"),
  row("c6", "ABHI events"),
  row("c7", "Digital Newsletter"),
  row("c8", "ABHI Working groups"),
  row("c9", "ABHI Accelerators"),
  row("c10", "Mailing List Management"),
  row("c11", "Social media"),
  row("c12", "Create training course from document upload"),
  row("c13", "Board pack automated via AI Exec Assistant"),
  row("c14", "Custom messaging and chat channels"),
  row("c15", "Internal to internal and external voice and video — no separate app"),
  row("c16", "Customised views per logged in user"),
  row("c17", "Move away from using your website for data repository"),
  row("c18", "UK Healthcare pavilion management"),
  row("c19", "Works as app on Apple or Android"),
];

export function defaultAbhiPortalsContent(): AbhiPortalsEditableContent {
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

export function isAbhiDemoPlatformUsername(username: string | null | undefined): boolean {
  return normalizeUsername(username) === ABHI_DEMO_PLATFORM_USERNAME;
}

export function isAbhiPortalsAdminUsername(username: string | null | undefined): boolean {
  return normalizeUsername(username) === ABHI_PORTALS_ADMIN_USERNAME;
}

/** Platform users allowed onto /portals (and ABHI org login for this demo). */
export function isAbhiPortalsAllowedUsername(username: string | null | undefined): boolean {
  return isAbhiDemoPlatformUsername(username) || isAbhiPortalsAdminUsername(username);
}

export function newPortalsRowId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function sanitizePortalsContent(raw: unknown): AbhiPortalsEditableContent {
  const fallback = defaultAbhiPortalsContent();
  if (!raw || typeof raw !== "object") return fallback;
  const body = raw as Partial<AbhiPortalsEditableContent>;

  function cleanRows(value: unknown, prefix: string): PortalsModuleRow[] {
    if (!Array.isArray(value)) return fallback[prefix === "m" ? "majorModules" : "customModules"];
    const rows: PortalsModuleRow[] = [];
    for (const entry of value) {
      if (!entry || typeof entry !== "object") continue;
      const text = String((entry as PortalsModuleRow).text ?? "").trim();
      if (!text) continue;
      const indent = (entry as PortalsModuleRow).indent === 1 ? 1 : 0;
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
